import pytest
import os
import json
from unittest.mock import patch, mock_open, MagicMock

from app.services.fine_tuning_orchestrator import FineTuningOrchestrator

@pytest.fixture
def orchestrator():
    return FineTuningOrchestrator()

def test_prepare_hyperparameters(orchestrator):
    # Тестування для великого датасету
    large_metrics = {"count": 15000}
    params = orchestrator.prepare_hyperparameters(large_metrics)
    assert params["batch_size"] == 8
    assert params["epochs"] == 3
    assert params["learning_rate"] == 1e-4

    # Тестування для малого датасету
    small_metrics = {"count": 5000}
    params = orchestrator.prepare_hyperparameters(small_metrics)
    assert params["batch_size"] == 4
    assert params["epochs"] == 5
    assert params["learning_rate"] == 2e-4

@patch("subprocess.run")
def test_start_training_job_success(mock_run, orchestrator):
    mock_run.return_value = MagicMock(returncode=0)
    params = {"rank": 32, "alpha": 64, "epochs": 2, "batch_size": 8}
    
    result = orchestrator.start_training_job("dummy_dataset.json", params)
    
    assert result["status"] == "training_completed"
    assert "run_id" in result
    assert result["hyperparameters"] == params
    assert mock_run.called

@patch("subprocess.run")
def test_start_training_job_failure_fallback(mock_run, orchestrator):
    mock_run.return_value = MagicMock(returncode=1, stderr="Some error")
    params = {"rank": 32}
    
    result = orchestrator.start_training_job("dummy_dataset.json", params)
    
    # Має перейти в MOCK-режим
    assert result["status"] == "training_completed"
    assert result["hyperparameters"].get("_mocked") is True

@patch("subprocess.run")
def test_evaluate_model_success(mock_run, orchestrator):
    mock_run.return_value = MagicMock(returncode=0)
    
    mock_metrics = {"f1_score": 0.90, "hallucination_rate": 0.01}
    
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_metrics))):
        metrics = orchestrator.evaluate_model("dummy_run_id")
        
    assert metrics == mock_metrics
    assert mock_run.called

@patch("subprocess.run")
def test_evaluate_model_failure_fallback(mock_run, orchestrator):
    mock_run.return_value = MagicMock(returncode=1, stderr="Eval error")
    
    metrics = orchestrator.evaluate_model("dummy_run_id")
    
    # Fallback значення
    assert metrics["f1_score"] == 0.88
    assert metrics["hallucination_rate"] == 0.015
    assert metrics.get("_mocked") is True

def test_compare_and_deploy_better(orchestrator):
    orchestrator.current_model_metrics = {"f1_score": 0.85, "hallucination_rate": 0.02}
    new_metrics = {"f1_score": 0.88, "hallucination_rate": 0.01}
    
    result = orchestrator.compare_and_deploy(new_metrics)
    
    assert result["decision"] == "deploy"
    assert orchestrator.current_model_metrics == new_metrics

def test_compare_and_deploy_worse(orchestrator):
    orchestrator.current_model_metrics = {"f1_score": 0.85, "hallucination_rate": 0.02}
    new_metrics = {"f1_score": 0.80, "hallucination_rate": 0.03}
    
    result = orchestrator.compare_and_deploy(new_metrics)
    
    assert result["decision"] == "reject"
    # Поточна модель не має змінитися
    assert orchestrator.current_model_metrics["f1_score"] == 0.85
