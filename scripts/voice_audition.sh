export GOOGLE_APPLICATION_CREDENTIALS=/home/dima/predator-voice-build/keys/google-key.json
cd predator-voice-build
python3 -c "
import sys
from google.cloud import texttospeech

text = 'Система Предатор ідентифікувала загрозу. Протокол ліквідації активовано.'

client = texttospeech.TextToSpeechClient()

configs = [
    {
        'name': 'COMMANDER_Dark',
        'voice_name': 'uk-UA-Wavenet-D',
        'pitch': -6.0,
        'rate': 0.85,
        'gender': texttospeech.SsmlVoiceGender.MALE
    },
    {
        'name': 'AI_Neural',
        'voice_name': 'uk-UA-Wavenet-A',
        'pitch': -2.0,
        'rate': 1.1,
        'gender': texttospeech.SsmlVoiceGender.FEMALE
    },
    {
        'name': 'OPERATOR_Tactical',
        'voice_name': 'uk-UA-Wavenet-B',
        'pitch': -3.0,
        'rate': 1.0,
        'gender': texttospeech.SsmlVoiceGender.MALE
    }
]

for conf in configs:
    print(f'Generating {conf[\"name\"]}...')
    input_text = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code='uk-UA',
        name=conf['voice_name'],
        ssml_gender=conf['gender']
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        pitch=conf['pitch'],
        speaking_rate=conf['rate']
    )

    response = client.synthesize_speech(input=input_text, voice=voice, audio_config=audio_config)

    filename = f'voice_{conf[\"name\"]}.mp3'
    with open(filename, 'wb') as out:
        out.write(response.audio_content)
    print(f'Saved {filename}')
"
