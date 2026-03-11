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
MODEL_NAME = "all-MiniLM-L6-v2"

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


# ── Load model and build / load embeddings at startup ──────────────────────

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
    threshold = float(body.get("threshold", 0.25))

    if not query:
        return jsonify({"chunks": []})

    q_emb = model.encode([query])[0]
    scores = [cosine_sim(q_emb, emb) for emb in embeddings]
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    results = [
        {"text": chunks[i], "score": round(s, 4)}
        for i, s in ranked[:top_k]
        if s >= threshold
    ]

    return jsonify({"chunks": [r["text"] for r in results], "scored": results})


@app.route("/rebuild", methods=["POST"])
def rebuild():
    """Force-rebuild embeddings from the data file."""
    global chunks, embeddings
    chunks = load_chunks(DATA_PATH)
    embeddings = model.encode(chunks, show_progress_bar=False, batch_size=32)
    with open(EMBEDDINGS_PATH, "wb") as f:
        pickle.dump({"chunks": chunks, "embeddings": embeddings}, f)
    return jsonify({"status": "rebuilt", "chunks": len(chunks)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
