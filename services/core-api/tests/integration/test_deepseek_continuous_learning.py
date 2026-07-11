import os
import json
import pytest
import pandas as pd
from unittest.mock import patch, MagicMock

from app.services.dataset_builder import dataset_builder_service
from app.services.synthetic_data_agent import synthetic_data_agent
from app.services.fine_tuning_orchestrator import fine_tuning_orchestrator
from app.routers.deepseek_tuning import full_tuning_pipeline

@pytest.fixture
def mock_dataset_files(tmp_path):
    """
    Creates temporary mock dataset files (CSV, JSON, Excel) for testing Sections 3 & 4.
    """
    datasets = {}
    
    # 1. Valid JSON with duplicates and messy strings
    json_data = [
        {"instruction": " Explain ML ", "input": "", "output": "Machine learning is... "},
        {"instruction": "Explain ML", "input": "", "output": "Machine learning is..."}, # Duplicate
        {"instruction": "What is AI?", "input": "Context", "output": "AI is artificial intelligence."}
    ]
    json_file = tmp_path / "raw.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(json_data, f)
    datasets["json"] = str(json_file)

    # 2. CSV with empty records
    csv_data = pd.DataFrame([
        {"instruction": "How to tune?", "input": "", "output": "Use LoRA."},
        {"instruction": None, "input": "", "output": "Empty instruction."},
        {"instruction": "Valid", "input": "Valid input", "output": "Valid output."}
    ])
    csv_file = tmp_path / "raw.csv"
    csv_data.to_csv(csv_file, index=False)
    datasets["csv"] = str(csv_file)

    # 3. Excel
    excel_data = pd.DataFrame([
        {"instruction": "Excel test", "input": "data", "output": "Success"}
    ])
    excel_file = tmp_path / "raw.xlsx"
    excel_data.to_excel(excel_file, index=False)
    datasets["excel"] = str(excel_file)
    
    return datasets


