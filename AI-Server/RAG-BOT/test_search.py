"""
test_search.py  –  Interactive semantic search accuracy tester
Run: python test_search.py

Tests a preset list of queries AND lets you type your own.
Shows retrieved chunks with similarity scores so you can judge quality.
"""

import requests
import textwrap

RAG_URL = "http://localhost:5001"
TOP_K    = 4
WIDTH    = 90      # console wrap width

# ── Pre-defined test queries (edit freely) ───────────────────────────────────
SAMPLE_QUERIES = [
    "Who is the HOD of Computer Science department?",
    "What is the NAAC grade of JSS STU?",
    "When was SJCE established?",
    "Who is the Vice Chancellor?",
    "Tell me about JAYCIANA cultural festival",
    "What research output did the university achieve in 2024?",
    "What is SJCE-STEP?",
    "Notable alumni of SJCE",
    "What undergraduate programmes does JSS STU offer?",
    "What are the hostel facilities?",
]

# ── Helpers ──────────────────────────────────────────────────────────────────

def divider(char="─", n=WIDTH):
    print(char * n)

def search(query: str, top_k: int = TOP_K):
    try:
        r = requests.post(
            f"{RAG_URL}/search",
            json={"query": query, "topK": top_k, "threshold": 0.0},
            timeout=10,
        )
        r.raise_for_status()
        return r.json().get("scored", [])
    except requests.exceptions.ConnectionError:
        print("\n❌  RAG-BOT not reachable at http://localhost:5001")
        print("   Start it with:  python app.py\n")
        return []

def print_results(query: str, results: list):
    divider("═")
    print(f"  QUERY : {query}")
    divider()
    if not results:
        print("  No results returned.")
        divider("═")
        return

    for rank, item in enumerate(results, 1):
        score = item["score"]
        text  = item["text"]

        # Visual score bar (max width 30)
        bar_len = int(score * 30)
        bar     = "█" * bar_len + "░" * (30 - bar_len)

        quality = (
            "🟢 High"   if score >= 0.55 else
            "🟡 Medium" if score >= 0.35 else
            "🔴 Low"
        )

        print(f"\n  Rank #{rank}  Score: {score:.4f}  [{bar}]  {quality}")
        print("  " + "·" * (WIDTH - 2))
        wrapped = textwrap.fill(text, width=WIDTH - 4)
        for line in wrapped.splitlines():
            print(f"    {line}")

    divider("═")
    avg  = sum(r["score"] for r in results) / len(results)
    best = results[0]["score"] if results else 0
    print(f"  Summary → Best: {best:.4f}  |  Avg top-{len(results)}: {avg:.4f}")
    divider("═")
    print()

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    # Verify server is up
    try:
        h = requests.get(f"{RAG_URL}/health", timeout=5)
        info = h.json()
        print(f"\n✅  RAG-BOT connected  –  {info['chunks']} chunks indexed\n")
    except Exception:
        print("\n❌  Cannot reach RAG-BOT at http://localhost:5001 – start it first.\n")
        return

    print("=" * WIDTH)
    print("  SEMANTIC SEARCH ACCURACY TESTER")
    print("=" * WIDTH)
    print("\nOptions:")
    print("  [1]  Run all sample queries")
    print("  [2]  Enter a custom query")
    print("  [3]  Run sample + custom")
    print("  [q]  Quit")

    while True:
        print()
        choice = input("  Choose (1/2/3/q): ").strip().lower()

        if choice == "q":
            print("  Bye!")
            break

        queries_to_run = []

        if choice in ("1", "3"):
            queries_to_run.extend(SAMPLE_QUERIES)

        if choice in ("2", "3"):
            custom = input("  Enter your query: ").strip()
            if custom:
                queries_to_run.append(custom)

        if not queries_to_run:
            print("  Nothing to run.")
            continue

        try:
            k = int(input(f"  How many results per query? [{TOP_K}]: ").strip() or TOP_K)
        except ValueError:
            k = TOP_K

        for q in queries_to_run:
            results = search(q, top_k=k)
            print_results(q, results)

        # Ask if user wants another round
        again = input("  Run another test? (y/n): ").strip().lower()
        if again != "y":
            print("  Done!")
            break


if __name__ == "__main__":
    main()
