import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """
    Sentiment Analyzer (COMP-048)
    Analyzes sentiment in Ukrainian text (Positive, Negative, Neutral).
    """
    def __init__(self):
        # Extremely simplified rule-based sentiment lexicon for demo purposes.
        self.positive_words = ["успіх", "зростання", "перемога", "прибуток", "дохід", "розвиток", "позитивний", "надійний"]
        self.negative_words = ["суд", "банкрутство", "збиток", "шахрайство", "борг", "криза", "скандал", "підозра", "злочин"]

    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyzes the sentiment of given text.
        """
        if not text:
            return {"sentiment": "neutral", "score": 0.0, "confidence": 0.0}

        text_lower = text.lower()
        
        pos_count = sum(1 for word in self.positive_words if word in text_lower)
        neg_count = sum(1 for word in self.negative_words if word in text_lower)
        
        total_matched = pos_count + neg_count
        
        if total_matched == 0:
            return {"sentiment": "neutral", "score": 0.0, "confidence": 0.5}
            
        score = (pos_count - neg_count) / total_matched
        
        if score > 0.2:
            sentiment = "positive"
        elif score < -0.2:
            sentiment = "negative"
        else:
            sentiment = "neutral"
            
        return {
            "sentiment": sentiment,
            "score": score,  # Range [-1, 1]
            "confidence": min(1.0, total_matched * 0.2)
        }
