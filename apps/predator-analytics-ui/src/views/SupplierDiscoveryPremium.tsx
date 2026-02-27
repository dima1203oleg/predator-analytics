/**
 * 🔍 Supplier Discovery & Sourcing View
 *
 * Знаходження нових постачальників для бізнесу
 * на основі аналізу митних даних
 */

import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  StarOff,
  Building2,
  Globe,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  MapPin,
  Truck,
  Phone,
  Mail,
  ExternalLink,
  MessageSquare,
  Calendar,
  Crown,
  Sparkles,
  Target,
  Shield,
  Award,
  Clock
} from 'lucide-react';

// ========================
// Types
// ========================

interface Supplier {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  products: string[];
  totalExportVolume: number;
  avgPrice: number;
  priceCompetitiveness: number;
  ukraineClients: number;
  reliability: number;
  leadTime: number;
  lastShipment: string;
  certifications: string[];
  verified: boolean;
  isFavorite: boolean;
}

interface SupplierMatch {
  supplier: Supplier;
  matchScore: number;
  priceAdvantage: number;
  reasons: string[];
}

// ========================
// Mock data removed in favor of real API
// ========================

// ========================
// Components
// ========================

const CountryFlag: React.FC<{ code: string; country: string }> = ({ code, country }) => (
  <div className="flex items-center gap-2">
    <div className="w-6 h-4 rounded-sm bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
      {code}
    </div>
    <span className="text-slate-300">{country}</span>
  </div>
);

const ReliabilityBadge: React.FC<{ score: number }> = ({ score }) => {
  const getConfig = (s: number) => {
    if (s >= 90) return { color: 'emerald', label: 'Надійний', icon: CheckCircle };
    if (s >= 70) return { color: 'amber', label: 'Добрий', icon: AlertCircle };
    return { color: 'rose', label: 'Ризик', icon: XCircle };
  };

  const config = getConfig(score);
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1 px-2 py-1 bg-${config.color}-500/20 text-${config.color}-400 rounded-lg text-xs font-bold`}>
      <Icon size={12} />
      {score}% {config.label}
    </div>
  );
};

const SupplierCard: React.FC<{
  supplier: Supplier;
  isExpanded: boolean;
  onToggle: () => void;
  onFavorite: () => void;
}> = ({ supplier, isExpanded, onToggle, onFavorite }) => (
  <motion.div
    layout
    className={`
      bg-slate-900/60 border rounded-2xl overflow-hidden transition-all
      ${isExpanded ? 'border-cyan-500/30 ring-2 ring-cyan-500/10' : 'border-white/5 hover:border-white/10'}
    `}
  >
    <div className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Company Logo Placeholder */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
            <Building2 className="text-slate-500" size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">{supplier.name}</h3>
              {supplier.verified && (
                <div title="Верифікований">
                  <Shield className="text-cyan-400" size={16} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm mb-3">
              <CountryFlag code={supplier.countryCode} country={supplier.country} />
              <span className="text-slate-500">{supplier.city}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {supplier.products.slice(0, 3).map((product) => (
                <span key={product} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg border border-cyan-500/20">
                  {product}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Price Competitiveness */}
          <div className="text-center">
            <div className={`text-2xl font-black ${supplier.priceCompetitiveness >= 90 ? 'text-emerald-400' :
                supplier.priceCompetitiveness >= 70 ? 'text-amber-400' : 'text-rose-400'
              }`}>
              {supplier.priceCompetitiveness}%
            </div>
            <p className="text-xs text-slate-500">Ціна</p>
          </div>

          {/* Reliability */}
          <div className="text-center">
            <ReliabilityBadge score={supplier.reliability} />
          </div>

          {/* Ukraine Clients */}
          <div className="text-center">
            <div className="text-xl font-bold text-white">{supplier.ukraineClients}</div>
            <p className="text-xs text-slate-500">UA клієнтів</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onFavorite();
              }}
              className={`p-2 rounded-lg transition-colors ${supplier.isFavorite
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-800 text-slate-500 hover:text-amber-400'
                }`}
            >
              {supplier.isFavorite ? <Star size={18} /> : <StarOff size={18} />}
            </motion.button>

            <button
              onClick={onToggle}
              className="p-2 rounded-lg bg-slate-800 text-slate-500 hover:text-white"
            >
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                <ChevronDown size={18} />
              </motion.div>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Expanded Details */}
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/5"
        >
          <div className="p-5 bg-slate-950/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Stats */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                  <TrendingUp size={14} />
                  Статистика
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Обсяг експорту</span>
                    <span className="text-white font-bold">
                      ${(supplier.totalExportVolume / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Середня ціна</span>
                    <span className="text-white font-bold">${supplier.avgPrice}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Час доставки</span>
                    <span className="text-white font-bold">{supplier.leadTime} днів</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Остання поставка</span>
                    <span className="text-slate-300">{supplier.lastShipment}</span>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                  <Award size={14} />
                  Сертифікати
                </h4>
                <div className="flex flex-wrap gap-2">
                  {supplier.certifications.map((cert) => (
                    <span key={cert} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                  <Package size={14} />
                  Продукція
                </h4>
                <div className="space-y-2">
                  {supplier.products.map((product) => (
                    <div key={product} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                      <span className="text-slate-300">{product}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                  <MessageSquare size={14} />
                  Контакт
                </h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-sm font-bold hover:bg-cyan-500/30 transition-colors">
                    <Mail size={14} />
                    Надіслати запит
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm hover:bg-slate-700 transition-colors">
                    <ExternalLink size={14} />
                    Профіль компанії
                  </button>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-purple-400" size={16} />
                <span className="text-sm font-bold text-purple-400">AI Рекомендація</span>
              </div>
              <p className="text-sm text-slate-300">
                Цей постачальник пропонує ціни на <span className="text-emerald-400 font-bold">15% нижче</span> ринкових
                та має <span className="text-cyan-400 font-bold">98% своєчасних поставок</span>. Рекомендовано для
                довгострокової співпраці.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ========================
// Main Component
// ========================

const SupplierDiscoveryPremium: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await api.premium.getSuppliers();
        setSuppliers(data);
      } catch (err) {
        console.error('Failed to fetch suppliers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const countries = useMemo(() =>
    [...new Set(suppliers.map(s => s.country))],
    [suppliers]
  );

  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    if (searchQuery) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.products.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCountry !== 'all') {
      result = result.filter(s => s.country === selectedCountry);
    }

    return result.sort((a, b) => b.priceCompetitiveness - a.priceCompetitiveness);
  }, [suppliers, searchQuery, selectedCountry]);

  const toggleFavorite = (id: string) => {
    setSuppliers(prev => prev.map(s =>
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    ));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Target className="text-cyan-400" />
              Пошук Постачальників
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              {suppliers.length} верифікованих постачальників у базі
            </p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-sm">
            <Sparkles size={16} />
            AI Підбір
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Пошук постачальника або товару..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-slate-300 focus:outline-none"
          >
            <option value="all">Всі країни</option>
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          <button className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-slate-300">
            <Filter size={18} />
            Фільтри
          </button>
        </div>

        {/* Suppliers List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Завантаження даних...</p>
            </div>
          ) : (
            <>
              {filteredSuppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  isExpanded={expandedId === supplier.id}
                  onToggle={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}
                  onFavorite={() => toggleFavorite(supplier.id)}
                />
              ))}

              {filteredSuppliers.length === 0 && (
                <div className="text-center py-12">
                  <Search className="text-slate-600 mx-auto mb-4" size={48} />
                  <p className="text-slate-500">Постачальників не знайдено</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierDiscoveryPremium;
