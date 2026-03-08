import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class TextClassifier:
    """
    Text Classifier (COMP-072)
    Classifies documents into predefined categories (e.g., Legal, Financial, News, Scam/Fraud).
    Optimized for Ukrainian OSINT data.
    """
    def __init__(self):
        # In a real scenario, this would load a fine-tuned Roberta/BERT model
        # For this skeleton, we use a robust keyword-based heuristic fallback
        self.categories = ["Legal", "Financial", "News", "Fraud_Scam", "Other"]
        self.keywords = {
            "Legal": ["суд", "закон", "ухвала", "позов", "договір", "юридич", "кодекс", "право", "судов"],
            "Financial": ["банк", "фінанс", "кредит", "грош", "рахунок", "валют", "відсоток", "податок", "актив"],
            "Fraud_Scam": ["шахрай", "схем", "відмивання", "підозр", "розслідуван", "корупц", "хабар", "прокурор"],
            "News": ["новин", "сьогодні", "повідомл", "заяв", "анонс", "прес-реліз", "журналіст"]
        }

    def classify(self, text: str) -> Dict[str, Any]:
        """Classifies a single text string."""
        if not text:
            return {"category": "Other", "confidence": 1.0, "all_scores": {c: 0.0 for c in self.categories}}

        text_lower = text.lower()
        scores = {cat: 0.0 for cat in self.categories}
        match_count = 0
        
        for cat, words in self.keywords.items():
            for word in words:
                count = text_lower.count(word)
                if count > 0:
                    scores[cat] += float(count)
                    match_count += count
                    
        # Normalize
        if match_count > 0:
            for cat in scores:
                scores[cat] /= match_count
        else:
            scores["Other"] = 1.0
            
        dominant_category = max(scores.items(), key=lambda x: x[1])[0]
        
        return {
            "category": dominant_category,
            "confidence": scores[dominant_category],
            "all_scores": scores
        }
        
    def classify_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        return [self.classify(t) for t in texts]

from functools import lru_cache

@lru_cache()
def get_text_classifier() -> TextClassifier:
    """Returns a singleton instance of the TextClassifier."""
    return TextClassifier()
