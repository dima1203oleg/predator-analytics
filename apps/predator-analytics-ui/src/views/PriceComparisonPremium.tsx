/**
 * 💰 Price Comparison Tool
 *
 * Порівняння цін від різних постачальників
 * Знаходження найкращих пропозицій
 */

import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Truck,
  Shield,
  Crown,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Globe,
  Package,
  BarChart3,
  Download
} from 'lucide-react';

// ========================
// Types
// ========================

interface PriceOffer {
  id: string;
  supplierName: string;
  country: string;
  countryCode: string;
  price: number;
  currency: string;
  minQuantity: number;
  leadTime: number;
  reliability: number;
  lastUpdated: string;
  priceHistory: { date: string; price: number }[];
  isVerified: boolean;
  isBestPrice: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  hsCode: string;
  unit: string;
  avgPrice: number;
  offers: PriceOffer[];
}

// ========================
// Mock data removed in favor of real API
// ========================
// Components
// ========================

const formatPrice = (price: number, currency: string = 'USD'): string => {
  return `$${price.toFixed(2)}`;
};

interface PriceComparisonRowProps {
  offer: PriceOffer;
  avgPrice: number;
  unit: string;
  rank: number;
}

const PriceComparisonRow: React.FC<PriceComparisonRowProps> = ({ offer, avgPrice, unit, rank }) => {
  const priceDiff = ((offer.price - avgPrice) / avgPrice) * 100;
  const isCheaper = priceDiff < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`
        p-4 rounded-xl border transition-all
        ${offer.isBestPrice ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-slate-900/40 hover:border-white/10'}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
          ${rank === 0 ? 'bg-amber-500/20 text-amber-400' :
            rank === 1 ? 'bg-slate-500/20 text-slate-400' :
              rank === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-slate-800 text-slate-500'}
        `}>
          {rank + 1}
        </div>

        {/* Supplier Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white">{offer.supplierName}</span>
            {offer.isVerified && (
              <div title="Верифікований">
                <Shield className="text-cyan-400" size={14} />
              </div>
            )}
            {offer.isBestPrice && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                Найкраща ціна
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Globe size={12} />
              {offer.country}
            </span>
            <span className="flex items-center gap-1">
              <Truck size={12} />
              {offer.leadTime} днів
            </span>
            <span className="flex items-center gap-1">
              <Package size={12} />
              від {offer.minQuantity} {unit}
            </span>
          </div>
        </div>

        {/* Reliability */}
        <div className="text-center">
          <div className={`text-lg font-bold ${offer.reliability >= 95 ? 'text-emerald-400' :
              offer.reliability >= 85 ? 'text-amber-400' : 'text-rose-400'
            }`}>
            {offer.reliability}%
          </div>
          <p className="text-[10px] text-slate-500">Надійність</p>
        </div>

        {/* Price */}
        <div className="text-right">
          <div className="text-xl font-black text-white">
            {formatPrice(offer.price)}
          </div>
          <div className={`flex items-center justify-end gap-1 text-xs ${isCheaper ? 'text-emerald-400' : 'text-rose-400'
            }`}>
            {isCheaper ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            <span>{priceDiff.toFixed(1)}% від середньої</span>
          </div>
        </div>

        {/* Actions */}
        <button className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors">
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
};

interface ProductCardProps {
  product: Product;
  isExpanded: boolean;
  onToggle: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isExpanded, onToggle }) => {
  const bestPrice = Math.min(...product.offers.map(o => o.price));
  const worstPrice = Math.max(...product.offers.map(o => o.price));
  const savings = ((worstPrice - bestPrice) / worstPrice) * 100;

  const sortedOffers = useMemo(() =>
    [...product.offers].sort((a, b) => a.price - b.price),
    [product.offers]
  );

  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
              <Package className="text-cyan-400" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{product.name}</h3>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                <span>{product.category}</span>
                <span>•</span>
                <span>HS: {product.hsCode}</span>
                <span>•</span>
                <span>{product.offers.length} пропозицій</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Price Range */}
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="text-emerald-400">{formatPrice(bestPrice)}</span>
                <ArrowRight className="text-slate-600" size={16} />
                <span className="text-slate-400">{formatPrice(worstPrice)}</span>
              </div>
              <p className="text-xs text-slate-500">за {product.unit}</p>
            </div>

            {/* Savings Badge */}
            <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <p className="text-lg font-black text-emerald-400">-{savings.toFixed(0)}%</p>
              <p className="text-[10px] text-emerald-400/70">економія</p>
            </div>

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="text-slate-500"
            >
              <ChevronDown size={20} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-5 space-y-3">
              {sortedOffers.map((offer, index) => (
                <PriceComparisonRow
                  key={offer.id}
                  offer={offer}
                  avgPrice={product.avgPrice}
                  unit={product.unit}
                  rank={index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ========================
// Main Component
// ========================

const PriceComparisonPremium: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'savings' | 'offers' | 'name'>('savings');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.premium.getPriceComparison();
        setProducts(data);
        if (data.length > 0) {
          setExpandedProduct(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [searchQuery, products]);

  const totalSavings = useMemo(() => {
    if (products.length === 0) return 0;
    return products.reduce((acc, p) => {
      if (p.offers.length === 0) return acc;
      const best = Math.min(...p.offers.map(o => o.price));
      const worst = Math.max(...p.offers.map(o => o.price));
      return acc + ((worst - best) / worst) * 100;
    }, 0) / products.length;
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <DollarSign className="text-emerald-400" />
              Порівняння Цін
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Знаходження найкращих пропозицій від постачальників
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
              <Download size={16} />
              Експорт
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold text-sm">
              <Sparkles size={16} />
              AI Пошук
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="text-cyan-400" size={18} />
              <span className="text-2xl font-black text-white">{products.length}</span>
            </div>
            <p className="text-xs text-slate-500">Товарів</p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Globe className="text-purple-400" size={18} />
              <span className="text-2xl font-black text-white">
                {new Set(products.flatMap(p => p.offers.map(o => o.country))).size}
              </span>
            </div>
            <p className="text-xs text-slate-500">Країн</p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="text-amber-400" size={18} />
              <span className="text-2xl font-black text-white">
                {products.reduce((acc, p) => acc + p.offers.length, 0)}
              </span>
            </div>
            <p className="text-xs text-slate-500">Пропозицій</p>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="text-emerald-400" size={18} />
              <span className="text-2xl font-black text-emerald-400">-{totalSavings.toFixed(0)}%</span>
            </div>
            <p className="text-xs text-emerald-400/70">Середня економія</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Пошук товару або категорії..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Завантаження даних...</p>
            </div>
          ) : (
            <>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isExpanded={expandedProduct === product.id}
                  onToggle={() => setExpandedProduct(
                    expandedProduct === product.id ? null : product.id
                  )}
                />
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Search className="text-slate-600 mx-auto mb-4" size={48} />
                  <p className="text-slate-500">Товарів не знайдено</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceComparisonPremium;
