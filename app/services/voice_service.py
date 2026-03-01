import base64
import gettext
import logging
import os

from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import service_account
import requests


# Налаштування логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Налаштування локалізації (i18n)
locale_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "locales")
try:
    uk_trans = gettext.translation("messages", localedir=locale_path, languages=["uk"])
    uk_trans.install()
    _ = uk_trans.gettext
except FileNotFoundError:
    logging.warning("Файл перекладу .mo не знайдено. Використовується режим за замовчуванням.")

    def _(s):
        return s


class VoiceService:
    """Сервіс для обробки голосу, що використовує Google Cloud REST API.
    Всі операції суворо налаштовані на українську мову (uk-UA).
    """

    def __init__(self):
        """Ініціалізує сервіс.
        Перевіряє наявність змінних середовища для аутентифікації.
        """
        self.creds = None
        if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            logger.error(_("Google Cloud credentials not found."))
            print(_("Google Cloud credentials not found."))
        else:
            try:
                self.creds = service_account.Credentials.from_service_account_file(
                    os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"),
                    scopes=["https://www.googleapis.com/auth/cloud-platform"],
                )
                logger.info(_("Voice service initialized successfully (REST mode)."))
            except Exception as e:
                logger.exception(f"Failed to load credentials: {e}")

        # Сувора конфігурація мови
        self.language_code = "uk-UA"
        self.voice_name = "uk-UA-Wavenet-A"  # Жіночий преміум голос

    def _get_headers(self):
        if not self.creds:
            raise Exception("No Credentials provided")

        if not self.creds.valid:
            self.creds.refresh(GoogleRequest())

        return {
            "Authorization": f"Bearer {self.creds.token}",
            "Content-Type": "application/json; charset=utf-8",
        }

    def text_to_speech(self, text: str, output_filename: str) -> str:
        """Перетворює текст у мовлення (MP3) через REST API."""
        logger.info(_("Synthesizing text to speech (REST)..."))

        url = "https://texttospeech.googleapis.com/v1/text:synthesize"
        data = {
            "input": {"text": text},
            "voice": {
                "languageCode": self.language_code,
                "name": self.voice_name,
                "ssmlGender": "FEMALE",
            },
            "audioConfig": {"audioEncoding": "MP3", "pitch": -1.2, "speakingRate": 0.95},
        }

        try:
            resp = requests.post(url, headers=self._get_headers(), json=data)
            if resp.status_code != 200:
                error_msg = f"TTS API Error: {resp.status_code} - {resp.text}"
                logger.error(error_msg)
                raise Exception(error_msg)

            response_json = resp.json()
            if "audioContent" not in response_json:
                raise Exception("No audioContent in response")

            audio_content = base64.b64decode(response_json["audioContent"])

            with open(output_filename, "wb") as out:
                out.write(audio_content)
                logger.info(_("Text synthesized and saved to file.") + f" [{output_filename}]")

            return output_filename
        except Exception as e:
            logger.exception(f"TTS Failed: {e}")
            raise

    def speech_to_text(self, audio_filename: str) -> str:
        """Розпізнає мовлення з аудіофайлу через REST API."""
        logger.info(_("Recognizing speech from audio file (REST)..."))

        try:
            with open(audio_filename, "rb") as audio_file:
                content = audio_file.read()
                content_b64 = base64.b64encode(content).decode("utf-8")
        except FileNotFoundError:
            logger.exception(f"Файл {audio_filename} не знайдено.")
            return ""

        url = "https://speech.googleapis.com/v1/speech:recognize"
        data = {
            "config": {
                "languageCode": self.language_code,
                "enableAutomaticPunctuation": True,
                "encoding": "MP3",
                "sampleRateHertz": 24000,
            },
            "audio": {"content": content_b64},
        }

        try:
            resp = requests.post(url, headers=self._get_headers(), json=data)
            if resp.status_code != 200:
                logger.error(f"STT API Error: {resp.status_code} - {resp.text}")
                return ""

            response_json = resp.json()
            results = response_json.get("results", [])

            transcript_list = []
            for result in results:
                if "alternatives" in result and len(result["alternatives"]) > 0:
                    transcript_list.append(result["alternatives"][0]["transcript"])

            full_text = " ".join(transcript_list)
            logger.info(_("Speech recognition completed."))
            return full_text

        except Exception as e:
            logger.exception(f"STT Failed: {e}")
            return ""
