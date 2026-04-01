/**
 * 🌍 SupplierDiscoveryPremium V2 — Пошук поставщиків з AI
 * Інтерактивна таблиця з фільтруванням, сортуванням та скорингом надійності
 * ТЗ 11.3 | Python 3.12 | 100% Українська
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Globe,
  TrendingUp,
  Shield,
  Package,
  DollarSign,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ============ ТИПИ ============

interface Supplier {
  id: string;
  name: string;
  country: string;
  sector: string;
  yearFounded: number;
  averagePrice: number;
  priceVariance: number;
  reliabilityScore: number; // 0-100
  deliveryTimeAvg: number; // дні
  orderCount: number;
  minOrder: number;
  maxOrder: number;
  leadTime: number; // дні
  certifications: string[];
  riskLevel: 'низький' | 'середній' | 'високий';
  lastUpdate: string;
}

// ============ MOCK-ДАНІ ============

const SUPPLIERS: Supplier[] = [
  {
    id: '1',
    name: 'Guangzhou PowerTech Ltd',
    country: 'Китай',
    sector: 'Електрогенератори',
    yearFounded: 2008,
    averagePrice: 850,
    priceVariance: 3.2,
    reliabilityScore: 94,
    deliveryTimeAvg: 28,
    orderCount: 1247,
    minOrder: 10,
    maxOrder: 5000,
    leadTime: 21,
    certifications: ['ISO 9001', 'CE', 'RoHS'],
    riskLevel: 'низький',
    lastUpdate: '1 годину тому',
  },
  {
    id: '2',
    name: 'Shanghai Electric Co',
    country: 'Китай',
    sector: 'Електрогенератори',
    yearFounded: 1995,
    averagePrice: 880,
    priceVariance: 4.1,
    reliabilityScore: 88,
    deliveryTimeAvg: 32,
    orderCount: 893,
    minOrder: 25,
    maxOrder: 10000,
    leadTime: 28,
    certifications: ['ISO 9001', 'ISO 14001'],
    riskLevel: 'низький',
    lastUpdate: '3 години тому',
  },
  {
    id: '3',
    name: 'Taiwan Precision Motors',
    country: 'Тайвань',
    sector: 'Електромотори',
    yearFounded: 2001,
    averagePrice: 1200,
    priceVariance: 2.8,
    reliabilityScore: 92,
    deliveryTimeAvg: 35,
    orderCount: 567,
    minOrder: 50,
    maxOrder: 3000,
    leadTime: 30,
    certifications: ['ISO 9001', 'ISO 14001', 'UL'],
    riskLevel: 'низький',
    lastUpdate: '2 години тому',
  },
  {
    id: '4',
    name: 'Industrial Motors Europe',
    country: 'Німеччина',
    sector: 'Електромотори',
    yearFounded: 1987,
    averagePrice: 1850,
    priceVariance: 1.5,
    reliabilityScore: 96,
    deliveryTimeAvg: 14,
    orderCount: 2341,
    minOrder: 100,
    maxOrder: 50000,
    leadTime: 7,
    certifications: ['ISO 9001', 'ISO 14001', 'ISO 45001', 'DIN EN'],
    riskLevel: 'низький',
    lastUpdate: 'Щойно',
  },
];

// ============ КОМПОНЕНТ ============

export const SupplierDiscoveryPremiumV2: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'reliability' | 'price' | 'deliveryTime'>('reliability');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  const filteredSuppliers = useMemo(() => {
    let filtered = SUPPLIERS.filter(
      s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.sector.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Сортування
    filtered.sort((a, b) => {
      let aVal = 0, bVal = 0;
      switch (sortBy) {
        case 'reliability':
          aVal = a.reliabilityScore;
          bVal = b.reliabilityScore;
          break;
        case 'price':
          aVal = a.averagePrice;
          bVal = b.averagePrice;
          break;
        case 'deliveryTime':
          aVal = a.deliveryTimeAvg;
          bVal = b.deliveryTimeAvg;
          break;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [searchTerm, sortBy, sortOrder]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div
        className="max-w-7xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ===== ЗАГОЛОВОК ===== */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            🌍 Пошук поставщиків
          </h1>
          <p className="text-slate-400">
            AI-аналіз {SUPPLIERS.length} поставщиків з залучення надійності, цін та часу доставки
          </p>
        </motion.div>

        {/* ===== ПАНЕЛЬ КОНТРОЛЮ ===== */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Пошук за назвою, країною або сектором..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Фільтри
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Експорт
          </Button>
        </motion.div>

        {/* ===== ЗАГОЛОВКИ СОРТУВАННЯ ===== */}
        <motion.div
          variants={itemVariants}
          className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 rounded-lg bg-slate-800/30 border border-slate-700/30 text-sm font-bold text-slate-400"
        >
          <div className="col-span-3">ПОСТАВЩИК</div>
          <div className="col-span-2">КРАЇНА</div>
          <div
            className="col-span-2 cursor-pointer hover:text-white transition-colors flex items-center gap-1"
            onClick={() => {
              setSortBy('reliability');
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            }}
          >
            НАДІЙНІСТЬ {sortBy === 'reliability' && (sortOrder === 'desc' ? '↓' : '↑')}
          </div>
          <div
            className="col-span-2 cursor-pointer hover:text-white transition-colors flex items-center gap-1"
            onClick={() => {
              setSortBy('price');
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            }}
          >
            ЦІНА {sortBy === 'price' && (sortOrder === 'desc' ? '↓' : '↑')}
          </div>
          <div className="col-span-2">ДОСТАВКА</div>
        </motion.div>

        {/* ===== СПИСОК ПОСТАВЩИКІВ ===== */}
        <motion.div className="space-y-3">
          <AnimatePresence>
            {filteredSuppliers.map((supplier, idx) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.03 }}
                className="group"
              >
                <div
                  onClick={() => setSelectedSupplier(selectedSupplier === supplier.id ? null : supplier.id)}
                  className="p-4 rounded-lg border border-slate-700/50 bg-gradient-to-r from-slate-800/40 to-slate-800/20 hover:border-cyan-500/30 hover:bg-slate-800/60 transition-all cursor-pointer"
                >
                  {/* MAIN ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 md:col-span-3">
                      <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {supplier.name}
                      </p>
                      <p className="text-sm text-slate-500">{supplier.sector}</p>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">{supplier.country}</span>
                    </div>

                    {/* RELIABILITY SCORE */}
                    <div className="col-span-1 md:col-span-2">
                      <div className="flex items-center gap-2">
                        {supplier.reliabilityScore >= 90 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {supplier.reliabilityScore < 90 && <AlertCircle className="w-4 h-4 text-amber-500" />}
                        <span className="font-bold text-white">{supplier.reliabilityScore}%</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded h-1 mt-1">
                        <div
                          className={`h-full rounded ${
                            supplier.reliabilityScore >= 90
                              ? 'bg-emerald-500'
                              : supplier.reliabilityScore >= 75
                              ? 'bg-cyan-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${supplier.reliabilityScore}%` }}
                        />
                      </div>
                    </div>

                    {/* PRICE */}
                    <div className="col-span-1 md:col-span-2">
                      <p className="font-bold text-white">${supplier.averagePrice}</p>
                      <p className="text-xs text-slate-500">±{supplier.priceVariance}%</p>
                    </div>

                    {/* DELIVERY */}
                    <div className="col-span-1 md:col-span-2">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{supplier.deliveryTimeAvg} дн</span>
                      </div>
                    </div>

                    {/* CHEVRON */}
                    <div className="col-span-1 flex justify-end">
                      {selectedSupplier === supplier.id ? (
                        <ChevronUp className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* EXPANDED DETAILS */}
                  <AnimatePresence>
                    {selectedSupplier === supplier.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-700/30 mt-4 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4"
                      >
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Мін. замовлення</p>
                          <p className="font-bold text-white">{supplier.minOrder} шт</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Макс. замовлення</p>
                          <p className="font-bold text-white">{supplier.maxOrder.toLocaleString()} шт</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Замовлень</p>
                          <p className="font-bold text-white">{supplier.orderCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">З року</p>
                          <p className="font-bold text-white">{supplier.yearFounded}</p>
                        </div>

                        {supplier.certifications.length > 0 && (
                          <div className="col-span-2 md:col-span-4">
                            <p className="text-xs text-slate-500 mb-2">Сертифікації</p>
                            <div className="flex flex-wrap gap-2">
                              {supplier.certifications.map((cert) => (
                                <Badge key={cert} variant="secondary" className="text-xs">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredSuppliers.length === 0 && (
          <motion.div variants={itemVariants} className="p-8 text-center rounded-lg border border-slate-700/30 bg-slate-800/20">
            <p className="text-slate-400">Поставщиків не знайдено за вашим запитом</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SupplierDiscoveryPremiumV2;
