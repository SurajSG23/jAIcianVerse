"""
train_lora.py
-------------
Fine-tunes a Llama 3 model with LoRA using the Unsloth framework.
Reads the instruction-tuning JSONL dataset produced by prepare_dataset.py
and trains a 4-bit quantized model with PEFT / LoRA adapters.

Usage:
    python train_lora.py --dataset dataset.jsonl
    python train_lora.py --dataset dataset.jsonl --base-model unsloth/Llama-3.2-3B-unsloth-bnb-4bit
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Workaround: Triton cache fails on Windows when the temp path contains spaces.
# Redirect both Triton and TorchInductor caches to a safe directory.
_safe_cache = os.path.join(os.environ.get("LOCALAPPDATA", "C:\\temp"), "triton_cache")
os.environ.setdefault("TRITON_CACHE_DIR", _safe_cache)
os.environ.setdefault("TORCHINDUCTOR_CACHE_DIR", _safe_cache)

from dotenv import load_dotenv
load_dotenv()

import torch


# ---------------------------------------------------------------------------
# Hardware detection
# ---------------------------------------------------------------------------

def detect_device() -> dict:
    """Return device info and recommended training parameters."""
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        props = torch.cuda.get_device_properties(0)
        vram_gb = props.total_memory / (1024 ** 3)
        # bf16 requires Ampere+ (compute capability >= 8.0)
        bf16_supported = props.major >= 8
        print(f"GPU detected: {gpu_name} ({vram_gb:.1f} GB VRAM)")
        return {
            "device": "cuda",
            "gpu_name": gpu_name,
            "vram_gb": vram_gb,
            "per_device_train_batch_size": 2,
            "gradient_accumulation_steps": 4,
            "fp16": not bf16_supported,
            "bf16": bf16_supported,
        }
    else:
        print("No GPU detected -- training will run on CPU (slow).")
        return {
            "device": "cpu",
            "gpu_name": None,
            "vram_gb": 0,
            "per_device_train_batch_size": 1,
            "gradient_accumulation_steps": 8,
            "fp16": False,
            "bf16": False,
        }


# ---------------------------------------------------------------------------
# Dataset loading
# ---------------------------------------------------------------------------

def load_jsonl_dataset(path: str):
    """Load a JSONL file and return a HuggingFace Dataset."""
    from datasets import Dataset

    records = []
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return Dataset.from_list(records)


# ---------------------------------------------------------------------------
# Prompt formatting (Llama 3 Instruct chat template)
# ---------------------------------------------------------------------------

_LLAMA3_TEMPLATE = (
    "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
    "You are a helpful and knowledgeable assistant.<|eot_id|>"
    "<|start_header_id|>user<|end_header_id|>\n\n"
    "{instruction}<|eot_id|>"
    "<|start_header_id|>assistant<|end_header_id|>\n\n"
    "{output}<|eot_id|>"
)


def format_prompts(examples):
    """Apply the Llama 3 chat template to each example in a batch."""
    texts = []
    for instruction, output in zip(examples["instruction"], examples["output"]):
        texts.append(
            _LLAMA3_TEMPLATE.format(instruction=instruction, output=output)
        )
    return {"text": texts}


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train(
    dataset_path: str,
    output_dir: str = "./lora_output",
    base_model: str = "unsloth/Llama-3.2-3B-unsloth-bnb-4bit",
    max_seq_length: int = 2048,
    lora_rank: int = 16,
    lora_alpha: int = 32,
    lora_dropout: float = 0.0,
    learning_rate: float = 2e-4,
    num_train_epochs: int = 3,
    logging_steps: int = 10,
    save_steps: int = 100,
    warmup_steps: int = 10,
    weight_decay: float = 0.01,
    seed: int = 42,
) -> None:
    """Load model, apply LoRA, train, and save adapters."""

    hw = detect_device()

    # ------------------------------------------------------------------
    # Load base model + tokenizer via Unsloth (handles 4-bit quant).
    # ------------------------------------------------------------------
    from unsloth import FastLanguageModel

    print(f"\nLoading base model: {base_model}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=base_model,
        max_seq_length=max_seq_length,
        dtype=None,  # auto-detect
        load_in_4bit=True,
    )

    # ------------------------------------------------------------------
    # Apply LoRA adapters.
    # ------------------------------------------------------------------
    print(
        f"Applying LoRA  (rank={lora_rank}, alpha={lora_alpha}, "
        f"dropout={lora_dropout})"
    )
    model = FastLanguageModel.get_peft_model(
        model,
        r=lora_rank,
        lora_alpha=lora_alpha,
        lora_dropout=lora_dropout,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        bias="none",
        use_gradient_checkpointing="unsloth",  # memory-efficient
        random_state=seed,
    )

    # ------------------------------------------------------------------
    # Prepare dataset.
    # ------------------------------------------------------------------
    print(f"Loading dataset from {dataset_path}")
    dataset = load_jsonl_dataset(dataset_path)
    dataset = dataset.map(format_prompts, batched=True)
    print(f"Training examples: {len(dataset)}")

    # ------------------------------------------------------------------
    # Trainer setup (SFTTrainer from trl).
    # ------------------------------------------------------------------
    from trl import SFTTrainer, SFTConfig

    sft_config = SFTConfig(
        output_dir=output_dir,
        per_device_train_batch_size=hw["per_device_train_batch_size"],
        gradient_accumulation_steps=hw["gradient_accumulation_steps"],
        num_train_epochs=num_train_epochs,
        learning_rate=learning_rate,
        logging_steps=logging_steps,
        save_steps=save_steps,
        save_total_limit=2,
        warmup_steps=warmup_steps,
        weight_decay=weight_decay,
        fp16=hw["fp16"],
        bf16=hw["bf16"],
        optim="adamw_8bit",
        seed=seed,
        report_to="none",
        dataset_text_field="text",
        max_seq_length=max_seq_length,
    )

    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=dataset,
        args=sft_config,
    )

    # ------------------------------------------------------------------
    # Train.
    # ------------------------------------------------------------------
    print("\n--- Starting training ---\n")
    stats = trainer.train()
    print("\n--- Training complete ---")
    print(f"  Total steps : {stats.global_step}")
    print(f"  Train loss  : {stats.training_loss:.4f}")

    # ------------------------------------------------------------------
    # Save LoRA adapter weights.
    # ------------------------------------------------------------------
    adapter_dir = str(Path(output_dir) / "lora_adapter")
    model.save_pretrained(adapter_dir)
    tokenizer.save_pretrained(adapter_dir)
    print(f"\nLoRA adapter saved to {adapter_dir}")
    print("Run export_model.py next to merge weights and export GGUF.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fine-tune Llama 3 with LoRA using Unsloth."
    )
    parser.add_argument(
        "--dataset", "-d",
        required=True,
        help="Path to the JSONL dataset (from prepare_dataset.py).",
    )
    parser.add_argument(
        "--output-dir", "-o",
        default="./lora_output",
        help="Directory to save checkpoints and the final adapter (default: ./lora_output).",
    )
    parser.add_argument(
        "--base-model",
        default="unsloth/Llama-3.2-3B-unsloth-bnb-4bit",
        help="HuggingFace model ID for the base Llama 3 model.",
    )
    parser.add_argument(
        "--max-seq-length",
        type=int,
        default=2048,
        help="Maximum sequence length (default: 2048).",
    )
    parser.add_argument("--lora-rank", type=int, default=16)
    parser.add_argument("--lora-alpha", type=int, default=32)
    parser.add_argument("--lora-dropout", type=float, default=0.0)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--logging-steps", type=int, default=10)
    parser.add_argument("--save-steps", type=int, default=100)
    parser.add_argument("--warmup-steps", type=int, default=10)
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--seed", type=int, default=42)

    args = parser.parse_args()

    train(
        dataset_path=args.dataset,
        output_dir=args.output_dir,
        base_model=args.base_model,
        max_seq_length=args.max_seq_length,
        lora_rank=args.lora_rank,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        learning_rate=args.learning_rate,
        num_train_epochs=args.epochs,
        logging_steps=args.logging_steps,
        save_steps=args.save_steps,
        warmup_steps=args.warmup_steps,
        weight_decay=args.weight_decay,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
