"""
export_model.py
---------------
Merges the trained LoRA adapter back into the base model and exports
the result as a GGUF file that can be loaded directly into Ollama.

Usage:
    python export_model.py
    python export_model.py --adapter-dir ./lora_output/lora_adapter --gguf-dir ./gguf_output --quant q4_k_m
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Merge + GGUF export via Unsloth
# ---------------------------------------------------------------------------

def export_gguf_unsloth(
    adapter_dir: str,
    gguf_dir: str,
    base_model: str,
    max_seq_length: int,
    quantization: str,
) -> Path:
    """Merge LoRA into the base model and export GGUF using Unsloth's
    built-in save_pretrained_gguf helper.

    Returns the path to the exported GGUF file.
    """
    from unsloth import FastLanguageModel

    print(f"Loading base model: {base_model}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=base_model,
        max_seq_length=max_seq_length,
        dtype=None,
        load_in_4bit=True,
    )

    print(f"Loading LoRA adapter from {adapter_dir}")
    from peft import PeftModel
    model = PeftModel.from_pretrained(model, adapter_dir)

    out = Path(gguf_dir)
    out.mkdir(parents=True, exist_ok=True)

    print(f"Merging LoRA weights and exporting GGUF ({quantization}) ...")
    model.save_pretrained_gguf(
        str(out),
        tokenizer,
        quantization_method=quantization,
    )

    # Unsloth writes the GGUF as  <dir>/unsloth.{quant}.gguf
    gguf_files = list(out.glob("*.gguf"))
    if gguf_files:
        gguf_path = gguf_files[0]
        print(f"\nGGUF exported: {gguf_path}  ({gguf_path.stat().st_size / 1e9:.2f} GB)")
        return gguf_path

    # Fallback: check for bin files that may need manual conversion.
    print(
        "Warning: No .gguf file found in output directory. "
        "You may need to convert manually with llama.cpp."
    )
    return out


# ---------------------------------------------------------------------------
# Fallback: manual merge + llama.cpp conversion
# ---------------------------------------------------------------------------

def export_gguf_manual(
    adapter_dir: str,
    gguf_dir: str,
    base_model: str,
    max_seq_length: int,
    quantization: str,
) -> Path:
    """Merge adapter, save a full-precision HF checkpoint, then convert
    to GGUF with llama.cpp's convert script.  Use this path only when
    Unsloth's built-in GGUF export is unavailable.
    """
    from unsloth import FastLanguageModel
    from peft import PeftModel

    print(f"Loading base model: {base_model}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=base_model,
        max_seq_length=max_seq_length,
        dtype=None,
        load_in_4bit=True,
    )

    print(f"Loading LoRA adapter from {adapter_dir}")
    model = PeftModel.from_pretrained(model, adapter_dir)

    merged_dir = Path(gguf_dir) / "merged_hf"
    merged_dir.mkdir(parents=True, exist_ok=True)

    print("Merging LoRA weights into the base model ...")
    merged_model = model.merge_and_unload()
    merged_model.save_pretrained(str(merged_dir))
    tokenizer.save_pretrained(str(merged_dir))
    print(f"Merged HF model saved to {merged_dir}")

    # Attempt conversion via llama.cpp python script.
    convert_script = shutil.which("convert_hf_to_gguf.py") or shutil.which("convert.py")
    if convert_script is None:
        print(
            "\nCould not find llama.cpp convert script on PATH.\n"
            "To convert manually:\n"
            "  1. Clone https://github.com/ggerganov/llama.cpp\n"
            f"  2. python convert_hf_to_gguf.py {merged_dir} --outtype {quantization}\n"
        )
        return merged_dir

    out_file = Path(gguf_dir) / f"model-{quantization}.gguf"
    cmd = [
        sys.executable, convert_script,
        str(merged_dir),
        "--outfile", str(out_file),
        "--outtype", quantization,
    ]
    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    print(f"\nGGUF exported: {out_file}  ({out_file.stat().st_size / 1e9:.2f} GB)")
    return out_file


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def export_model(
    adapter_dir: str = "./lora_output/lora_adapter",
    gguf_dir: str = "./gguf_output",
    base_model: str = "unsloth/Meta-Llama-3-8B-Instruct-bnb-4bit",
    max_seq_length: int = 2048,
    quantization: str = "q4_k_m",
) -> None:
    """High-level export function.  Tries the Unsloth native path first,
    falls back to manual merge + llama.cpp if needed."""

    try:
        result = export_gguf_unsloth(
            adapter_dir=adapter_dir,
            gguf_dir=gguf_dir,
            base_model=base_model,
            max_seq_length=max_seq_length,
            quantization=quantization,
        )
    except Exception as exc:
        print(f"Unsloth GGUF export failed ({exc}), trying manual fallback ...")
        result = export_gguf_manual(
            adapter_dir=adapter_dir,
            gguf_dir=gguf_dir,
            base_model=base_model,
            max_seq_length=max_seq_length,
            quantization=quantization,
        )

    print("\n--- Export complete ---")
    print(f"Output: {result}")
    print("Next steps:")
    print("  1. Copy the Modelfile into the same directory as the .gguf file.")
    print("  2. Run:  ollama create jaicianverse -f Modelfile")
    print("  3. Run:  ollama run jaicianverse")


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
        "--base-model",
        default="unsloth/Meta-Llama-3-8B-Instruct-bnb-4bit",
        help="HuggingFace model ID used during training.",
    )
    parser.add_argument(
        "--max-seq-length",
        type=int,
        default=2048,
    )
    parser.add_argument(
        "--quant", "-q",
        default="q4_k_m",
        choices=["q4_k_m", "q5_k_m", "q8_0", "f16"],
        help="GGUF quantization type (default: q4_k_m).",
    )
    args = parser.parse_args()

    export_model(
        adapter_dir=args.adapter_dir,
        gguf_dir=args.gguf_dir,
        base_model=args.base_model,
        max_seq_length=args.max_seq_length,
        quantization=args.quant,
    )


if __name__ == "__main__":
    main()
