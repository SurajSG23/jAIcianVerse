import os
import re
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "college.data.txt")
EMBEDDINGS_PATH = os.path.join(BASE_DIR, "embeddings.pkl")
NOTES_DATA_DIR = os.path.join(BASE_DIR, "notes_data")
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dimension

os.makedirs(NOTES_DATA_DIR, exist_ok=True)

# ── Helpers ────────────────────────────────────────────────────────────────

def load_chunks(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    return [
        p.strip()
        for p in re.split(r"\n\s*\n", text)
        if len(p.strip()) > 40
    ]


def cosine_sim(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))


# ── Per-note (subject-unit) storage helpers ───────────────────────────────

def get_note_path(note_key):
    return os.path.join(NOTES_DATA_DIR, f"{note_key}.pkl")


def load_note_store(note_key):
    path = get_note_path(note_key)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return {"chunks": [], "embeddings": np.empty((0, EMBEDDING_DIM))}


def save_note_store(note_key, store):
    path = get_note_path(note_key)
    with open(path, "wb") as f:
        pickle.dump(store, f)


# ── Load model and build / load global embeddings at startup ──────────────

print(f"[RAG] Loading embedding model: {MODEL_NAME} ...")
model = SentenceTransformer(MODEL_NAME)

if os.path.exists(EMBEDDINGS_PATH):
    print(f"[RAG] Loading pre-built embeddings from {EMBEDDINGS_PATH}")
    with open(EMBEDDINGS_PATH, "rb") as f:
        store = pickle.load(f)
    chunks = store["chunks"]
    embeddings = store["embeddings"]
else:
    print("[RAG] Building embeddings from college.data.txt ...")
    chunks = load_chunks(DATA_PATH)
    embeddings = model.encode(chunks, show_progress_bar=True, batch_size=32)
    with open(EMBEDDINGS_PATH, "wb") as f:
        pickle.dump({"chunks": chunks, "embeddings": embeddings}, f)
    print(f"[RAG] Saved embeddings.pkl  ({len(chunks)} chunks)")

print(f"[RAG] Ready — {len(chunks)} chunks indexed.")


# ── Routes ─────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "chunks": len(chunks)})


@app.route("/search", methods=["POST"])
def search():
    body = request.get_json(force=True)
    query = body.get("query", "").strip()
    top_k = int(body.get("topK", 4))
    threshold = float(body.get("threshold", 0.10))
    note_key = body.get("noteKey", "").strip()

    if not query:
        return jsonify({"chunks": []})

    q_emb = model.encode([query])[0]

    # Use note-specific embeddings when noteKey is provided
    if note_key:
        note_store = load_note_store(note_key)
        search_chunks = note_store["chunks"]
        search_embeddings = note_store["embeddings"]
    else:
        search_chunks = chunks
        search_embeddings = embeddings

    if len(search_chunks) == 0:
        return jsonify({"chunks": [], "scored": []})

    scores = [cosine_sim(q_emb, emb) for emb in search_embeddings]
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)

    # For note-specific searches, always return topK chunks (the notes are
    # already scoped to the correct subject/unit, so even lower-scored chunks
    # provide useful context).  For global searches, apply the threshold.
    if note_key:
        results = [
            {"text": search_chunks[i], "score": round(s, 4)}
            for i, s in ranked[:top_k]
            if s >= threshold
        ]
        # If threshold filtered too aggressively, return at least topK anyway
        if len(results) < top_k and len(search_chunks) >= top_k:
            results = [
                {"text": search_chunks[i], "score": round(s, 4)}
                for i, s in ranked[:top_k]
            ]
    else:
        results = [
            {"text": search_chunks[i], "score": round(s, 4)}
            for i, s in ranked[:top_k]
            if s >= threshold
        ]

    return jsonify({"chunks": [r["text"] for r in results], "scored": results})


@app.route("/ingest", methods=["POST"])
def ingest():
    body = request.get_json(force=True)
    note_key = body.get("noteKey", "").strip()
    chunks_text = body.get("chunks", [])

    if not note_key or not chunks_text:
        return jsonify({"error": "noteKey and chunks are required"}), 400

    note_store = load_note_store(note_key)

    new_embeddings = model.encode(chunks_text, show_progress_bar=False, batch_size=32)

    note_store["chunks"].extend(chunks_text)

    if note_store["embeddings"].size == 0:
        note_store["embeddings"] = new_embeddings
    else:
        note_store["embeddings"] = np.vstack([note_store["embeddings"], new_embeddings])

    save_note_store(note_key, note_store)

    return jsonify({
        "status": "ingested",
        "noteKey": note_key,
        "chunksAdded": len(chunks_text),
        "totalChunks": len(note_store["chunks"]),
    })


@app.route("/rebuild", methods=["POST"])
def rebuild():
    """Force-rebuild global embeddings from the data file."""
    global chunks, embeddings
    chunks = load_chunks(DATA_PATH)
    embeddings = model.encode(chunks, show_progress_bar=False, batch_size=32)
    with open(EMBEDDINGS_PATH, "wb") as f:
        pickle.dump({"chunks": chunks, "embeddings": embeddings}, f)
    return jsonify({"status": "rebuilt", "chunks": len(chunks)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
