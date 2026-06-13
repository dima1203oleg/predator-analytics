from fastapi import APIRouter, BackgroundTasks, HTTPException
from typing import List, Dict, Any
from app.services.dataset_builder import dataset_builder_service
from app.services.synthetic_data_agent import synthetic_data_agent
from app.services.fine_tuning_orchestrator import fine_tuning_orchestrator
import os
import json

router = APIRouter(prefix="/deepseek_tuning", tags=["DeepSeek Auto Tuning"])

def full_tuning_pipeline():
    """
    Background task to run the complete pipeline
    """
    # 1. Gather mock sources
    sources = [
        {"type": "json", "path": "artifacts/datasets/raw_source.json"}
    ]
    
    # 2. ETL & Cleaning & Deduplication
    processed_data = dataset_builder_service.process_raw_data(sources)
    if not processed_data:
        # Fallback to empty if no file found for demo purposes
        processed_data = [{"instruction": "Test", "input": "Input", "output": "Output"}]
        
    # 3. Augmentation
    augmented_data = synthetic_data_agent.augment_dataset(processed_data, augmentation_factor=2)
    
    # 4. Metrics & Splitting
    metrics = dataset_builder_service.calculate_quality_metrics(augmented_data)
    splits = dataset_builder_service.generate_splits(augmented_data)
    
    # Save the splits to disk (simulate DVC/storage)
    os.makedirs("artifacts/datasets/deepseek", exist_ok=True)
    for split_name, split_data in splits.items():
        with open(f"artifacts/datasets/deepseek/{split_name}.json", "w", encoding="utf-8") as f:
            json.dump(split_data, f, ensure_ascii=False, indent=2)
            
    # 5. Hyperparams
    params = fine_tuning_orchestrator.prepare_hyperparameters(metrics)
    
    # 6. Training Job
    job = fine_tuning_orchestrator.start_training_job("artifacts/datasets/deepseek/train.json", params)
    
    # 7. Evaluation
    eval_metrics = fine_tuning_orchestrator.evaluate_model(job["run_id"])
    
    # 8. Deployment Decision
    decision = fine_tuning_orchestrator.compare_and_deploy(eval_metrics)
    
    # Write report
    report = {
        "job": job,
        "dataset_metrics": metrics,
        "eval_metrics": eval_metrics,
        "decision": decision
    }
    with open("artifacts/datasets/deepseek/latest_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)


@router.post("/start_pipeline")
async def start_pipeline(background_tasks: BackgroundTasks):
    """
    Starts the full automated cycle for DeepSeek-R1 fine-tuning.
    """
    background_tasks.add_task(full_tuning_pipeline)
    return {"message": "DeepSeek Auto Tuning pipeline started"}

@router.get("/status")
async def get_status():
    """
    Gets the latest tuning report
    """
    path = "artifacts/datasets/deepseek/latest_report.json"
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"status": "No active or completed tuning jobs found."}
