import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHeader } from '@/components/ViewHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';
import { Building2, DollarSign, FileCheck, Landmark, ShieldAlert, Scale, Sparkles } from 'lucide-react';

type SegmentKey = 'business' | 'banking' | 'government' | 'law' | 'regulators' | 'legal';

type SegmentCard = {
  key: SegmentKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  persona: 'BUSINESS' | 'BANKING' | 'GOVERNMENT' | 'INTELLIGENCE';
};

const SEGMENTS: SegmentCard[] = [
  {
    key: 'business',
    title: 'Бізнес та Корпорації',
    subtitle: 'Конкуренти, ланцюги постачання, можливості та прогнози.',
    icon: <Building2 className="w-5 h-5" />,
    persona: 'BUSINESS',
  },
  {
    key: 'banking',
    title: 'Банки та Фінанси',
    subtitle: 'AML/KYC, санкції, ризик-скоринг і фінансові розслідування.',
    icon: <DollarSign className="w-5 h-5" />,
    persona: 'BANKING',
  },
  {
    key: 'government',
    title: 'Державні Органи',
    subtitle: 'Моніторинг імпорту, макроаналітика та раннє попередження.',
    icon: <Landmark className="w-5 h-5" />,
    persona: 'GOVERNMENT',
  },
  {
    key: 'law',
    title: 'Правоохоронні Органи',
    subtitle: 'Справи, граф звʼязків, докази та часові лінії.',
    icon: <ShieldAlert className="w-5 h-5" />,
    persona: 'INTELLIGENCE',
  },
  {
    key: 'regulators',
    title: 'Регулятори та Контроль',
    subtitle: 'Нагляд, перевірки, комплаєнс-аудит та сигнали ризику.',
    icon: <FileCheck className="w-5 h-5" />,
    persona: 'GOVERNMENT',
  },
  {
    key: 'legal',
    title: 'Юридичні Компанії',
    subtitle: 'Доказова база, перевірка компаній, пошук активів.',
    icon: <Scale className="w-5 h-5" />,
    persona: 'BUSINESS',
  },
];

const ClientsHubView: React.FC = () => {
  const navigate = useNavigate();
  const { persona, setPersona } = useAppStore();
  const personaLabel =
    persona === 'BUSINESS' ? 'Бізнес' :
    persona === 'BANKING' ? 'Фінанси' :
    persona === 'GOVERNMENT' ? 'Держава' :
    persona === 'INTELLIGENCE' ? 'Розвідка' :
    persona === 'MEDIA' ? 'Медіа' :
    persona === 'SOVEREIGN' ? 'Суверенний' :
    persona === 'INQUISITOR' ? 'Інквізитор' :
    persona === 'TITAN' ? 'Титан' :
    'Змішаний';

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Клієнти — Режими Роботи"
        icon={<Sparkles className="w-6 h-6" />}
        breadcrumbs={['Клієнти', 'Огляд']}
        stats={[
          { label: 'Активний режим', value: personaLabel, color: 'secondary' },
        ]}
      />

      <div className="grid grid-cols-12 gap-4">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="col-span-12 md:col-span-6 xl:col-span-4">
            <Card className={cn('bg-slate-950/40 border-white/5 hover:border-white/10 transition-colors')}>
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-slate-200 font-black">
                  <span className="text-slate-400">{s.icon}</span>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </div>
                <CardDescription className="text-slate-300">{s.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate(`/clients/${s.key}`)}>
                  Відкрити
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPersona(s.persona);
                    navigate(`/clients/${s.key}`);
                  }}
                >
                  Активувати режим
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="glass-ultra rounded-xl border border-slate-800/60 p-5 text-sm text-slate-300">
        Режим впливає на акценти інтерфейсу та підказки. Доступ до AZR/«Фабрики» — лише для ролі <span className="font-black text-slate-100">адміністратор</span>.
      </div>
    </div>
  );
};

export default ClientsHubView;
