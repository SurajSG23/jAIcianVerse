"""
evaluate.py — Accuracy checker for the jaicianverse fine-tuned model.

Metrics
-------
  keyword_overlap  : % of meaningful reference keywords found in model output
  rouge_l          : longest-common-subsequence recall (pure Python, no deps)
  contains_core    : does output contain the single most important noun/phrase?

Run:
    python evaluate.py
    python evaluate.py --samples 100 --model jaicianverse
"""

import argparse
import json
import os
import random
import re
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Config defaults
# ---------------------------------------------------------------------------
DEFAULT_DATASET   = Path(__file__).parent / "dataset.jsonl"
DEFAULT_MODEL     = "jaicianverse"
DEFAULT_OLLAMA    = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_SAMPLES   = 50
SEED              = 42

# Words to ignore when extracting keywords
STOPWORDS = {
    "a","an","the","is","are","was","were","be","been","being","have","has",
    "had","do","does","did","will","would","could","should","may","might",
    "shall","can","what","which","who","whom","whose","when","where","why",
    "how","and","or","but","if","in","on","at","to","for","of","with","by",
    "from","as","into","through","about","between","after","before","during",
    "it","its","they","their","this","that","these","those","also","both",
    "each","few","more","most","other","some","such","than","then","there",
    "so","yet","because","since","though","while","after","until",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_dataset(path: Path) -> list[dict]:
    records = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def extract_keywords(text: str) -> list[str]:
    """Extract lowercase non-stopwords longer than 3 chars."""
    words = re.findall(r"[a-zA-Z0-9]+", text.lower())
    return [w for w in words if len(w) > 3 and w not in STOPWORDS]


def keyword_overlap(reference: str, prediction: str) -> float:
    """Fraction of reference keywords that appear in the prediction."""
    ref_kws = set(extract_keywords(reference))
    if not ref_kws:
        return 1.0
    pred_text = prediction.lower()
    matched = sum(1 for kw in ref_kws if kw in pred_text)
    return matched / len(ref_kws)


def lcs_length(a: list, b: list) -> int:
    """Length of the longest common subsequence between two word lists."""
    m, n = len(a), len(b)
    # Space-optimised O(min(m,n)) DP
    if m < n:
        a, b, m, n = b, a, n, m
    prev = [0] * (n + 1)
    curr = [0] * (n + 1)
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                curr[j] = prev[j - 1] + 1
            else:
                curr[j] = max(curr[j - 1], prev[j])
        prev, curr = curr, [0] * (n + 1)
    return prev[n]


def rouge_l(reference: str, prediction: str) -> float:
    """ROUGE-L recall: LCS(ref, pred) / len(ref tokens)."""
    ref_tokens  = re.findall(r"\w+", reference.lower())
    pred_tokens = re.findall(r"\w+", prediction.lower())
    if not ref_tokens:
        return 1.0
    lcs = lcs_length(ref_tokens, pred_tokens)
    return lcs / len(ref_tokens)


def contains_core(reference: str, prediction: str) -> bool:
    """
    Checks whether the prediction contains the 'core answer':
    the longest 3–5 consecutive word sequence that has no stopwords
    and appears in the reference.
    """
    ref_words = re.findall(r"\w+", reference.lower())
    # find first run of non-stopword words (length 2+)
    run, best = [], []
    for w in ref_words:
        if w not in STOPWORDS and len(w) > 2:
            run.append(w)
            if len(run) > len(best):
                best = run[:]
        else:
            run = []
    if not best:
        return keyword_overlap(reference, prediction) > 0.5
    phrase = " ".join(best[:4])          # up to 4 key words
    return phrase in prediction.lower()


# ---------------------------------------------------------------------------
# Ollama inference
# ---------------------------------------------------------------------------

def call_ollama(question: str, model: str, base_url: str, timeout: int = 120) -> str:
    """Send one question to the model and return its answer text."""
    payload = {
        "model": model,
        "prompt": question,
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 256},
    }
    try:
        resp = requests.post(f"{base_url}/api/generate", json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except requests.exceptions.ConnectionError:
        print(f"\n[ERROR] Cannot connect to Ollama at {base_url}.")
        print("        Make sure Ollama is running:  ollama serve")
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"\n[ERROR] Model '{model}' not found in Ollama.")
            print(f"        Register it first:  ollama create {model} -f Modelfile --quantize q4_K_M")
            sys.exit(1)
        raise


# ---------------------------------------------------------------------------
# Main evaluation loop
# ---------------------------------------------------------------------------

