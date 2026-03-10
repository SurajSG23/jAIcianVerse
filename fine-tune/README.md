# Llama 3 LoRA Fine-Tuning Pipeline

End-to-end pipeline to fine-tune Llama 3 on a domain-specific knowledge file so
the model **internalizes** the information (no RAG required at inference time).

```
TXT  -->  Dataset (JSONL)  -->  LoRA Fine-Tune  -->  GGUF  -->  Ollama Model
```

---

## Project Structure

```
fine-tune/
  prepare_dataset.py   # Chunk text + generate Q&A instruction dataset
  train_lora.py        # LoRA fine-tune with Unsloth (4-bit quantized)
  export_model.py      # Merge adapter + export GGUF for Ollama
  requirements.txt     # Python dependencies
  Modelfile            # Ollama model definition
  README.md            # This file
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Python 3.10+ | 3.11 recommended |
| NVIDIA GPU (16 GB+ VRAM) | CPU fallback exists but is very slow |
| CUDA 12.x + cuDNN | Required for GPU training |
| Ollama | For serving the finished model locally |

> **Tip:** A free Google Colab T4 or an L4 instance works well for the
> 8B parameter model with 4-bit quantization.

---

## 1. Install Dependencies

```bash
# (Optional) Create a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

If you are on Colab, Unsloth provides a single-line installer:

```python
# In a Colab cell
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
```

---

## 2. Prepare the Dataset

`prepare_dataset.py` reads a `.txt` knowledge file, splits it into chunks, and
generates instruction-tuning Q&A pairs.

### Using a local Ollama model (default)

```bash
python prepare_dataset.py \
  --input ../data/college.data.txt \
  --output dataset.jsonl \
  --backend ollama \
  --ollama-model llama3
```

### Using Google Gemini

```bash
python prepare_dataset.py \
  --input ../data/college.data.txt \
  --output dataset.jsonl \
  --backend gemini \
  --gemini-api-key YOUR_API_KEY
```

### Rule-based fallback (no LLM needed)

```bash
python prepare_dataset.py \
  --input ../data/college.data.txt \
  --output dataset.jsonl \
  --backend rulebased
```

Output: a `dataset.jsonl` file where each line has the schema:

```json
{"instruction": "question", "input": "", "output": "answer"}
```

---

## 3. Fine-Tune with LoRA

```bash
python train_lora.py \
  --dataset dataset.jsonl \
  --output-dir ./lora_output \
  --base-model unsloth/Meta-Llama-3-8B-Instruct-bnb-4bit \
  --lora-rank 16 \
  --lora-alpha 32 \
  --learning-rate 2e-4 \
  --epochs 3
```

### What happens under the hood

1. **Hardware detection** -- the script picks GPU or CPU automatically and
   adjusts batch size and precision accordingly.
2. **Model loading** -- Llama 3 8B Instruct is loaded in 4-bit (NF4)
   quantization via Unsloth, using roughly 5-6 GB VRAM.
3. **LoRA injection** -- Low-Rank Adapters are applied to all attention and
   MLP projection layers (`q/k/v/o_proj`, `gate/up/down_proj`).
4. **Training** -- SFTTrainer from the `trl` library handles the supervised
   fine-tuning loop with gradient checkpointing and 8-bit AdamW.
5. **Checkpoint saving** -- The LoRA adapter (a few hundred MB) is saved to
   `lora_output/lora_adapter/`.

### Training Parameters (defaults)

| Parameter | Value |
|---|---|
| LoRA rank | 16 |
| LoRA alpha | 32 |
| Learning rate | 2e-4 |
| Batch size (GPU) | 2 |
| Gradient accumulation | 4 |
| Effective batch size | 8 |
| Epochs | 3 |
| Optimizer | AdamW 8-bit |
| Precision | bf16 (if supported) else fp16 |

---

## 4. Export to GGUF

```bash
python export_model.py \
  --adapter-dir ./lora_output/lora_adapter \
  --gguf-dir ./gguf_output \
  --quant q4_k_m
```

Available quantization levels: `q4_k_m` (recommended), `q5_k_m`, `q8_0`, `f16`.

The script:

1. Reloads the base model + LoRA adapter.
2. Merges the adapter weights into the base weights.
3. Exports a single `.gguf` file using Unsloth's built-in converter.
4. Falls back to `llama.cpp`'s `convert_hf_to_gguf.py` if needed.

---

## 5. Load into Ollama

```bash
# Make sure Ollama is running
ollama serve

# Create the model (run from the fine-tune/ directory)
ollama create jaicianverse -f Modelfile

# Test it
ollama run jaicianverse "Who is the Vice Chancellor of JSS STU?"
```

### Modelfile details

The provided `Modelfile`:

- Points to the exported GGUF (`gguf_output/unsloth.Q4_K_M.gguf`).
- Uses the exact Llama 3 Instruct chat template that was used during training.
- Sets a system prompt tuned for the college knowledge domain.
- Configures conservative generation parameters (temperature 0.4).

> If your GGUF filename differs, edit the `FROM` line in the Modelfile to
> match the actual path.

---

## 6. Integrate with the Node.js AI-Server

Once the model is registered in Ollama, the existing `AI-Server/ollama.js` can
call it by name.  Update the model parameter to `"jaicianverse"` in your
Ollama API calls:

```js
const response = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  body: JSON.stringify({
    model: "jaicianverse",
    prompt: userQuestion,
    stream: false,
  }),
});
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `OutOfMemoryError` during training | Reduce `--max-seq-length` to 1024, or use `--lora-rank 8` |
| Unsloth import error | Make sure `bitsandbytes` and `xformers` match your CUDA version |
| GGUF export fails | Install `llama-cpp-python` or clone `llama.cpp` and use the manual conversion path |
| Ollama model gives generic answers | Increase training epochs to 5, or improve the dataset quality by using the Gemini backend |
| Dataset has low quality pairs | Switch from `rulebased` to `ollama` or `gemini` backend for Q&A generation |

---

## Full Pipeline (copy-paste)

```bash
# 1. Prepare
python prepare_dataset.py -i ../data/college.data.txt -o dataset.jsonl --backend ollama

# 2. Train
python train_lora.py -d dataset.jsonl -o ./lora_output --epochs 3

# 3. Export
python export_model.py --adapter-dir ./lora_output/lora_adapter --gguf-dir ./gguf_output -q q4_k_m

# 4. Ollama
ollama create jaicianverse -f Modelfile
ollama run jaicianverse
```
