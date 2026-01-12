"""
Multi-Model Fallback System
Automatic fallback between free AI models for maximum reliability

NOTE: Now using Ultimate Fallback with 20+ providers
"""
from .ultimate_fallback import get_ultimate_fallback

# Re-export for compatibility
def get_fallback():
    """Get ultimate fallback instance"""
    return get_ultimate_fallback()
