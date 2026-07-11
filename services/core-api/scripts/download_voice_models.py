import os
import urllib.request
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS = {
    "uk_UA-ukrainian_tts-medium.onnx": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx",
    "uk_UA-ukrainian_tts-medium.onnx.json": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx.json"
}

APP_DIR = os.path.join(os.path.dirname(__file__), "..", "app")

def download_models():
    os.makedirs(APP_DIR, exist_ok=True)
    for filename, url in MODELS.items():
        filepath = os.path.join(APP_DIR, filename)
        if not os.path.exists(filepath):
            logger.info(f"Downloading {filename}...")
            urllib.request.urlretrieve(url, filepath)
            logger.info(f"Saved {filename}")
        else:
            logger.info(f"Model {filename} already exists.")

if __name__ == "__main__":
    download_models()
