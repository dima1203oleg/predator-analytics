export GOOGLE_APPLICATION_CREDENTIALS=/home/dima/predator-voice-build/keys/google-key.json
cd predator-voice-build
python3 -c "
import sys
from google.cloud import texttospeech

text = 'Система готова до роботи. Цілі визначено. Починаю аналіз даних.'

client = texttospeech.TextToSpeechClient()

configs = [
    # Польські чоловічі (схожа фонетика)
    {'name': 'PL_Wavenet_B_Male', 'voice': 'pl-PL-Wavenet-B', 'lang': 'pl-PL'},
    {'name': 'PL_Wavenet_C_Male', 'voice': 'pl-PL-Wavenet-C', 'lang': 'pl-PL'},

    # Чеський чоловічий
    {'name': 'CS_Wavenet_A_Male', 'voice': 'cs-CZ-Wavenet-A', 'lang': 'cs-CZ'},

    # Якщо раптом з'явився український чоловічий (перевірка на удачу, іноді з'являється)
    #{'name': 'UK_Secret_Male', 'voice': 'uk-UA-Neural2-D', 'lang': 'uk-UA'},
]

for conf in configs:
    try:
        print(f'Testing {conf[\"name\"]}...')
        input_text = texttospeech.SynthesisInput(text=text)

        voice = texttospeech.VoiceSelectionParams(
            language_code=conf['lang'],
            name=conf['voice']
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        response = client.synthesize_speech(input=input_text, voice=voice, audio_config=audio_config)

        filename = f'trick_{conf[\"name\"]}.mp3'
        with open(filename, 'wb') as out:
            out.write(response.audio_content)
        print(f'Saved {filename}')
    except Exception as e:
        print(f'Failed {conf[\"name\"]}: {e}')
"
