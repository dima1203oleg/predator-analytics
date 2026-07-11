export GOOGLE_APPLICATION_CREDENTIALS=/home/dima/predator-voice-build/keys/google-key.json
cd predator-voice-build
python3 -c "
import sys
from google.cloud import texttospeech

text = 'This is a test. Це перевірка української мови на американському голосі.'

client = texttospeech.TextToSpeechClient()

# Спробуємо 3 крутих американських чоловічих голоси
configs = [
    {'name': 'US_Journey_D', 'voice': 'en-US-Journey-D', 'gender': texttospeech.SsmlVoiceGender.MALE},
    {'name': 'US_Neural2_D', 'voice': 'en-US-Neural2-D', 'gender': texttospeech.SsmlVoiceGender.MALE},
    {'name': 'US_Studio_M', 'voice': 'en-US-Studio-M', 'gender': texttospeech.SsmlVoiceGender.MALE},
    {'name': 'Polyglot_Create',  'voice': 'en-US-Polyglot-1', 'gender': texttospeech.SsmlVoiceGender.MALE} # Якщо існує
]

for conf in configs:
    try:
        print(f'Trying {conf[\"name\"]}...')
        input_text = texttospeech.SynthesisInput(text=text)

        voice = texttospeech.VoiceSelectionParams(
            language_code='en-US', # Хак: кажемо що це англійська, але даємо укр текст
            name=conf['voice']
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        response = client.synthesize_speech(input=input_text, voice=voice, audio_config=audio_config)

        filename = f'hack_{conf[\"name\"]}.mp3'
        with open(filename, 'wb') as out:
            out.write(response.audio_content)
        print(f'Saved {filename}')
    except Exception as e:
        print(f'Failed {conf[\"name\"]}: {e}')
"
