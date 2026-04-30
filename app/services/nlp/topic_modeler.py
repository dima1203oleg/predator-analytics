import logging
from typing import Any

logger = logging.getLogger(__name__)

class TopicModeler:
    """Topic Modeler (COMP-049)
    Extracts underlying topics from a collection of texts using TF-IDF and NMF.
    """

    def __init__(self, num_topics: int = 5):
        self.num_topics = num_topics
        try:
            from sklearn.decomposition import NMF
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.vectorizer = TfidfVectorizer(max_df=0.95, min_df=2)
            self.model = NMF(n_components=self.num_topics, random_state=42)
            self.enabled = True
        except ImportError:
            logger.warning("scikit-learn not installed. TopicModeler will run in degradation mode.")
            self.enabled = False

    def fit_transform(self, texts: list[str]) -> dict[str, Any]:
        """Fits the model on a list of texts and returns the topic distribution for each.
        """
        if not self.enabled:
            return {"error": "Dependencies missing"}

        if not texts or len(texts) < 2:
            return {"error": "Need at least 2 texts for topic modeling"}

        try:
            tfidf = self.vectorizer.fit_transform(texts)
            W = self.model.fit_transform(tfidf)
            H = self.model.components_

            feature_names = self.vectorizer.get_feature_names_out()

            topics = []
            for topic_idx, topic in enumerate(H):
                top_features_ind = topic.argsort()[:-10 - 1:-1]
                top_features = [feature_names[i] for i in top_features_ind]
                topics.append({
                    "topic_id": topic_idx,
                    "top_words": top_features
                })

            results = []
            for i, text in enumerate(texts):
                dominant_topic = int(W[i].argmax())
                results.append({
                    "text_snippet": text[:100] + "...",
                    "dominant_topic_id": dominant_topic,
                    "topic_weights": W[i].tolist()
                })

            return {
                "topics": topics,
                "document_topics": results
            }
        except Exception as e:
            logger.error(f"Topic modeling failed: {e}")
            raise

from functools import lru_cache


@lru_cache
def get_topic_modeler() -> TopicModeler:
    """Returns a singleton instance of the TopicModeler."""
    return TopicModeler()
