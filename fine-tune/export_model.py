"""
export_model.py
---------------
Merges the trained LoRA adapter back into the base model and exports
the result as a GGUF file that can be loaded directly into Ollama.

Works on Windows without a C++ compiler by using the Python-only
convert_hf_to_gguf.py script from llama.cpp.  Ollama handles
quantization at import time via  ollama create --quantize q4_K_M.

Usage:
    python export_model.py
    python export_model.py --adapter-dir ./lora_output/lora_adapter --gguf-dir ./gguf_output
"""

import argparse
import gc
import shutil
import subprocess
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _find_convert_script() -> str | None:
    """Locate the llama.cpp convert_hf_to_gguf.py script."""
    # 1. On PATH
    on_path = shutil.which("convert_hf_to_gguf.py")
    if on_path:
        return on_path
    # 2. Unsloth-cloned repo
    unsloth_llama = Path.home() / ".unsloth" / "llama.cpp" / "convert_hf_to_gguf.py"
    if unsloth_llama.exists():
        return str(unsloth_llama)
    return None


def _free_gpu():
    """Release GPU memory so the next step can proceed."""
    import torch
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


# ---------------------------------------------------------------------------
# Step 1: Merge LoRA into base model and save as 16-bit HF checkpoint
# ---------------------------------------------------------------------------

def merge_and_save_hf(
    adapter_dir: str,
    gguf_dir: str,
    max_seq_length: int,
) -> Path:
    """Load the trained LoRA adapter via Unsloth, merge weights, and
    save the full model as a 16-bit HuggingFace checkpoint."""
    from unsloth import FastLanguageModel

    merged_dir = Path(gguf_dir) / "merged_hf"
    merged_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading LoRA adapter from {adapter_dir} ...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=adapter_dir,
        max_seq_length=max_seq_length,
        dtype=None,
        load_in_4bit=True,
    )

    print("Saving merged 16-bit model ...")
    model.save_pretrained_merged(
        str(merged_dir),
        tokenizer,
        save_method="merged_16bit",
    )
    print(f"Merged HF model saved to {merged_dir}")

    # Free GPU — it is no longer needed.
    del model, tokenizer
    _free_gpu()

    return merged_dir


# ---------------------------------------------------------------------------
# Step 2: Convert HF checkpoint → f16 GGUF  (pure Python, no compiler)
# ---------------------------------------------------------------------------

def convert_hf_to_gguf(merged_dir: Path, gguf_dir: str) -> Path:
    """Use llama.cpp's Python conversion script to produce an f16 GGUF."""
    convert_script = _find_convert_script()
    if convert_script is None:
        raise RuntimeError(
            "Could not find convert_hf_to_gguf.py.\n"
            "Install it by cloning llama.cpp:  "
            "git clone https://github.com/ggerganov/llama.cpp"
        )

    out_file = Path(gguf_dir) / "unsloth.f16.gguf"
    cmd = [
        sys.executable, convert_script,
        str(merged_dir),
        "--outfile", str(out_file),
        "--outtype", "f16",
    ]
    print(f"Converting HF → f16 GGUF ...\n  {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    print(f"GGUF exported: {out_file}  ({out_file.stat().st_size / 1e9:.2f} GB)")
    return out_file


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def export_model(
    adapter_dir: str = "./lora_output/lora_adapter",
    gguf_dir: str = "./gguf_output",
    max_seq_length: int = 2048,
) -> None:
    """Merge LoRA adapter and export an f16 GGUF.

    Ollama will quantise the model at import time:
        ollama create --quantize q4_K_M jaicianverse -f Modelfile
    """
    Path(gguf_dir).mkdir(parents=True, exist_ok=True)

    # Step 1 — merge LoRA weights
    merged_dir = merge_and_save_hf(adapter_dir, gguf_dir, max_seq_length)

    # Step 2 — convert to f16 GGUF (Python only, no compiler required)
    gguf_path = convert_hf_to_gguf(merged_dir, gguf_dir)

    print("\n--- Export complete ---")
    print(f"GGUF file: {gguf_path}")
    print("\nNext steps:")
    print("  1. Run:  ollama create --quantize q4_K_M jaicianverse -f Modelfile")
    print("  2. Run:  ollama run jaicianverse")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Merge LoRA adapter and export GGUF for Ollama."
    )
    parser.add_argument(
        "--adapter-dir",
        default="./lora_output/lora_adapter",
        help="Path to the saved LoRA adapter directory.",
    )
    parser.add_argument(
        "--gguf-dir",
        default="./gguf_output",
        help="Directory to write the GGUF file.",
    )
    parser.add_argument(
        "--max-seq-length",
        type=int,
        default=2048,
    )
    args = parser.parse_args()

    export_model(
        adapter_dir=args.adapter_dir,
        gguf_dir=args.gguf_dir,
        max_seq_length=args.max_seq_length,
    )


if __name__ == "__main__":
    main()
