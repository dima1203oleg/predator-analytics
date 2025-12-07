import sys
import os

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.services.ml import get_reranker, get_summarizer

print("Testing Reranker...")
try:
    reranker = get_reranker()
    docs = [
        {"id": "1", "title": "Machine Learning Guide", "content": "ML tutorial"},
        {"id": "2", "title": "Cooking Recipes", "content": "Food recipes"}
    ]
    results = reranker.rerank("machine learning", docs, top_k=2)
    print(f"✅ Reranker OK: {len(results)} results")
    print(f"Top result: {results[0]}")
except Exception as e:
    print(f"❌ Reranker Failed: {e}")
    import traceback
    traceback.print_exc()

print("\nTesting Summarizer...")
try:
    summarizer = get_summarizer()
    text = "This is a long document that needs to be summarized. " * 20
    summary = summarizer.summarize(text, max_length=50)
    print(f"✅ Summarizer OK: {summary[:100]}...")
except Exception as e:
    print(f"❌ Summarizer Failed: {e}")
    import traceback
    traceback.print_exc()
