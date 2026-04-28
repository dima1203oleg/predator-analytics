/**
 * 💰 PRICE AUDITOR TAB // П АЙС-АУДИТО  | v61.0-ELITE
 * PREDATOR Analytics — Market Analysis & Procurement Intelligence
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, DollarSign, TrendingUp, TrendingDown, ArrowRight,
  ChevronDown, ChevronUp, Star, Clock, Globe, Package, BarChart3,
  Download, Target, Layers, Zap, BadgeCheck, Box, Loader2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { intelligenceApi } from '@/services/api/intelligence';
import { useBackendStatus } from '@/hooks/useBackendStatus';

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

export const PriceAuditorTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOffline } = useBackendStatus();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await intelligenceApi.getPriceComparison();
        setProducts(data?.products || []);
        if (data?.products?.length > 0) {
          setExpandedProduct(data.products[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch price comparison data:', err);
        setError('Не вдалося завантажити дані порівняння цін');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (p: number) => `$${p.toLocaleString()}`;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.hsCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-4">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
        <p className="text-[#D4AF37] font-black uppercase tracking-widest text-xs animate-pulse">
          АНАЛІЗ ЦІНОВИХПРОПОЗИЦІЙ...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* SEARCH HUD */}
      <section className="p-4 rounded-2xl bg-black/40 border border-white/[0.04] shadow-xl flex items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-[#D4AF37] transition-colors" size={20} />
          <input 
            type="text" placeholder="ПОШУК ТОВА У, КАТЕГО ІЇ АБО КОДУ УКТЗЕД..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.05] p-3 pl-12 rounded-xl text-sm font-bold text-white italic tracking-tight focus:border-[#D4AF37]/40 outline-none transition-all placeholder:text-slate-800"
          />
        </div>
        <button className="p-3 bg-white/[0.04] border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg">
          <Filter size={18} />
        </button>
        <button className="p-3 bg-white/[0.04] border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg">
          <Download size={18} />
        </button>
      </section>

      {/* PRODUCTS GRID */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
            <Search size={48} className="mx-auto text-slate-800 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Нічого не знайдено</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="p-6 rounded-[2rem] bg-black/40 border border-white/[0.05] shadow-lg space-y-6 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl text-[#D4AF37]">
                    <Package size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">{product.name}</h3>
                    <div className="flex items-center gap-3 text-[9px] font-black text-slate-600 uppercase italic tracking-widest">
                      <span>{product.category}</span>
                      <span className="text-slate-800">|</span>
                      <span>УКТЗЕД: {product.hsCode}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">СЕ ЕДНЯ_ЦІНА</p>
                    <p className="text-xl font-black text-white italic font-mono tracking-tighter">{formatPrice(product.avgPrice)}</p>
                  </div>
                  <div className="p-4 bg-[#D4AF37] text-black rounded-xl text-center min-w-[100px] shadow-lg skew-x-[-3deg]">
                    <p className="text-xl font-black italic font-mono tracking-tighter leading-none">
                      -{product.offers.length > 0 ? (((Math.max(...product.offers.map(o => o.price)) - Math.min(...product.offers.map(o => o.price))) / Math.max(...product.offers.map(o => o.price))) * 100).toFixed(0) : 0}%
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-widest leading-none mt-1">ОПТІМ_DEAL</p>
                  </div>
                  <button 
                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)} 
                    className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/5"
                  >
                    {expandedProduct === product.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedProduct === product.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    className="space-y-3 pt-4 border-t border-white/5"
                  >
                    <div className="grid grid-cols-1 gap-3">
                      {product.offers.map((offer, idx) => (
                        <div 
                          key={offer.id} 
                          className={cn(
                            "p-4 rounded-xl bg-white/[0.01] border transition-all flex items-center justify-between group", 
                            offer.isBestPrice ? "border-[#D4AF37]/40 bg-[#D4AF37]/[0.02]" : "border-white/[0.04] hover:border-[#D4AF37]/20"
                          )}
                        >
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black italic font-mono shadow-inner", 
                              idx === 0 ? "bg-[#D4AF37] text-black" : "bg-slate-900 border border-white/5 text-slate-500"
                            )}>
                              0{idx+1}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-white italic uppercase tracking-tighter group-hover:text-[#D4AF37] transition-colors leading-none">
                                  {offer.supplierName}
                                </h4>
                                {offer.isVerified && <BadgeCheck size={14} className="text-[#D4AF37]" />}
                                {offer.isBestPrice && (
                                  <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[7px] font-black italic uppercase tracking-widest">
                                    НАЙК АЩА_ЦІНА
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[8px] font-black text-slate-700 uppercase italic tracking-widest">
                                <span className="flex items-center gap-1"><Globe size={10} /> {offer.country}</span>
                                <span className="flex items-center gap-1"><Clock size={10} /> {offer.leadTime} ДНІВ</span>
                                <span className="flex items-center gap-1"><Layers size={10} /> ВІД {offer.minQuantity} {product.unit}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-10">
                            <div className="text-center">
                              <div className={cn("text-lg font-black font-mono italic", offer.reliability >= 95 ? "text-[#D4AF37]" : "text-amber-500")}>
                                {offer.reliability}%
                              </div>
                              <p className="text-[7px] font-black text-slate-800 uppercase tracking-widest leading-none">НАДІЙНІСТЬ</p>
                            </div>
                            <div className="text-right border-l border-white/5 pl-8 min-w-[120px]">
                              <p className="text-xl font-black text-white italic font-mono tracking-tighter leading-none">
                                {formatPrice(offer.price)}
                              </p>
                              <p className={cn("text-[8px] font-black italic mt-1", offer.price < product.avgPrice ? "text-[#D4AF37]" : "text-amber-500")}>
                                {offer.price < product.avgPrice ? <TrendingDown size={10} className="inline mr-1" /> : <TrendingUp size={10} className="inline mr-1" />}
                                {Math.abs(((offer.price - product.avgPrice) / product.avgPrice) * 100).toFixed(1)}% ВІД СЕ ЕДНЬОЇ
                              </p>
                            </div>
                            <button className="p-3 bg-[#D4AF37] text-black rounded-lg hover:brightness-110 shadow-lg transition-all">
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
