'use client';

import { useState, Suspense } from 'react';
import { usePredatorSounds } from '../hooks/usePredatorSounds';
import { Canvas } from '@react-three/fiber';
import { Environment, Float, PerspectiveCamera } from '@react-three/drei';
import { BioMaskModel } from './models/BioMaskModel';

export type UserRole = 'viewer' | 'operator' | 'analyst' | 'admin';

interface AccessLevelSelectorProps {
  onSelect: (role: UserRole) => void;
}

interface RoleCard {
  id: UserRole;
  title: string;
  description: string;
  permissions: string[];
  colorClass: string;
  glowClass: string;
  borderClass: string;
  icon: string;
}

export function AccessLevelSelector({ onSelect }: AccessLevelSelectorProps) {
  const { playClick, playAccessGranted } = usePredatorSounds();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const roles: RoleCard[] = [
    {
      id: 'viewer',
      title: 'СПОСТЕРІГАЧ',
      description: 'Доступ виключно до перегляду базових метрик та аналітичних логів.',
      permissions: ['Читати метадані', 'Дивитися графіки', 'Без права змін'],
      colorClass: 'text-cyan-400',
      glowClass: 'shadow-cyan-950/50 hover:shadow-cyan-500/30',
      borderClass: 'border-cyan-500/30 hover:border-cyan-400',
      icon: '👁️',
    },
    {
      id: 'operator',
      title: 'ОПЕРАТОР',
      description: 'Управління потоками даних, завантаження нових OSINT реєстрів та запуск інгестії.',
      permissions: ['Імпортувати CSV/JSON', 'Контроль Kafka топіків', 'Очищення даних'],
      colorClass: 'text-emerald-400',
      glowClass: 'shadow-emerald-950/50 hover:shadow-emerald-500/30',
      borderClass: 'border-emerald-500/30 hover:border-emerald-400',
      icon: '⚙️',
    },
    {
      id: 'admin',
      title: 'АДМІНІСТРАТОР (ELITE)',
      description: 'Повний контроль над усією інфраструктурою PREDATOR, базами даних та ШІ агентами.',
      permissions: ['Керування користувачами', 'Внесення змін у WORM', 'Перезапуск Risk Engine', 'ШІ Copilot'],
      colorClass: 'text-red-500',
      glowClass: 'shadow-red-950/50 hover:shadow-red-500/30',
      borderClass: 'border-red-500/30 hover:border-red-500',
      icon: '💀',
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    playAccessGranted();
    setTimeout(() => {
      onSelect(role);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center p-6 font-mono select-none overflow-y-auto">
      {/* Декоративні елементи на фоні */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,0,0,0.3)_0%,rgba(0,0,0,1)_80%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-red-950/10 to-transparent pointer-events-none border-b border-red-500/5" />

      {/* Заголовок */}
      <div className="relative z-10 text-center mb-12 max-w-xl">
        <div className="text-red-500 text-xs tracking-[0.3em] uppercase mb-2">ПОТРІБНА АУТЕНТИФІКАЦІЯ РОЛІ</div>
        <h2 className="text-red-600 font-bold text-3xl tracking-[0.2em] mb-4">РІВЕНЬ ДОСТУПУ ДО СИСТЕМИ</h2>
        <p className="text-red-500/60 text-xs tracking-wider">
          Оберіть ваш профіль безпеки для активації відповідних нейронних інтерфейсів.
        </p>
      </div>

      {/* Сітка з 3 картками */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
        {roles.map((role) => (
          <div
            key={role.id}
            onMouseEnter={playClick}
            onClick={() => handleRoleSelect(role.id)}
            className={`bg-neutral-950/80 border ${role.borderClass} ${role.glowClass} p-6 rounded-lg transition-all duration-300 cursor-pointer flex flex-col justify-between h-96 group hover:-translate-y-2 hover:bg-neutral-900/60 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md`}
          >
            <div>
              {/* 3D Маска та Заголовок */}
              <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-3">
                <div className={`h-32 w-32 group-hover:scale-110 transition-transform duration-300 relative -ml-4 -mt-4`}>
                  <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                    <ambientLight intensity={2} />
                    <directionalLight position={[10, 10, 10]} intensity={4} />
                    <pointLight position={[-5, 5, 5]} intensity={2} color={role.id === 'admin' ? '#ff0000' : '#00ffff'} />
                    <Environment preset="city" />
                    <Suspense fallback={null}>
                      <Float speed={3} rotationIntensity={0.8} floatIntensity={0.5}>
                        <BioMaskModel 
                          scale={3.5} 
                          position={[0, -0.5, 0]} 
                          rotation={[0, role.id === 'viewer' ? Math.PI/6 : role.id === 'admin' ? -Math.PI/6 : 0, 0]} 
                          laserActive={role.id === 'admin'} 
                        />
                      </Float>
                    </Suspense>
                  </Canvas>
                </div>
                <span className="text-[9px] text-neutral-500 tracking-wider">
                  PREDATOR ID: 0{roles.indexOf(role) + 1}
                </span>
              </div>
              
              <h3 className={`text-lg font-bold tracking-widest ${role.colorClass} mb-3`}>
                {role.title}
              </h3>
              
              <p className="text-neutral-400 text-xs leading-relaxed mb-4">
                {role.description}
              </p>
            </div>

            {/* Дозволи */}
            <div className="border-t border-neutral-900 pt-4">
              <div className="text-[10px] text-neutral-500 mb-2 tracking-wider">ДОЗВОЛИ:</div>
              <ul className="space-y-1">
                {role.permissions.map((perm, idx) => (
                  <li key={idx} className="text-[10px] text-neutral-300 flex items-center space-x-1.5">
                    <span className={`text-[8px] ${role.colorClass}`}>▶</span>
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Інформація про VRAM Guard */}
      <div className="relative z-10 mt-12 text-center text-[10px] text-red-500/40">
        <p>БІОМЕТРИЧНУ СЕСІЮ АКТИВОВАНО · ОЧІКУВАННЯ ВИБОРУ РІВНЯ ДОСТУПУ</p>
        <p className="mt-1">NVIDIA OVERRIDE PORT: 3030</p>
      </div>
    </div>
  );
}
