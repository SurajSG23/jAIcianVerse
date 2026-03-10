"""
prepare_dataset.py
------------------
Reads a large .txt knowledge file, splits it into logical chunks,
generates instruction-tuning Q&A pairs from each chunk using a local
or API-based LLM, and writes the result as a JSONL dataset.

Usage:
    python prepare_dataset.py --input ../data/college.data.txt --output dataset.jsonl
"""

import argparse
import json
import os
import re
import sys
import time
import textwrap
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
load_dotenv()  # Load .env from the current working directory

# ---------------------------------------------------------------------------
# 1. Text chunking
# ---------------------------------------------------------------------------

# Headings / section markers commonly found in knowledge files.
_SECTION_RE = re.compile(
    r"^(?:"
    r"#{1,4}\s+"                       # Markdown headings
    r"|[A-Z][A-Za-z &,\-]+(?:\n|$)"   # Title-case lines (standalone)
    r"|[A-Z][A-Z &,\-]{4,}(?:\n|$)"   # ALL-CAPS lines
    r")",
    re.MULTILINE,
)


def split_into_chunks(
    text: str,
    max_tokens: int = 512,
    overlap_sentences: int = 1,
) -> list[str]:
    """Split *text* into chunks respecting paragraph and section boundaries.

    Strategy:
      1. Split on double-newlines (paragraphs / sections).
      2. Greedily merge consecutive paragraphs until *max_tokens* words.
      3. Optionally carry the last *overlap_sentences* sentences into the
         next chunk so context is not lost at boundaries.
    """
    # Normalize whitespace between paragraphs.
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]

    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para.split())
        # If a single paragraph already exceeds max_tokens, split it by
        # sentences so we never produce an overly-long chunk.
        if para_len > max_tokens:
            if current:
                chunks.append("\n\n".join(current))
                current, current_len = [], 0
            sentences = re.split(r"(?<=[.!?])\s+", para)
            buf: list[str] = []
            buf_len = 0
            for sent in sentences:
                slen = len(sent.split())
                if buf_len + slen > max_tokens and buf:
                    chunks.append(" ".join(buf))
                    # Overlap: keep last sentence(s) for context continuity.
                    buf = buf[-overlap_sentences:] if overlap_sentences else []
                    buf_len = sum(len(s.split()) for s in buf)
                buf.append(sent)
                buf_len += slen
            if buf:
                chunks.append(" ".join(buf))
            continue

        if current_len + para_len > max_tokens and current:
            chunks.append("\n\n".join(current))
            # Carry the last paragraph as overlap.
            if overlap_sentences and current:
                current = [current[-1]]
                current_len = len(current[0].split())
            else:
                current, current_len = [], 0

        current.append(para)
        current_len += para_len

    if current:
        chunks.append("\n\n".join(current))

    return chunks


# ---------------------------------------------------------------------------
# 2. Q&A generation from chunks
# ---------------------------------------------------------------------------

def _build_qa_prompt(chunk: str) -> str:
    """Return the system + user prompt that asks an LLM to produce Q&A pairs."""
    return textwrap.dedent(f"""\
    You are a dataset-generation assistant.
    Given the following passage, generate between 2 and 5 diverse question-answer pairs
    that test factual understanding of the passage.

    Rules:
    - Questions must be self-contained (do not say "the passage").
    - Answers must be concise but complete, using only information from the passage.
    - Output ONLY a JSON array. Each element must have the keys "question" and "answer".
    - Do NOT include any text outside the JSON array.

    Passage:
    \"\"\"
    {chunk}
    \"\"\"

    JSON output:""")


def generate_qa_with_ollama(
    chunk: str,
    model: str = "llama3",
    base_url: str = "http://localhost:11434",
    retries: int = 2,
) -> list[dict]:
    """Call a local Ollama instance to generate Q&A pairs from *chunk*."""
    import requests  # kept local so the module can be imported without requests

    prompt = _build_qa_prompt(chunk)
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": 1024},
    }

    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(
                f"{base_url}/api/generate",
                json=payload,
                timeout=120,
            )
            resp.raise_for_status()
            raw = resp.json().get("response", "")
            return _parse_qa_json(raw)
        except Exception as exc:
            print(f"  [attempt {attempt}/{retries}] Ollama error: {exc}")
            if attempt < retries:
                time.sleep(2)
    return []


def generate_qa_with_gemini(
    chunk: str,
    api_key: str,
    model: str = "gemini-2.5-flash-lite",
    retries: int = 2,
) -> list[dict]:
    """Call the Google Gemini API to generate Q&A pairs from *chunk*.

    Requires the `google-generativeai` package.
    """
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    gen_model = genai.GenerativeModel(model)
    prompt = _build_qa_prompt(chunk)

    for attempt in range(1, retries + 1):
        try:
            response = gen_model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1024,
                ),
            )
            raw = response.text
            return _parse_qa_json(raw)
        except Exception as exc:
            print(f"  [attempt {attempt}/{retries}] Gemini error: {exc}")
            if attempt < retries:
                time.sleep(2)
    return []


