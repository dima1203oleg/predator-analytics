# 🧰 Каталог OSINT інструментів (GitHub)

Цей каталог містить добірку ключових OSINT-інструментів, які можуть бути інтегровані до PREDATOR Analytics як мікросервіси або скрипти для збагачення даних.

## 1. Багатоцільові OSINT-фреймворки (Frameworks)
| Назва | Опис | Посилання |
|-------|------|-----------|
| **SpiderFoot** | Автоматизований збір даних (100+ модулів). Ідеально для розвідки по IP, домену, email. | `github.com/smicallef/spiderfoot` |
| **Recon-ng** | Веб-фреймворк для розвідки. Модульна структура, подібна до Metasploit. | `github.com/lanmaster53/recon-ng` |
| **OSINT-Framework** | Веб-каталог інструментів. | `github.com/lockfale/OSINT-Framework` |
| **Maltego** | Графовий аналіз зв'язків. | `maltego.com` |

## 2. Аналіз соціальних мереж та людей (SOCMINT & People)
| Назва | Опис | Посилання |
|-------|------|-----------|
| **Sherlock** | Пошук юзернеймів у 300+ соціальних мережах. Швидкий і ефективний. | `github.com/sherlock-project/sherlock` |
| **Maigret** | Розширений аналог Sherlock. Збирає повний профіль користувача, включаючи досьє. | `github.com/soxoj/maigret` |
| **Twint / Nitter** | Збір даних з X (Twitter) без API-ключів. | `github.com/twintproject/twint` |
| **Instaloader** | Завантаження зображень і метаданих з Instagram. | `github.com/instaloader/instaloader` |
| **Social Analyzer** | API та CLI для аналізу 1000+ соцмереж і вебсайтів. | `github.com/qeeqbox/social-analyzer` |

## 3. Аналіз Email та Телефонних номерів
| Назва | Опис | Посилання |
|-------|------|-----------|
| **theHarvester** | Збір email, субдоменів, хостів, відкритих портів з пошукових систем. | `github.com/laramies/theHarvester` |
| **GHunt** | Детальний OSINT по Google-акаунтах (Email, YouTube, Maps). | `github.com/mxrch/GHunt` |
| **Holehe** | Перевіряє, де зареєстрований email (соцмережі, сервіси). | `github.com/megadose/holehe` |
| **Ignorant** | Перевіряє прив'язку номера телефону до соціальних мереж (Snapchat, Instagram). | `github.com/megadose/ignorant` |

## 4. Доменна, Мережева інфраструктура (DNS, IP)
| Назва | Опис | Посилання |
|-------|------|-----------|
| **Amass** | Глибокий пошук субдоменів та мережеве картографування. Дуже потужний. | `github.com/owasp-amass/amass` |
| **Subfinder** | Швидкий пошук субдоменів (passive sources). | `github.com/projectdiscovery/subfinder` |
| **Shodan / Censys API** | Пошукові системи для пристроїв, підключених до Інтернету (IoT, відкриті порти). | `shodan.io` |
| **Photon** | Блискавичний веб-краулер для збору URL, email, файлів, секретів. | `github.com/s0md3v/Photon` |

## 5. Метадані та Геолокація (Metadata, GEOINT)
| Назва | Опис | Посилання |
|-------|------|-----------|
| **ExifTool** | Стандарт де-факто для читання, запису і редагування метаданих (EXIF) у файлах/фото. | `exiftool.org` |
| **GeoSpy** | AI-інструмент для визначення геолокації по фотографії (за пікселями). | `geospy.ai` |
| **Creepy** | Збір геолокаційних даних з соцмереж і платформ обміну фото. | `github.com/ilektrojohn/creepy` |

## 6. Корпоративна та Фінансова розвідка (Corporate/FININT)
| Назва | Опис | Посилання |
|-------|------|-----------|
| **OpenCorporates** | Найбільша відкрита база даних компаній світу. (Є API). | `opencorporates.com` |
| **Bellingcat Investigation Tools** | Добірка інструментів та методологій для розслідувань. | `bellingcat.com` |

## 7. AI та LLM OSINT (Агенти)
| Назва | Опис | Посилання |
|-------|------|-----------|
| **CrewAI / LangChain** | Фреймворки для створення AI-агентів, які можуть виконувати пошук в інтернеті та аналіз. | `github.com/joaomdmoura/crewAI` |
| **AutoGPT** | Автономний AI-агент, здатний до пошуку та агрегації інформації. | `github.com/Significant-Gravitas/AutoGPT` |
