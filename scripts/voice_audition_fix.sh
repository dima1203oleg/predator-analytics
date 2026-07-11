export GOOGLE_APPLICATION_CREDENTIALS=/home/dima/predator-voice-build/keys/google-key.json
cd predator-voice-build
python3 -c "
import sys
from google.cloud import texttospeech

# Перевірка доступних голосів (щоб точно знати)
# client_v = texttospeech.TextToSpeechClient()
# voices = client_v.list_voices(language_code='uk-UA')
# print([v.name for v in voices.voices])
# (За пропускаю це для швидкості, беремо найпопулярніший чоловічий)

text = 'Система Предатор. Аналіз загроз завершено. Ціль підтверджено.'

client = texttospeech.TextToSpeechClient()

configs = [
    {
        'name': 'MALE_Standard',
        # Спробуємо Neural2-D (новий якісний) або Standard-A
        # Зазвичай uk-UA має Standard-A (Ж), Neural2-A (Ж).
        # Якщо немає чоловічого WaveNet, ми створимо його з жіночого сильним пітчем,
        # АБО використаємо Multi-speaker модель, якщо вона доступна (зараз це рідкість для uk-UA).

        # FIX: Українська має мало голосів. Neural2-A (female).
        # Спробуємо зробити 'чоловічий' з жіночого шляхом сильного pitch shift (-6.0 ST).
        'voice_name': 'uk-UA-Wavenet-A',
        'pitch': -8.0,
        'rate': 0.85,
        'gender': texttospeech.SsmlVoiceGender.FEMALE
    },
    {
        'name': 'MALE_DeepMatches',
        'voice_name': 'uk-UA-Wavenet-A',
        'pitch': -12.0,
        'rate': 0.9,
        'gender': texttospeech.SsmlVoiceGender.FEMALE
    }
]

for conf in configs:
    print(f'Generating {conf[\"name\"]}...')
    input_text = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code='uk-UA',
        name=conf['voice_name']
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