def _parse_qa_json(raw: str) -> list[dict]:
    """Extract the JSON array of Q&A pairs from the LLM response."""
    # Strip markdown code fences if present.
    raw = re.sub(r"```(?:json)?", "", raw).strip()
    # Find the outermost JSON array.
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        return []
    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        return []
    # Validate structure.
    pairs: list[dict] = []
    for item in data:
        if isinstance(item, dict) and "question" in item and "answer" in item:
            pairs.append(
                {"question": item["question"].strip(), "answer": item["answer"].strip()}
            )
    return pairs


# ---------------------------------------------------------------------------
# 3. Rule-based fallback Q&A generation (no LLM required)
# ---------------------------------------------------------------------------

def generate_qa_rulebased(chunk: str) -> list[dict]:
    """Produce simple Q&A pairs using heuristic rules.

    This serves as a zero-dependency fallback when no LLM is reachable.
    It creates "What is ... ?" and "Tell me about ..." style pairs.
    """
    pairs: list[dict] = []
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", chunk) if len(s.split()) > 5]

    # Pair 1: generic recall over the whole chunk.
    if sentences:
        # Use the first meaningful sentence as a topic hint.
        topic = sentences[0].split(".")[0].strip().rstrip(".")
        pairs.append({
            "question": f"What do you know about {topic}?",
            "answer": chunk.strip(),
        })

    # Pair 2: per-sentence factoid questions.
    for sent in sentences[:4]:
        pairs.append({
            "question": f"Provide details: {sent.split('.')[0].strip().rstrip('.')}.",
            "answer": sent.strip(),
        })

    return pairs


# ---------------------------------------------------------------------------
# 4. Orchestrator
# ---------------------------------------------------------------------------

def build_dataset(
    input_path: str,
    output_path: str,
    max_tokens: int = 512,
    backend: str = "ollama",
    ollama_model: str = "llama3",
    ollama_url: str = "http://localhost:11434",
    gemini_api_key: Optional[str] = None,
    gemini_model: str = "gemini-2.5-flash-lite",
) -> int:
    """End-to-end pipeline: TXT -> chunks -> Q&A -> JSONL.

    Returns the number of Q&A pairs written.
    """
    text = Path(input_path).read_text(encoding="utf-8")
    chunks = split_into_chunks(text, max_tokens=max_tokens)
    print(f"Split input into {len(chunks)} chunks (max ~{max_tokens} words each).")

    records: list[dict] = []

    for idx, chunk in enumerate(chunks):
        print(f"Processing chunk {idx + 1}/{len(chunks)} ...", end=" ")

        qa_pairs: list[dict] = []

        if backend == "ollama":
            qa_pairs = generate_qa_with_ollama(chunk, model=ollama_model, base_url=ollama_url)
        elif backend == "gemini":
            if not gemini_api_key:
                print("No Gemini API key provided, falling back to rule-based.")
                backend = "rulebased"
            else:
                qa_pairs = generate_qa_with_gemini(
                    chunk, api_key=gemini_api_key, model=gemini_model
                )

        # Fallback to rule-based if the LLM returned nothing.
        if not qa_pairs:
            if backend not in ("rulebased",):
                print("LLM returned no pairs, using rule-based fallback.", end=" ")
            qa_pairs = generate_qa_rulebased(chunk)

        for pair in qa_pairs:
            records.append({
                "instruction": pair["question"],
                "input": "",
                "output": pair["answer"],
            })
        print(f"{len(qa_pairs)} pairs generated.")

    # Write JSONL.
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as fh:
        for rec in records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"\nDataset written to {out}  ({len(records)} total examples).")
    return len(records)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert a knowledge .txt file into an instruction-tuning JSONL dataset."
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to the input .txt knowledge file.",
    )
    parser.add_argument(
        "--output", "-o",
        default="dataset.jsonl",
        help="Path for the output JSONL file (default: dataset.jsonl).",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=512,
        help="Approximate max words per chunk (default: 512).",
    )
    parser.add_argument(
        "--backend",
        choices=["ollama", "gemini", "rulebased"],
        default="ollama",
        help="LLM backend for Q&A generation (default: ollama).",
    )
    parser.add_argument(
        "--ollama-model",
        default=os.getenv("OLLAMA_MODEL", "llama3"),
        help="Ollama model name (default: llama3, or OLLAMA_MODEL env var).",
    )
    parser.add_argument(
        "--ollama-url",
        default=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        help="Ollama API base URL (or OLLAMA_BASE_URL env var).",
    )
    parser.add_argument(
        "--gemini-api-key",
        default=os.getenv("GEMINI_API_KEY"),
        help="Google Gemini API key (or GEMINI_API_KEY env var).",
    )
    parser.add_argument(
        "--gemini-model",
        default="gemini-2.5-flash-lite",
        help="Gemini model name (default: gemini-2.5-flash-lite).",
    )
    args = parser.parse_args()

    build_dataset(
        input_path=args.input,
        output_path=args.output,
        max_tokens=args.max_tokens,
        backend=args.backend,
        ollama_model=args.ollama_model,
        ollama_url=args.ollama_url,
        gemini_api_key=args.gemini_api_key,
        gemini_model=args.gemini_model,
    )


if __name__ == "__main__":
    main()
