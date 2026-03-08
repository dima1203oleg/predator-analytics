import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class FeedbackCollector:
    """
    Feedback Collector (COMP-195)
    Gathers user feedback on model predictions and analytical insights 
    for continuous self-improvement.
    """
    def __init__(self):
        self._feedback_store = []

    def log_feedback(self, 
                     prediction_id: str, 
                     user_id: str, 
                     is_accurate: bool, 
                     correction: str = None, 
                     comments: str = None) -> Dict[str, Any]:
        """
        Record feedback from an analyst on a specific AI generation or prediction.
        """
        feedback_entry = {
            "prediction_id": prediction_id,
            "user_id": user_id,
            "is_accurate": is_accurate,
            "correction": correction,
            "comments": comments
        }
        self._feedback_store.append(feedback_entry)
        
        # Trigger retraining pipeline (simulated)
        if not is_accurate:
            # Trigger logic for active learning
            pass
            
        return {
            "status": "success",
            "message": "Feedback recorded. Thank you for training the system.",
            "total_feedbacks": len(self._feedback_store)
        }

    def get_accuracy_stats(self) -> Dict[str, Any]:
        """
        Calculates simple accuracy statistics from the collected feedback.
        """
        if not self._feedback_store:
            return {"accuracy": 0.0, "total_samples": 0}
            
        accurate_count = sum(1 for f in self._feedback_store if f["is_accurate"])
        accuracy = accurate_count / len(self._feedback_store)
        
        return {
            "accuracy": accuracy,
            "total_samples": len(self._feedback_store)
        }
