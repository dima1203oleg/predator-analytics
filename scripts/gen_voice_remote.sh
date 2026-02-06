export GOOGLE_APPLICATION_CREDENTIALS=/home/dima/predator-voice-build/keys/google-key.json
cd predator-voice-build
python3 -c "
import sys
from google.cloud import texttospeech

text = 'Командоре, чекаю ваших наказів. Готовий знищувати ворогів аналітикою.'

client = texttospeech.TextToSpeechClient()
synthesis_input = texttospeech.SynthesisInput(text=text)
voice = texttospeech.VoiceSelectionParams(language_code='uk-UA', name='uk-UA-Wavenet-A')
audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

response = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
with open('next_test.mp3', 'wb') as out:
    out.write(response.audio_content)
"
