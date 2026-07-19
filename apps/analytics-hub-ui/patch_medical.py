import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/osintData.ts'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Update interface
interface_replacement = """  compromat?: { summary: string; details: string; mediaUrl?: string; source: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' }[];
  medicalProfile?: { coprogram: string; wormEggsCount: number; lastCheckup: string; summary: string };
}"""
content = content.replace("  compromat?: { summary: string; details: string; mediaUrl?: string; source: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' }[];\n}", interface_replacement)

# 2. Update person-1
person_block_old = """    aiRecommendations: "Необхідно перевірити походження коштів для останніх придбань нерухомості. Встановити коло осіб, з якими об'єкт контактував під час візиту до Стамбула. Головний пріоритет: відстежити транзакції дружини в кіпрських банках.",
    lastActivityDate: "2026-05-15"
  },"""

person_block_new = """    medicalProfile: {
      coprogram: "Ознаки порушення травлення через систематичний стрес",
      wormEggsCount: 0,
      lastCheckup: "2026-03-10 (Клініка 'Борис')",
      summary: "Загальний стан задовільний. Яєць глистів не виявлено. Високий рівень кортизолу."
    },
    aiRecommendations: "Необхідно перевірити походження коштів для останніх придбань нерухомості. Встановити коло осіб, з якими об'єкт контактував під час візиту до Стамбула. Головний пріоритет: відстежити транзакції дружини в кіпрських банках.",
    lastActivityDate: "2026-05-15"
  },"""

content = content.replace(person_block_old, person_block_new)

with open(filepath, 'w') as f:
    f.write(content)
print("osintData.ts updated with medical profile")
