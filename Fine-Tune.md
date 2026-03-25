# Fine-Tuning Documentation (End-to-End)

This document explains—step by step—how the **jAIcianVerse** model in this repo was fine-tuned, starting from raw text data and ending with an **Ollama-loadable model**.

The fine-tuning pipeline lives in the [Fine-Tune/](Fine-Tune/) folder and follows this flow:

```
college.data.txt  →  dataset.jsonl  →  LoRA adapter  →  merged model  →  GGUF  →  Ollama model
```

## 1) What was fine-tuned (base model)

**Base model (starting point):**
- Hugging Face model ID used by training script:
  - `unsloth/Llama-3.2-3B-unsloth-bnb-4bit`

**What this means:**
- It’s a Llama 3.2 3B “Instruct-style” model.
- The Unsloth variant is optimized for **fast 4-bit training** (using bitsandbytes).

## 2) What data was used (knowledge source)

**Primary knowledge file:**
- [Fine-Tune/data/college.data.txt](Fine-Tune/data/college.data.txt)

This file contains domain knowledge about:
- JSS Science and Technology University (JSS STU)
- Sri Jayachamarajendra College of Engineering (SJCE)

The pipeline converts this text into instruction-tuning Q&A examples.

## 3) Key concepts used in this fine-tune (simple explanations)

### 3.1 Instruction tuning (SFT)
**Supervised Fine-Tuning (SFT)** teaches a model to respond correctly to prompts by training on (prompt → ideal answer) pairs.

In this repo, each training example looks like:
```json
{"instruction": "Question...", "input": "", "output": "Answer..."}
```
Over 535+ Questiona and Answer pair was used to fine tune the model.

### 3.2 LoRA (Low-Rank Adaptation)
**LoRA** fine-tunes a model by training *small adapter weights* instead of updating the full model.

Why it’s used:
- Much cheaper (memory + time) than full fine-tuning.
- Produces a small output artifact (adapter) that can later be **merged** back into the base model.

In this repo’s default run:
- LoRA rank (`r`) = 16
- LoRA alpha = 32
- LoRA dropout = 0.0

### 3.3 PEFT
**PEFT** (Parameter-Efficient Fine-Tuning) is the general category of approaches like LoRA.

### 3.4 4-bit training (bitsandbytes)
The base model loads in **4-bit** so it can train on consumer GPUs.

Important detail:
- Training happens with 4-bit weights + LoRA adapters.
- Export later merges to a **16-bit** model for conversion to GGUF.

### 3.5 Chat template (Llama 3 Instruct format)
The training script wraps each example using the Llama 3 chat format, so the model learns the same structure it will see at inference time.

That template is implemented in [Fine-Tune/train_lora.py](Fine-Tune/train_lora.py) and must match the template in [Fine-Tune/Modelfile](Fine-Tune/Modelfile).

### 3.6 GGUF and Ollama
- **GGUF** is a model file format used by llama.cpp and supported by Ollama.
- **Ollama** loads the GGUF and exposes a local HTTP API.

This repo exports an **F16 GGUF** first, then Ollama applies the final quantization when you create the Ollama model.

### 3.7 Evaluation (lightweight, local)
The repo includes a small evaluator that:
- samples examples from the dataset
- asks your Ollama model questions
- compares outputs to the dataset’s reference answers

This is mainly a quick sanity check (and it evaluates on training data, so it’s optimistic).

## 4) Folder map: what each file/folder in Fine-Tune/ does

### Top-level files

- [Fine-Tune/README.md](Fine-Tune/README.md)
  - The original pipeline README with lots of detailed numbers and commands.

- [Fine-Tune/requirements.txt](Fine-Tune/requirements.txt)
  - Python dependencies for dataset generation + training + export.

- [Fine-Tune/.env](Fine-Tune/.env)
  - Optional secrets/config (not meant for git). Used for things like Gemini API keys.

- [Fine-Tune/prepare_dataset.py](Fine-Tune/prepare_dataset.py)
  - Converts the raw knowledge text into a JSONL dataset by:
    1) splitting long text into manageable chunks
    2) generating 2–5 Q&A pairs per chunk
    3) saving them as JSONL (instruction/output)
  - Supports multiple backends:
    - `ollama` (local; default)
    - `gemini` (API; requires API key)
    - `rulebased` (fallback; no LLM required)

- [Fine-Tune/dataset.jsonl](Fine-Tune/dataset.jsonl)
  - The generated training dataset.
  - In this repo’s run: **536 records**.

- [Fine-Tune/train_lora.py](Fine-Tune/train_lora.py)
  - Performs LoRA fine-tuning using:
    - Unsloth (`FastLanguageModel`) for efficient 4-bit training
    - TRL `SFTTrainer` / `SFTConfig` for the training loop
  - Outputs:
    - checkpoints under `lora_output/checkpoint-*`
    - final adapter under `lora_output/lora_adapter/`

- [Fine-Tune/export_model.py](Fine-Tune/export_model.py)
  - Produces an Ollama-ready model file by:
    1) loading the LoRA adapter
    2) merging adapter weights into the model (16-bit)
    3) converting the merged Hugging Face checkpoint to GGUF using `convert_hf_to_gguf.py` from llama.cpp
  - Output GGUF location:
    - `Fine-Tune/gguf_output/unsloth.f16.gguf`

