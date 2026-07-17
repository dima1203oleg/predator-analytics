#!/bin/bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui/public

# 1. Sub-bass background
ffmpeg -y \
-f lavfi -i "anoisesrc=c=brown:a=0.9:d=10" \
-f lavfi -i "sine=f=22:d=10" \
-f lavfi -i "sine=f=33:d=10" \
-f lavfi -i "sine=f=44:d=10" \
-filter_complex "[0:a]lowpass=f=70[noise]; \
[1:a][2:a][3:a]amix=inputs=3:weights=1.0 0.8 0.5[sines]; \
[noise][sines]amix=inputs=2:weights=0.4 1.0[m]; \
[m]tremolo=f=8:d=0.9[f]; \
[f]tremolo=f=0.5:d=0.8[p]; \
[p]volume=3.0[ob]" \
-map "[ob]" -t 10 -ar 48000 bass.wav

# 2. Короткий вибух (0.8с)
ffmpeg -y \
-f lavfi -i "anoisesrc=c=brown:a=1.0:d=0.8" \
-f lavfi -i "sine=f=35:d=0.8" \
-filter_complex "[0:a]lowpass=f=300,volume=4.0[n]; \
[1:a]volume=2.0[s]; \
[n][s]amix=inputs=2:weights=3.0 1.0[boom]" \
-map "[boom]" -t 0.8 -ar 48000 boom_raw.wav

# 3. Додаємо 7с тиші перед вибухом
ffmpeg -y \
-f lavfi -i "aevalsrc=0:d=7.0:s=48000:c=mono" \
-i boom_raw.wav \
-filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[out]" \
-map "[out]" -t 10 -ar 48000 explosion.wav

# 4. Deep voice — чистий, розбірливий
ffmpeg -y \
-i "/Users/dima1203/Downloads/Відкоректуй_перше_відео_постав.mp4" \
-i bass.wav \
-i explosion.wav \
-filter_complex "\
[0:a]asetrate=48000*0.68,aresample=48000,atempo=1.47,\
highpass=f=80,\
equalizer=f=100:width_type=h:width=50:g=8,\
equalizer=f=300:width_type=h:width=100:g=-5,\
equalizer=f=700:width_type=h:width=200:g=5,\
equalizer=f=2500:width_type=h:width=1500:g=10,\
equalizer=f=5000:width_type=h:width=2000:g=7,\
acompressor=threshold=-22dB:ratio=4:attack=5:release=100:makeup=9,\
volume=2.8[v]; \
[1:a]volume=0.8[b]; \
[2:a]volume=2.5[boom]; \
[v][b][boom]amix=inputs=3:duration=first:weights=1.0 0.8 1.0[out]" \
-map 0:v -map "[out]" -c:v copy -c:a aac -b:a 192k -ar 48000 intro.mp4

