# AI-Server — RAG (Retrieval-Augmented Generation) Documentation

This folder contains the **Node.js API server** that talks to **Ollama** for text generation, and (optionally) uses a **Python semantic search service** to implement **RAG**.

If you only call `/generate`, it’s “LLM only”.
If you call `/rag-generate`, the server first **retrieves relevant knowledge chunks** and then asks the model to answer using that context.

---

## 1) What is RAG? (simple explanation)

**RAG = Retrieval + Generation**

- **Retrieval**: find the most relevant pieces (“chunks”) from a knowledge base (your `college.data.txt`).
- **Generation**: send the user question + retrieved chunks to the LLM (Ollama model) so the answer is grounded in the retrieved text.

Why RAG is useful:
- You can update knowledge by changing the text file and rebuilding embeddings, without retraining the model.
- It reduces hallucinations for factual questions because the model is given the correct context.

---

## 2) High-level end-to-end flow

### Without RAG

```
Client → POST /generate → Ollama (/api/chat) → response
```

### With RAG

```
Client → POST /rag-generate
          ↓
     retrieveContext(prompt)
          ↓
   Python RAG-BOT /search returns top chunks
          ↓
Node app injects chunks into the system prompt
          ↓
Ollama (/api/chat) generates final response
```

---

## 3) File-by-file: what each file does

### Node (this AI-Server)

- [AI-Server/server.js](server.js)
  - Express server exposing two endpoints:
    - `POST /generate` → direct LLM answer (no retrieval)
    - `POST /rag-generate` → retrieval first, then generation
  - RAG logic in this route:
    1) validate input prompt
    2) call `retrieveContext(prompt)`
    3) append retrieved chunks to the `systemPrompt`
    4) call `generateText(prompt, augmentedSystem)`

- [AI-Server/ollama.js](ollama.js)
  - Wrapper for calling Ollama’s chat endpoint:
    - sends `system` + `user` messages to `POST {OLLAMA_URL}/api/chat`
    - returns the assistant message content
  - Uses env vars:
    - `OLLAMA_URL` (example: `http://localhost:11434`)
    - `OLLAMA_MODEL` (example: `jaicianverse`)

- [AI-Server/rag.js](rag.js)
  - Calls the Python semantic-search service (RAG-BOT):
    - `POST {RAG_SERVICE_URL}/search` with `{ query, topK }`
  - Returns an array of text chunks (or `[]` on failure)
  - Uses env var:
    - `RAG_SERVICE_URL` (default `http://localhost:5001`)

- [AI-Server/package.json](package.json)
  - Dependencies for Express + fetch + CORS + dotenv.
  - Start command:
    - `npm start` (runs `nodemon server.js`)

- [AI-Server/data/college.data.txt](data/college.data.txt)
  - The knowledge base used by the Python RAG-BOT service.
  - The Python service chunks it by blank lines, embeds each chunk, and searches via cosine similarity.

### Python semantic search service (RAG-BOT)

The RAG retrieval part is implemented in [AI-Server/RAG-BOT/app.py](RAG-BOT/app.py).

- [AI-Server/RAG-BOT/app.py](RAG-BOT/app.py)
  - Flask API that performs **semantic search** using sentence embeddings.
  - Embedding model:
    - `all-MiniLM-L6-v2` from `sentence-transformers`
    - embedding dimension: 384
  - Data source:
    - loads [AI-Server/data/college.data.txt](data/college.data.txt)
    - splits into paragraphs/chunks separated by blank lines
  - At startup:
    - if [AI-Server/RAG-BOT/embeddings.pkl](RAG-BOT/embeddings.pkl) exists → loads it
    - else → builds embeddings from the text file and saves them
  - Endpoints:
    - `GET /health` → server status + number of indexed chunks
    - `POST /search` → returns topK most relevant chunks
    - `POST /ingest` → add note-specific chunks (stored under `notes_data/`)
    - `POST /rebuild` → force rebuild global embeddings from `college.data.txt`

- [AI-Server/RAG-BOT/embeddings.pkl](RAG-BOT/embeddings.pkl)
  - Cached global embeddings for `college.data.txt` so startup is fast.

- [AI-Server/RAG-BOT/notes_data/](RAG-BOT/notes_data/)
  - Per-`noteKey` vector stores.
  - Used when the client wants retrieval scoped to a specific unit/subject.

- [AI-Server/RAG-BOT/requirements.txt](RAG-BOT/requirements.txt)
  - Python dependencies for semantic search.

- [AI-Server/RAG-BOT/test_search.py](RAG-BOT/test_search.py)
  - CLI script to test retrieval quality (prints top chunks + similarity scores).

---

## 4) API endpoints (Node)

### `POST /generate` (no RAG)

Request body:
```json
{
  "prompt": "Who is the Vice Chancellor of JSS STU?",
  "systemPrompt": "(optional)"
}
```

Response:
```json
{ "response": "..." }
```

### `POST /rag-generate` (RAG)

Same request body:
```json
{
  "prompt": "Tell me about SJCE-STEP",
  "systemPrompt": "(optional)"
}
```

What changes internally:
- The server calls the Python `/search` endpoint to get relevant chunks.
- Those chunks are appended into the **system prompt** like:
  - `Relevant university knowledge base context: ...`
- Then the model is asked to answer using that context.

---

## 5) How retrieval works (Python RAG-BOT)

### Chunking

- The knowledge base file is split on blank lines.
- Very short paragraphs are ignored (less than ~40 characters).

### Embeddings

- Each chunk is converted to a vector using `SentenceTransformer("all-MiniLM-L6-v2")`.
- The query is embedded the same way.

### Similarity + ranking

- Cosine similarity is computed between query embedding and each chunk embedding.
- Top results are returned.

`/search` supports:
- `topK` (how many chunks)
- `threshold` (minimum similarity)
- `noteKey` (switches to a note-specific store)

---

## 6) Setup: environment variables

### Node (AI-Server)

Create an `.env` in `AI-Server/` with:

- `PORT=5000`
- `OLLAMA_URL=http://localhost:11434`
- `OLLAMA_MODEL=jaicianverse`
- `RAG_SERVICE_URL=http://localhost:5001` (optional; default is already this)

### Python (RAG-BOT)

No env vars required by default.

---

## 7) Run it end-to-end (copy/paste)

### Step 1 — Start Ollama

Make sure Ollama is running and the model exists (example model name: `jaicianverse`).

### Step 2 — Start the Python RAG service

From `AI-Server/RAG-BOT/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Verify it:
- open `http://localhost:5001/health`

### Step 3 — Start the Node AI-Server

From `AI-Server/`:

```bash
npm install
npm start
```

Now call:
- `POST http://localhost:{PORT}/generate`
- `POST http://localhost:{PORT}/rag-generate`

---

## 8) Troubleshooting

- **`/rag-generate` returns answers but no context seems used**
  - Confirm RAG-BOT is reachable at `RAG_SERVICE_URL` and `/health` returns `ok`.

- **RAG-BOT takes a long time on first start**
  - First run builds embeddings and writes `embeddings.pkl`. Next runs load the cache.

- **No chunks returned from `/search`**
  - Try lowering `threshold` (or set it to `0.0` when testing).
  - Ensure `college.data.txt` has clear paragraph breaks (blank lines).

- **CORS issues from the client**
  - Both servers enable CORS (`cors` in Node, `flask-cors` in Python).