class TestDeepSeekContinuousLearning:
    
    # --------------------------------------------------------------------------
    # Sections 3 & 4: Dataset Upload, Normalization & Cleaning
    # --------------------------------------------------------------------------
    def test_dataset_builder_processing(self, mock_dataset_files):
        """Test import of multiple formats, duplicate removal, and cleaning."""
        # Clear deduplication cache for clean test state
        dataset_builder_service.seen_hashes.clear()
        
        sources = [
            {"type": "json", "path": mock_dataset_files["json"]},
            {"type": "csv", "path": mock_dataset_files["csv"]},
            {"type": "excel", "path": mock_dataset_files["excel"]},
            {"type": "invalid", "path": "doesnt_exist.txt"}
        ]
        
        processed = dataset_builder_service.process_raw_data(sources)
        
        # Expected from JSON: 2 valid records (1 is a duplicate removed via hashing)
        # Expected from CSV: 1 valid record (empty cells get dropped by df.dropna())
        # Expected from Excel: 1 valid record
        # Total = 4 records
        assert len(processed) == 4
        
        # Check normalization (no extra spaces)
        ml_record = next((r for r in processed if "Explain ML" in r["instruction"]), None)
        assert ml_record is not None
        assert ml_record["instruction"] == "Explain ML"
        assert ml_record["output"] == "Machine learning is..."
        
    def test_dataset_metrics_and_splits(self):
        """Test dataset statistics and splitting."""
        data = [
            {"instruction": f"Inst {i}", "input": "", "output": f"Out {i}"} for i in range(100)
        ]
        metrics = dataset_builder_service.calculate_quality_metrics(data)
        assert metrics["count"] == 100
        assert "avg_chars_per_record" in metrics
        assert "estimated_tokens" in metrics
        
        splits = dataset_builder_service.generate_splits(data, train_ratio=0.8, val_ratio=0.1)
        assert len(splits["train"]) == 80
        assert len(splits["validation"]) == 10
        assert len(splits["test"]) == 10

    # --------------------------------------------------------------------------
    # Section 6: Synthetic Dataset Generation
    # --------------------------------------------------------------------------
    @patch("app.services.synthetic_data_agent.SyntheticDataAgent._generate_synthetic_record")
    def test_synthetic_data_agent(self, mock_generate):
        """Test synthetic augmentation."""
        base_data = [
            {"instruction": "Analyze this risk.", "input": "Risk factor 1", "output": "High risk."}
        ]
        
        # Mock the generation to return modified copies
        def mock_generate_side_effect(record, aug_type):
            return {
                "instruction": f"[{aug_type}] " + record["instruction"],
                "input": record["input"],
                "output": record["output"]
            }
        mock_generate.side_effect = mock_generate_side_effect
        
        augmented = synthetic_data_agent.augment_dataset(base_data, augmentation_factor=2)
        
        # 1 original + 2 synthetic
        assert len(augmented) == 3
        assert augmented[0] == base_data[0]
        
        # Check that variations differ from the original
        assert augmented[1]["instruction"] != base_data[0]["instruction"]
        assert augmented[2]["instruction"] != base_data[0]["instruction"]

    # --------------------------------------------------------------------------
    # Section 5 & 13: Fine Tuning Orchestrator & Resilience
    # --------------------------------------------------------------------------
    @patch("subprocess.run")
    def test_fine_tuning_success(self, mock_subprocess_run):
        """Test successful start of a fine-tuning job."""
        mock_subprocess_run.return_value = MagicMock(returncode=0, stdout="Success", stderr="")
        
        params = {"epochs": 2, "batch_size": 4}
        result = fine_tuning_orchestrator.start_training_job("dummy_dataset.json", params)
        
        assert result["status"] == "training_completed"
        assert "run_id" in result
        assert result["base_model"] == "deepseek-r1:latest"
        
    @patch("subprocess.run")
    def test_fine_tuning_failure_resilience(self, mock_subprocess_run):
        """Test resilience to missing ML libraries (Fallback execution)."""
        # Mocking an environment where ML libraries are missing (e.g. MacBook local IDE)
        mock_subprocess_run.return_value = MagicMock(returncode=1, stdout="Error importing ML libraries", stderr="")
        
        params = {"epochs": 2, "batch_size": 4}
        result = fine_tuning_orchestrator.start_training_job("dummy_dataset.json", params)
        
        # System should fallback and add _mocked=True instead of crashing
        assert result["status"] == "training_completed"
        assert result["hyperparameters"].get("_mocked") is True

    @patch("subprocess.run")
    def test_fine_tuning_evaluation_and_decision(self, mock_subprocess_run):
        """Test model evaluation and deployment decision."""
        # Setup fallback mock state for evaluation
        mock_subprocess_run.return_value = MagicMock(returncode=1, stdout="Error importing ML libraries", stderr="")
        fine_tuning_orchestrator._last_lora_dir = "artifacts/models/mocked_run"
        
        eval_metrics = fine_tuning_orchestrator.evaluate_model("mocked_run")
        assert "f1_score" in eval_metrics
        assert "hallucination_rate" in eval_metrics
        
        # Test deployment decision (Baseline F1 is 0.85, Hallucination is 0.02)
        # Should deploy
        better_metrics = {"f1_score": 0.90, "hallucination_rate": 0.01}
        decision_deploy = fine_tuning_orchestrator.compare_and_deploy(better_metrics)
        assert decision_deploy["decision"] == "deploy"
        
        # Should reject (Regression)
        worse_metrics = {"f1_score": 0.80, "hallucination_rate": 0.05}
        decision_reject = fine_tuning_orchestrator.compare_and_deploy(worse_metrics)
        assert decision_reject["decision"] == "reject"

    # --------------------------------------------------------------------------
    # Section 7: Cyclical Execution (Full Pipeline)
    # --------------------------------------------------------------------------
    @patch("app.routers.deepseek_tuning.dataset_builder_service")
    @patch("app.routers.deepseek_tuning.synthetic_data_agent")
    @patch("app.routers.deepseek_tuning.fine_tuning_orchestrator")
    @patch("app.routers.deepseek_tuning.extract_real_data_to_json")
    @pytest.mark.asyncio
    async def test_full_pipeline_execution(self, mock_extract, mock_ft, mock_synth, mock_builder):
        """Simulate a full pipeline execution cycle to ensure components link properly."""
        # Setup mocks
        mock_builder.process_raw_data.return_value = [{"instruction": "test", "input": "", "output": "test"}]
        mock_synth.augment_dataset.return_value = [{"instruction": "aug", "input": "", "output": "aug"}]
        mock_builder.calculate_quality_metrics.return_value = {"count": 1}
        mock_builder.generate_splits.return_value = {"train": [], "validation": [], "test": []}
        
        mock_ft.prepare_hyperparameters.return_value = {"epochs": 1}
        mock_ft.start_training_job.return_value = {"run_id": "test1"}
        mock_ft.evaluate_model.return_value = {"f1_score": 0.9}
        mock_ft.compare_and_deploy.return_value = {"decision": "deploy"}
        
        # Execute the pipeline
        await full_tuning_pipeline()
        
        # Assert each step of the lifecycle was invoked
        mock_builder.process_raw_data.assert_called_once()
        mock_synth.augment_dataset.assert_called_once()
        mock_builder.generate_splits.assert_called_once()
        mock_ft.start_training_job.assert_called_once()
        mock_ft.evaluate_model.assert_called_once_with("test1")
        mock_ft.compare_and_deploy.assert_called_once()
