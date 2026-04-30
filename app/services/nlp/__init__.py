"""NLP Services Package."""
from app.services.nlp.ner_service import NamedEntity, NERResult, NERService, get_ner_service
from app.services.nlp.sentiment_analyzer import (
    SentimentAnalyzer,
    SentimentResult,
    get_sentiment_analyzer,
)
from app.services.nlp.text_classifier import TextClassifier, get_text_classifier
from app.services.nlp.topic_modeler import TopicModeler, get_topic_modeler
from app.services.nlp.trend_detector import TrendDetector, get_trend_detector

__all__ = [
    "NERResult",
    "NERService",
    "NamedEntity",
    "SentimentAnalyzer",
    "SentimentResult",
    "TextClassifier",
    "TopicModeler",
    "TrendDetector",
    "get_ner_service",
    "get_sentiment_analyzer",
    "get_text_classifier",
    "get_topic_modeler",
    "get_trend_detector"
]