def evaluate(dataset_path: Path, model: str, base_url: str, n_samples: int) -> None:
    print(f"\n{'='*65}")
    print(f"  jAIcianVerse -- Model Accuracy Evaluation")
    print(f"{'='*65}")

    records = load_dataset(dataset_path)
    print(f"  Dataset:  {dataset_path.name}  ({len(records)} records)")
    print(f"  Model:    {model}  @  {base_url}")
    print(f"  Samples:  {n_samples}  (random seed={SEED})")
    print(f"{'='*65}\n")

    # Sample
    random.seed(SEED)
    sample = random.sample(records, min(n_samples, len(records)))

    results = []
    kw_scores, rl_scores, core_hits = [], [], []

    for idx, rec in enumerate(sample, 1):
        question  = rec["instruction"]
        reference = rec["output"]

        print(f"[{idx:>3}/{len(sample)}]  Q: {question[:72]}{'…' if len(question)>72 else ''}")

        t0         = time.time()
        prediction = call_ollama(question, model, base_url)
        elapsed    = time.time() - t0

        kw  = keyword_overlap(reference, prediction)
        rl  = rouge_l(reference, prediction)
        cc  = contains_core(reference, prediction)

        kw_scores.append(kw)
        rl_scores.append(rl)
        core_hits.append(cc)

        status = "OK" if cc else "--"
        print(f"          [{status}]  KW={kw:.2f}  ROUGE-L={rl:.2f}  Core={'HIT' if cc else 'MISS'}  ({elapsed:.1f}s)")

        results.append({
            "question":   question,
            "reference":  reference,
            "prediction": prediction,
            "kw_overlap": round(kw, 4),
            "rouge_l":    round(rl, 4),
            "core_hit":   cc,
        })

    # ---------------------------------------------------------------------------
    # Summary
    # ---------------------------------------------------------------------------
    n = len(results)
    avg_kw   = sum(kw_scores) / n * 100
    avg_rl   = sum(rl_scores) / n * 100
    core_pct = sum(core_hits) / n * 100

    # Bins for keyword overlap
    excellent = sum(1 for s in kw_scores if s >= 0.80) / n * 100
    good      = sum(1 for s in kw_scores if 0.60 <= s < 0.80) / n * 100
    partial   = sum(1 for s in kw_scores if 0.40 <= s < 0.60) / n * 100
    poor      = sum(1 for s in kw_scores if s < 0.40) / n * 100

    print(f"\n{'='*65}")
    print(f"  RESULTS  ({n} samples)")
    print(f"{'='*65}")
    print(f"  Keyword Overlap (avg)   : {avg_kw:>6.1f}%  (% of key facts recalled)")
    print(f"  ROUGE-L Recall (avg)    : {avg_rl:>6.1f}%  (longest-seq word match)")
    print(f"  Core Answer Hit Rate    : {core_pct:>6.1f}%  (main fact present?)")
    print(f"")
    print(f"  Quality Breakdown (Keyword Overlap):")
    print(f"    Excellent  (>=80%)  : {excellent:>5.1f}%")
    print(f"    Good       (60-80%) : {good:>5.1f}%")
    print(f"    Partial    (40-60%) : {partial:>5.1f}%")
    print(f"    Poor        (<40%)  : {poor:>5.1f}%")
    print(f"{'='*65}")
    print(f"  OVERALL ACCURACY ESTIMATE : {core_pct:.1f}%")
    print(f"{'='*65}")
    print()
    print("  NOTE: Evaluation is on training data (no held-out split exists).")
    print("  Scores are optimistic. True generalisation accuracy is typically")
    print("  5–15 percentage points lower on unseen questions.")
    print()

    # ---------------------------------------------------------------------------
    # Save detailed results
    # ---------------------------------------------------------------------------
    out_path = Path(__file__).parent / "eval_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({
            "model": model,
            "samples": n,
            "avg_keyword_overlap_pct": round(avg_kw, 2),
            "avg_rouge_l_pct":         round(avg_rl, 2),
            "core_hit_rate_pct":       round(core_pct, 2),
            "breakdown": {
                "excellent_gte_80": round(excellent, 2),
                "good_60_80":       round(good, 2),
                "partial_40_60":    round(partial, 2),
                "poor_lt_40":       round(poor, 2),
            },
            "per_example": results,
        }, f, indent=2, ensure_ascii=False)
    print(f"  Detailed results saved to: {out_path}")
    print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate jaicianverse model accuracy.")
    parser.add_argument("--dataset",  default=str(DEFAULT_DATASET), help="Path to dataset.jsonl")
    parser.add_argument("--model",    default=DEFAULT_MODEL,  help="Ollama model name (default: jaicianverse)")
    parser.add_argument("--base-url", default=DEFAULT_OLLAMA, help="Ollama base URL")
    parser.add_argument("--samples",  type=int, default=DEFAULT_SAMPLES, help="Number of samples to evaluate (default: 50)")
    args = parser.parse_args()

    evaluate(
        dataset_path = Path(args.dataset),
        model        = args.model,
        base_url     = args.base_url,
        n_samples    = args.samples,
    )
