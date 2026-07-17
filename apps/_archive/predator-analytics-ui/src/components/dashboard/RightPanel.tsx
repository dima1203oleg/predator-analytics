/**
 * 🎯 Tactical Hub Component
 * 
 * Права панель з тактичними графіками, матрицею загроз та картою
 * згідно з технічною специфікацією PREDATOR
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Radar, Shield, MapPin, AlertTriangle, Activity } from 'lucide-react';
import { useCyberDashboardStore } from '../../store/cyber-dashboard-store';
import { RiskDistributionChart } from '../analytics/RiskDistributionChart';
import { AnomalyTimelineChart } from '../analytics/AnomalyTimelineChart';

// Mock дані для графіків
const LIVE_INTERCEPTOR_DATA = [
  { name: 'ПН', value: 65 },
  { name: 'ВТ', value: 45 },
  { name: 'СР', value: 78 },
  { name: 'ЧТ', value: 52 },
  { name: 'ПТ', value: 38 },
  { name: 'СБ', value: 91 },
  { name: 'НД', value: 67 },
];

const THREAT_MATRIX = [
  { id: 1, level: 1, color: '#00FF41' }, // green
  { id: 2, level: 2, color: '#00F0FF' }, // cyan
  { id: 3, level: 1, color: '#00FF41' },
  { id: 4, level: 3, color: '#FFB800' }, // gold
  { id: 5, level: 2, color: '#00F0FF' },
  { id: 6, level: 1, color: '#00FF41' },
  { id: 7, level: 4, color: '#FF8800' }, // orange
  { id: 8, level: 2, color: '#00F0FF' },
  { id: 9, level: 1, color: '#00FF41' },
];

export default function RightPanel() {
  const { isPanelCollapsed, threatLevel } = useCyberDashboardStore();
  const [liveData, setLiveData] = useState<any[]>([]);
  const [intelData, setIntelData] = useState<any[]>([]);
  const [topRisks, setTopRisks] = useState<any[]>([]);
  
  // Завантаження реальних даних
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/v1/dashboard/overview', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON but received: ${contentType}`);
        }
        const data = await res.json();
        if (data.alerts && data.alerts.length > 0) {
          setIntelData(data.alerts.slice(0, 4).map((a: any, i: number) => ({
            id: a.id,
            location: a.company || 'Невідомо',
            level: a.severity === 'critical' ? 'ВИСОКА' : a.severity === 'warning' ? 'СЕРЕДНЯ' : 'НИЗЬКА',
            time: new Date(a.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
          })));
        }
        if (data.top_risk_companies) {
          setTopRisks(data.top_risk_companies);
        }
      } catch (err) {
        console.error('Помилка завантаження даних дашборду', err);
      }
    };
    fetchData();
  }, []);
  
  // TODO: Implement WebSocket or polling to fetch live system metrics
  useEffect(() => {
    // Empty for now, waiting for real API to provide live active metric data
  }, []);
  
  if (isPanelCollapsed.right) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-80 bg-cyber-surface/70 backdrop-blur-md border-l border-cyber-border flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-cyber-border">
        <h2 className="text-cyber-gold font-cyber text-lg font-bold tracking-wider flex items-center gap-2">
          <Radar className="w-5 h-5 animate-pulse-slow" />
          ТАКТИЧНИЙ ХАБ МІСІЙ
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-xs text-cyber-neon/50 font-mono">
            ЖИВИЙ ПЕРЕХОПЛЮВАЧ
          </div>
          <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
        </div>
      </div>
      
      {/* Live Chart */}
      <div className="p-4 border-b border-cyber-border">
        <h3 className="text-cyber-neon/70 text-xs font-cyber tracking-wider mb-3">
          АКТИВНІСТЬ СИСТЕМИ
        </h3>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={liveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2A3A" />
              <XAxis 
                dataKey="name" 
                stroke="#00F0FF" 
                tick={{ fill: '#00F0FF', fontSize: 10 }}
                axisLine={{ stroke: '#1A2A3A' }}
                tickLine={{ stroke: '#1A2A3A' }}
              />
              <YAxis 
                stroke="#00F0FF" 
                tick={{ fill: '#00F0FF', fontSize: 10 }}
                axisLine={{ stroke: '#1A2A3A' }}
                tickLine={{ stroke: '#1A2A3A' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0E121B',
                  border: '1px solid #1A2A3A',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: '#00F0FF' }}
              />
              <Bar 
                dataKey="value" 
                fill="#00F0FF" 
                opacity={0.8}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Threat Matrix */}
      <div className="p-4 border-b border-cyber-border">
        <h3 className="text-cyber-neon/70 text-xs font-cyber tracking-wider mb-3">
          МАТРИЦЯ ЗАГРОЗ
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {THREAT_MATRIX.map((cell) => (
            <motion.div
              key={cell.id}
              whileHover={{ scale: 1.05 }}
              className="aspect-square rounded"
              style={{ 
                backgroundColor: `${cell.color}20`,
                border: `1px solid ${cell.color}`,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-400">Рівень загрози:</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < threatLevel ? 'bg-cyber-neon animate-pulse' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Intel List */}
      <div className="p-4 border-b border-cyber-border">
        <h3 className="text-cyber-neon/70 text-xs font-cyber tracking-wider mb-3">
          РОЗВІДКА
        </h3>
        <div className="space-y-2">
          {intelData.map((intel) => (
            <motion.div
              key={intel.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-2 bg-cyber-bg/30 border border-cyber-border/30 rounded"
            >
              <MapPin className="w-3 h-3 text-cyber-neon" />
              <div className="flex-1">
                <div className="text-xs text-gray-300 truncate w-32" title={intel.location}>{intel.location}</div>
                <div className="text-xs text-cyber-neon/50 font-mono">{intel.time}</div>
              </div>
              <div className={`text-xs font-mono ${
                intel.level === 'ВИСОКА' ? 'text-cyber-red' :
                intel.level === 'СЕРЕДНЯ' ? 'text-cyber-gold' :
                'text-cyber-green'
              }`}>
                {intel.level}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Advanced Analytics Widgets */}
      <div className="p-4 border-b border-cyber-border overflow-y-auto custom-scrollbar">
         <RiskDistributionChart />
         <AnomalyTimelineChart />
      </div>

      {/* Stylized Map */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-cyber-neon/70 text-xs font-cyber tracking-wider mb-3">
          ГЕОЛОКАЦІЯ ЦІЛЕЙ
        </h3>
        <div className="flex-1 bg-cyber-bg/30 border border-cyber-border/30 rounded-lg relative overflow-hidden">
          {/* Mock Map Grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(#1A2A3A 1px, transparent 1px),
              linear-gradient(90deg, #1A2A3A 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }} />
          
          {/* Scanning Ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyber-neon/30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
          
          <motion.div
            className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyber-green/50"
            animate={{
              scale: [0.5, 1.2, 0.5],
              opacity: [0.8, 0.3, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
            }}
          />
          
          {/* Location Pins */}
          {intelData.map((intel, index) => (
            <motion.div
              key={`pin-${intel.id}-${index}`}
              className="absolute"
              style={{
                top: `${20 + (index * 20) % 60}%`,
                left: `${30 + (index * 25) % 50}%`,
              }}
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2,
                delay: index * 0.2,
                repeat: Infinity,
              }}
            >
              <MapPin className={`w-4 h-4 ${
                intel.level === 'ВИСОКА' ? 'text-cyber-red' :
                intel.level === 'СЕРЕДНЯ' ? 'text-cyber-gold' :
                'text-cyber-green'
              }`} />
            </motion.div>
          ))}
          
          {/* Status */}
          <div className="absolute bottom-2 left-2 text-xs text-cyber-neon/50 font-mono">
            СКАНУВАННЯ: АКТИВНЕ
          </div>
        </div>
      </div>
    </motion.div>
  );
}
