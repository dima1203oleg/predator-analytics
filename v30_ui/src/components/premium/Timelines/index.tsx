import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export const Timelines: React.FC = () => {
  const events = [
    { time: '10:45', date: 'Сьогодні', title: 'Реєстрація митної декларації', location: 'Київ', status: 'completed' },
    { time: '09:30', date: 'Сьогодні', title: 'Надходження вантажу на термінал', location: 'Одеса', status: 'completed' },
    { time: '18:00', date: 'Вчора', title: 'Оформлення страхового полісу', location: 'Лондон', status: 'completed' },
    { time: '14:20', date: 'Вчора', title: 'Підписання контракту', location: 'Варшава', status: 'completed' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white mb-8">Хронологія Подій</h1>

      <div className="relative border-l-2 border-slate-800 ml-4 space-y-12">
        {events.map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative pl-8"
          >
            {/* Dot */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-slate-900 shadow-glow-blue" />

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <h3 className="text-lg font-bold text-white">{event.title}</h3>
                  <span className="text-emerald-400 text-xs font-bold uppercase px-2 py-1 bg-emerald-500/10 rounded">
                    {event.status}
                  </span>
               </div>

               <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {event.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {event.time}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
