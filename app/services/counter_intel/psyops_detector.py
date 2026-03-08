import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class PsyopsDetector:
    """
    Psyops Detector & Disinformation Tracker (COMP-268 / COMP-271)
    Analyzes bot activity, narrative origin, and amplification patterns
    to identify information warfare campaigns.
    """
    def __init__(self):
        pass

    def analyze_narrative(self, narrative_id: str, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes a narrative for bot-like or coordinated amplification.
        posts = [{"author": "id1", "bot_score": 0.9, "sentiment": -0.8, "content": "fake news"}]
        """
        if not posts:
            return {"error": "No data provided for narrative analysis."}
            
        bot_count = 0
        extreme_sentiment_posts = 0
        
        for post in posts:
            score = post.get("bot_score", 0.0)
            sentiment = post.get("sentiment", 0.0)
            
            if score > 0.7:
                bot_count += 1
            if sentiment < -0.6 or sentiment > 0.6:  # Highly polarized
                extreme_sentiment_posts += 1
                
        bot_ratio = bot_count / len(posts)
        polarization_ratio = extreme_sentiment_posts / len(posts)
        
        # Determine if it's coordination
        is_coordinated = False
        campaign_type = "Organic"
        
        if bot_ratio > 0.3 and polarization_ratio > 0.4:
            is_coordinated = True
            campaign_type = "Automated Astroturfing / PsyOp"
        elif bot_ratio > 0.15:
            is_coordinated = True
            campaign_type = "Suspected Bot Amplification"
            
        return {
            "narrative_id": narrative_id,
            "total_posts": len(posts),
            "bot_ratio": bot_ratio,
            "polarization_ratio": polarization_ratio,
            "is_coordinated": is_coordinated,
            "campaign_type": campaign_type,
            "threat_rating": "HIGH" if is_coordinated else "LOW"
        }
