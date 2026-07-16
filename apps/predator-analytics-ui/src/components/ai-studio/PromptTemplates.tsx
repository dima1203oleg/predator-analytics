import React from 'react';
import { Shield, Users, Package, Search } from 'lucide-react';

export interface PromptTemplate {
  id: string;
  title: string;
  desc: string;
  prompt: string;
  icon: React.ReactNode;
}

export const defaultTemplates: PromptTemplate[] = [
  {
    id: 'risk_analysis',
    title: 'Аналіз митних ризиків',
    desc: 'Перевірити декларацію на наявність типових схем мінімізації митних платежів.',
    prompt: 'Проаналізуй митну декларацію на предмет ризиків заниження митної вартості, неправильної класифікації (підміни коду УКТЗЕД) та використання компаній-оболонок. Зверни увагу на країну походження та торговельну марку.',
    icon: <Shield size={20} className="text-rose-500" />
  },
  {
    id: 'counterparty_check',
    title: 'Перевірка контрагента (OSINT)',
    desc: 'Зібрати відкриті дані про компанію-імпортера або директора.',
    prompt: 'Зроби OSINT-дослідження компанії [ЄДРПОУ/Назва]. Перевір наявність судових рішень, податкового боргу, зв\'язків з санкційними особами та ознак фіктивності (масовий директор, відсутність активів).',
    icon: <Users size={20} className="text-blue-500" />
  },
  {
    id: 'hs_code_classification',
    title: 'Класифікація УКТЗЕД',
    desc: 'Допомога у визначенні правильного коду товару за описом.',
    prompt: 'Визнач найбільш вірогідний код УКТЗЕД для наступного товару: [Детальний опис товару, матеріал, призначення]. Наведи аргументацію згідно з Основними правилами інтерпретації УКТЗЕД та примітками до груп.',
    icon: <Package size={20} className="text-emerald-500" />
  },
  {
    id: 'anomaly_detection',
    title: 'Пошук аномалій у цінах',
    desc: 'Порівняти ціни з індикативними базами.',
    prompt: 'Знайди середню митну вартість за кілограм для товару з кодом УКТЗЕД [Код] з країни [Країна] за останні 3 місяці. Визнач, чи є заявлена ціна [Ціна] $/кг аномально низькою.',
    icon: <Search size={20} className="text-purple-500" />
  }
];

interface PromptTemplatesProps {
  onSelect: (prompt: string) => void;
}

export const PromptTemplates: React.FC<PromptTemplatesProps> = ({ onSelect }) => {
  return (
    <div className="ai-templates-grid">
      {defaultTemplates.map(template => (
        <button
          key={template.id}
          className="ai-template-card"
          onClick={() => onSelect(template.prompt)}
        >
          <div className="ai-template-icon">{template.icon}</div>
          <div className="ai-template-title">{template.title}</div>
          <div className="ai-template-desc">{template.desc}</div>
        </button>
      ))}
    </div>
  );
};
