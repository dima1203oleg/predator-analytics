import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/osintData.ts'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Extend OsintEntity interface
interface_replacement = """  lastActivityDate?: string; // YYYY-MM-DD
  // Розширений профіль фізичної особи (Person)
  familyTies?: { name: string; relation: string; status: string; risk: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  assets?: { type: string; description: string; estimatedValue: string; ownership: string }[];
  psychologicalPortrait?: { characteristics: string[]; vulnerabilities: string[]; summary: string };
  compromat?: { summary: string; details: string; mediaUrl?: string; source: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' }[];
}"""
content = content.replace("  lastActivityDate?: string; // YYYY-MM-DD\n}", interface_replacement)


# 2. Update person-1 mock data
person_block_old = """    relationships: [
      { targetId: 'comp-1', targetName: 'ТОВ "СпецТехПостач"', type: 'BENEFICIARY_OF', risk: 'HIGH' },
      { targetId: 'person-2', targetName: 'Смирнов Олексій', type: 'BUSINESS_PARTNER', risk: 'MEDIUM' }
    ],
    aiRecommendations: "Необхідно перевірити походження коштів для останніх придбань нерухомості. Встановити коло осіб, з якими об'єкт контактував під час візиту до Стамбула.",
    lastActivityDate: "2026-05-15"
  },"""

person_block_new = """    relationships: [
      { targetId: 'comp-1', targetName: 'ТОВ "СпецТехПостач"', type: 'BENEFICIARY_OF', risk: 'HIGH' },
      { targetId: 'person-2', targetName: 'Смирнов Олексій', type: 'BUSINESS_PARTNER', risk: 'MEDIUM' }
    ],
    familyTies: [
      { name: "Коваленко Олена Миколаївна", relation: "Дружина", status: "Власниця офшорних рахунків", risk: 'HIGH' },
      { name: "Коваленко Максим Ігорович", relation: "Син", status: "Студент (Лондон, UK), номінальний власник нерухомості", risk: 'MEDIUM' }
    ],
    assets: [
      { type: "Нерухомість", description: "Маєток в смт Козин, Київська обл. (1200 кв.м)", estimatedValue: "$3.5M", ownership: "Пряма власність" },
      { type: "Нерухомість", description: "Вілла в Марбельї (Іспанія)", estimatedValue: "€2.8M", ownership: "Оформлено на дружину" },
      { type: "Автотранспорт", description: "Mercedes-Benz G-Class (2025), Porsche 911 (2024)", estimatedValue: "$450K", ownership: "Лізинг через компанію" },
      { type: "Офшорні рахунки", description: "Рахунки в Bank of Cyprus (через Vanguard Holdings Ltd)", estimatedValue: "Невідомо (оцінка $10M+)", ownership: "Бенефіціар" }
    ],
    psychologicalPortrait: {
      characteristics: ["Схильність до ризику", "Авторитарний стиль управління", "Високий рівень адаптивності до кризових ситуацій"],
      vulnerabilities: ["Залежність від статусу та публічного іміджу", "Надмірна довіра до вузького кола родичів", "Слабке місце: активи сина за кордоном"],
      summary: "Об'єкт демонструє поведінку досвідченого оператора в 'сірих' зонах економіки. Швидко приймає рішення, але схильний до імпульсивних вчинків під час загрози репутації або особистій безпеці. Головний важіль тиску — заморожування закордонних активів родини."
    },
    compromat: [
      { 
        summary: "Зв'язки з російськими спецслужбами (ФСБ)", 
        details: "Зафіксовані регулярні зустрічі з агентами ФСБ на території Туреччини (Стамбул) та ОАЕ (Дубай) під прикриттям бізнес-переговорів. Мета: організація логістичних маршрутів для обходу санкцій.", 
        source: "Радіоперехоплення СБУ, агентурна розвідка", 
        severity: "CRITICAL" 
      },
      { 
        summary: "Підкуп посадових осіб на митниці", 
        details: "Існують аудіозаписи розмов з керівництвом Одеської митниці щодо безперешкодного пропуску вантажів подвійного призначення під виглядом побутової техніки.", 
        source: "НАБУ (матеріали НСРД)", 
        severity: "HIGH" 
      },
      { 
        summary: "Скрите фінансування медіа-кампаній з дезінформації", 
        details: "Через підставні криптогаманці оплачувалась робота мережі Telegram-каналів, які розповсюджували панічні настрої та дискредитували дії влади.", 
        source: "Аналіз блокчейн-транзакцій (Crystal Blockchain)", 
        severity: "HIGH" 
      }
    ],
    aiRecommendations: "Необхідно перевірити походження коштів для останніх придбань нерухомості. Встановити коло осіб, з якими об'єкт контактував під час візиту до Стамбула. Головний пріоритет: відстежити транзакції дружини в кіпрських банках.",
    lastActivityDate: "2026-05-15"
  },"""

content = content.replace(person_block_old, person_block_new)

with open(filepath, 'w') as f:
    f.write(content)

print("osintData.ts updated.")