- [Fine-Tune/Modelfile](Fine-Tune/Modelfile)
  - Ollama model definition.
  - Points to the GGUF file and defines:
    - prompt template (must match training)
    - system prompt
    - sampling parameters (temperature, top_p, etc.)

- [Fine-Tune/evaluate.py](Fine-Tune/evaluate.py)
  - Calls your local Ollama server and evaluates answer similarity.
  - Writes results to `eval_results.json`.

- [Fine-Tune/eval_results.json](Fine-Tune/eval_results.json)
  - Saved evaluation report from a past run (includes per-sample predictions).

### Output folders

- [Fine-Tune/lora_output/](Fine-Tune/lora_output/)
  - Training outputs.
  - Key subfolder:
    - `lora_adapter/` (the adapter used for export)

- [Fine-Tune/gguf_output/](Fine-Tune/gguf_output/)
  - Export outputs.
  - Key files/folders:
    - `merged_hf/` (full merged Hugging Face checkpoint)
    - `unsloth.f16.gguf` (final exported GGUF)

### Helper/Generated folders (not “core” to the pipeline)

- [Fine-Tune/unsloth_compiled_cache/](Fine-Tune/unsloth_compiled_cache/)
  - Auto-generated cache files from Unsloth/training acceleration.

- [Fine-Tune/venv/](Fine-Tune/venv/)
  - Local virtual environment folder (if you created one).

## 5) End-to-end: how to reproduce the fine-tune

> The commands below assume you run them from the `Fine-Tune/` directory.

### Step 0 — Prerequisites

You need:
- Python 3.10+ (3.12.x works)
- An NVIDIA GPU is strongly recommended
- Ollama installed (for dataset generation via Ollama backend and for inference/evaluation)

Optional (only needed for dataset generation via Gemini):
- A Gemini API key in `.env` (or pass via CLI)

### Step 1 — Install dependencies

Create a venv and install requirements:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2 — Generate the dataset (TXT → JSONL)

Using local Ollama (default backend):

```bash
python prepare_dataset.py \
  --input ./data/college.data.txt \
  --output dataset.jsonl \
  --backend ollama \
  --ollama-model llama3
```

What happens internally:
- the text file is split into chunks (`split_into_chunks`)
- each chunk is turned into several Q&A pairs
- those pairs are written as JSONL rows

### Step 3 — Train LoRA adapters (JSONL → lora_output/)

```bash
python train_lora.py \
  --dataset dataset.jsonl \
  --output-dir ./lora_output \
  --base-model unsloth/Llama-3.2-3B-unsloth-bnb-4bit \
  --lora-rank 16 \
  --lora-alpha 32 \
  --learning-rate 2e-4 \
  --epochs 3
```

What to expect:
- the script detects GPU vs CPU automatically
- it formats prompts into the Llama 3 instruct template
- it trains the adapter weights and saves them to `lora_output/lora_adapter/`

### Step 4 — Merge + export to GGUF (adapter → GGUF)

```bash
python export_model.py \
  --adapter-dir ./lora_output/lora_adapter \
  --gguf-dir ./gguf_output \
  --max-seq-length 2048
```

Important note:
- Export needs llama.cpp’s `convert_hf_to_gguf.py` available.
- The exporter searches for it on PATH or in `~/.unsloth/llama.cpp/`.

### Step 5 — Create an Ollama model (GGUF → Ollama)

```bash
ollama serve
ollama create jaicianverse -f Modelfile --quantize q4_K_M
ollama run jaicianverse "Who is the Vice Chancellor of JSS STU?"
```

Why `--quantize` here?
- `unsloth.f16.gguf` is exported as F16.
- Ollama can quantize on import (smaller + faster model).

## 6) Evaluation (optional, but recommended)

Run a quick evaluation on a random sample:

```bash
python evaluate.py --model jaicianverse --samples 50
```

Outputs:
- prints keyword overlap / ROUGE-L / core hit rate
- writes a detailed report to [Fine-Tune/eval_results.json](Fine-Tune/eval_results.json)

## 7) How this connects to the app/server

Once the model is registered in Ollama under the name `jaicianverse`, any service in this repo that calls Ollama can use it.

For example, [AI-Server/ollama.js](AI-Server/ollama.js) can point the `model` field to `jaicianverse` when calling Ollama’s `POST /api/generate`.

## 8) Troubleshooting (common issues)

- **Out of memory during training**
  - Lower `--max-seq-length` (e.g., 1024)
  - Reduce LoRA rank (e.g., `--lora-rank 8`)

- **Cannot connect to Ollama**
  - Start it: `ollama serve`
  - Ensure URL matches (default `http://localhost:11434`)

- **GGUF export cannot find `convert_hf_to_gguf.py`**
  - Put it on PATH, or clone llama.cpp, or ensure Unsloth has it under `~/.unsloth/llama.cpp/`

- **Model answers feel generic**
  - Regenerate a higher-quality dataset (try `--backend gemini`)
  - Increase epochs a bit (watch for overfitting)

