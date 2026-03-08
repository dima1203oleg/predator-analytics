import logging
from typing import List, Dict, Any, Tuple
from collections import Counter
import re

logger = logging.getLogger(__name__)

class TrendDetector:
    """
    Trend Detector (COMP-077)
    Analyzes sequences of texts over time to detect emerging topics, 
    keywords, or sentiment shifts.
    """
    def __init__(self):
        # Basic Ukrainian stop words (would be expanded in prod)
        self.stop_words = {"та", "і", "в", "на", "з", "за", "до", "для", "про", "що", "як", "це", "не", "від", "у", "а", "або", "чи", "щоб", "бо", "але", "якщо"}
        
    def _extract_keywords(self, text: str) -> List[str]:
        words = re.findall(r'\b[а-яА-ЯіІїЇєЄґҐa-zA-Z]{4,}\b', text.lower())
        return [w for w in words if w not in self.stop_words]

    def detect_trends(self, texts_time1: List[str], texts_time2: List[str]) -> Dict[str, Any]:
        """
        Detects trends by comparing term frequencies in two time windows.
        Returns top growing and declining terms.
        """
        freq1 = Counter()
        for t in texts_time1:
            freq1.update(self._extract_keywords(t))
            
        freq2 = Counter()
        for t in texts_time2:
            freq2.update(self._extract_keywords(t))
            
        # Calculate TF for normalisation
        total1 = max(sum(freq1.values()), 1)
        total2 = max(sum(freq2.values()), 1)
        
        tf1 = {w: count / total1 for w, count in freq1.items()}
        tf2 = {w: count / total2 for w, count in freq2.items()}
        
        all_words = set(tf1.keys()).union(set(tf2.keys()))
        
        growth = []
        for word in all_words:
            t1 = tf1.get(word, 0.0)
            t2 = tf2.get(word, 0.0)
            
            # Simple growth ratio (add small epsilon to avoid div by zero)
            ratio = (t2 + 1e-5) / (t1 + 1e-5)
            growth.append({
                "term": word,
                "tf_past": t1,
                "tf_current": t2,
                "growth_ratio": ratio
            })
            
        # Sort by growth ratio
        growth.sort(key=lambda x: x["growth_ratio"], reverse=True)
        
        # Filter out low frequency terms in the present for 'emerging' 
        emerging = [g for g in growth if float(g["tf_current"]) > (1 / total2)]
        declining = [g for g in growth if float(g["tf_past"]) > (1 / total1)]
        declining.sort(key=lambda x: float(x["growth_ratio"])) # Lowest ratio first
        
        return {
            "emerging_trends": emerging[:10],
            "declining_trends": declining[:10],
            "total_terms_analyzed": len(all_words)
        }

from functools import lru_cache

@lru_cache()
def get_trend_detector() -> TrendDetector:
    """Returns a singleton instance of the TrendDetector."""
    return TrendDetector()
