import os

from google.cloud import speech, texttospeech


class AudioManager:
    """Клас для управління аудіо-операціями за допомогою Google Cloud Services.
    Включає Text-to-Speech (TTS) та Speech-to-Text (STT).
    """

    def __init__(self):
        """Ініціалізація клієнтів Google Cloud.
        Передбачає, що змінна оточення GOOGLE_APPLICATION_CREDENTIALS вже встановлена.
        """
        # Перевірка наявності ключів (не обов'язкова, бібліотека сама перевірить, але корисно для логування)
        if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            print("УВАГА: Змінна оточення GOOGLE_APPLICATION_CREDENTIALS не знайдена.")

        # Клієнти ініціалізуються ліниво або тут. Краще тут для перевірки з'єднання при старті.
        self.tts_client = texttospeech.TextToSpeechClient()
        self.stt_client = speech.SpeechClient()

    def text_to_speech(self, text: str, output_filename: str = "output.mp3"):
        """Перетворює текст на мовлення та зберігає у файл MP3.

        :param text: Текст для озвучення.
        :param output_filename: Шлях до файлу для збереження результату.
        """
        # Налаштування вхідних даних
        synthesis_input = texttospeech.SynthesisInput(text=text)

        # Налаштування голосу (Українська мова, WaveNet)
        voice = texttospeech.VoiceSelectionParams(
            language_code="uk-UA",
            name="uk-UA-Wavenet-A",  # Можна змінити на інший варіант, наприклад, 'uk-UA-Standard-A'
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
        )

        # Налаштування аудіофайлу (MP3)
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

        # Виконання запиту
        response = self.tts_client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)

        # Збереження у файл
        with open(output_filename, "wb") as out:
            out.write(response.audio_content)
            print(f"Аудіо контент записано у файл '{output_filename}'")

    def speech_to_text(self, audio_filename: str) -> str:
        """Транскрибує аудіофайл у текст.

        :param audio_filename: Шлях до аудіофайлу (MP3, WAV, тощо).
        :return: Розпізнаний текст.
        """
        with open(audio_filename, "rb") as audio_file:
            content = audio_file.read()

        audio = speech.RecognitionAudio(content=content)

        # Конфігурація розпізнавання
        # Примітка: Для MP3 може знадобитися вказівка encoding=speech.RecognitionConfig.AudioEncoding.MP3
        # Google Speech-to-Text v1 підтримує MP3 в Beta або в v2.
        # Якщо файл MP3, краще використовувати generic config або v2.
        # Тут використовуємо базове налаштування, яке спробує автоматично визначити або вимагатиме WAV.
        # Для демо ми генеруємо MP3, тому треба переконатися, що STT його їсть.
        # MP3 support is available in v1beta1 or v1 with specific config.
        # Let's try to infer or specify MP3 if the filename hints it.

        encoding = speech.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED
        if audio_filename.lower().endswith(".mp3"):
            encoding = speech.RecognitionConfig.AudioEncoding.MP3

        config = speech.RecognitionConfig(
            encoding=encoding,
            sample_rate_hertz=24000,  # WaveNet default is often 24k, but context usually matches file.
            # Якщо sample_rate_hertz не вказано, сервер спробує визначити з заголовку файлу (для WAV/FLAC/MP3).
            language_code="uk-UA",
        )

        # Виявлення мовлення
        response = self.stt_client.recognize(config=config, audio=audio)

        # Формування результату
        transcript_builder = []
        for result in response.results:
            transcript_builder.append(result.alternatives[0].transcript)

        return " ".join(transcript_builder)
