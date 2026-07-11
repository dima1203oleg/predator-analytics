import argparse
import json
import logging
import os
import sys

# Ensure torch is available before importing heavy libs
try:
    import torch
    from datasets import Dataset
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        TrainingArguments,
    )
    from peft import LoraConfig, get_peft_model
    from transformers import Trainer, DataCollatorForLanguageModeling
except ImportError as e:
    print(f"Error importing ML libraries: {e}")
    sys.exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="LoRA Fine-Tuning Script")
    parser.add_argument("--model", type=str, required=True, help="Base model name or path")
    parser.add_argument("--dataset", type=str, required=True, help="Path to training dataset JSON")
    parser.add_argument("--output_dir", type=str, required=True, help="Directory to save the adapter")
    parser.add_argument("--rank", type=int, default=16, help="LoRA rank")
    parser.add_argument("--alpha", type=int, default=32, help="LoRA alpha")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=4, help="Batch size")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    args = parser.parse_args()

    logger.info(f"Starting Fine-Tuning for model {args.model}")
    logger.info(f"Dataset: {args.dataset}, Output: {args.output_dir}")

    # Load dataset
    with open(args.dataset, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Format data for causal LM (e.g. prompt + response)
    # We assume data is a list of dicts with 'instruction', 'input', 'output'
    formatted_data = []
    for item in data:
        prompt = f"Instruction: {item.get('instruction', '')}\nInput: {item.get('input', '')}\nResponse: {item.get('output', '')}"
        formatted_data.append({"text": prompt})
    
    dataset = Dataset.from_list(formatted_data)

    device_map = "auto"
    if torch.backends.mps.is_available():
        device_map = "mps"

    logger.info("Loading tokenizer and model...")
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Load base model
    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        torch_dtype=torch.float16,
        device_map=device_map,
        trust_remote_code=True
    )

    # Configure LoRA
    lora_config = LoraConfig(
        r=args.rank,
        lora_alpha=args.alpha,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Training arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        learning_rate=args.lr,
        num_train_epochs=args.epochs,
        logging_steps=10,
        optim="adamw_torch",
        save_strategy="epoch",
        fp16=True, # enable fp16 for faster training
        remove_unused_columns=True,
    )

    # Tokenize the dataset
    def tokenize_function(examples):
        return tokenizer(examples["text"], truncation=True, max_length=512, padding="max_length")

    tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=["text"])

    # Trainer
    trainer = Trainer(
        model=model,
        train_dataset=tokenized_dataset,
        args=training_args,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False)
    )

    logger.info("Starting training loop...")
    trainer.train()

    logger.info("Saving model adapter...")
    trainer.model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    logger.info("Training complete.")


if __name__ == "__main__":
    main()
