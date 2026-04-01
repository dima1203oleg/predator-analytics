/**
 * Supplier Discovery & Smart Ranking
 * Find best suppliers with AI-powered recommendations
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Star,
  Shield,
  Zap,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  Filter,
  BadgeCheck,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

interface Supplier {
  id: string;
  name: string;
  country: string;
  category: string;
  rating: number; // 0-5
  price: number;
  reliability: number; // 0-100
  reviews: number;
  shipment: string; // e.g., "25-30 днів"
  certifications: string[];
  riskLevel: 'low' | 'medium' | 'high';
  isVerified: boolean;
  match: number; // percentage match to requirements
}

const SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Guangzhou PowerTech Ltd',
    country: 'Китай',
    category: 'Електрогенератори',
    rating: 4.8,
    price: 850,
    reliability: 92,
    reviews: 247,
    shipment: '25-30 днів',
    certifications: ['ISO 9001', 'CE', 'RoHS'],
    riskLevel: 'low',
    isVerified: true,
    match: 95,
  },
  {
    id: 'sup-002',
    name: 'Shanghai Electric Co',
    country: 'Китай',
    category: 'Електрогенератори',
    rating: 4.6,
    price: 880,
    reliability: 88,
    reviews: 195,
    shipment: '30-35 днів',
    certifications: ['ISO 9001', 'CE'],
    riskLevel: 'low',
    isVerified: true,
    match: 87,
  },
  {
    id: 'sup-003',
    name: 'Beijing Energy Systems',
    country: 'Китай',
    category: 'Електрогенератори',
    rating: 4.3,
    price: 920,
    reliability: 85,
    reviews: 132,
    shipment: '28-32 днів',
    certifications: ['ISO 9001'],
    riskLevel: 'medium',
    isVerified: false,
    match: 78,
  },
];

export const SupplierDiscovery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Пошук постачальників</h1>
        <p className="text-xl text-slate-400">
          AI-рекомендації з урахуванням якості, ціни та ризику
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Пошук постачальників..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Button variant="outline" className="border-slate-700">
          <Filter className="w-4 h-4 mr-2" /> Фільтри
        </Button>
      </div>

      {/* Suppliers List */}
      <div className="space-y-4">
        {SUPPLIERS.map((supplier, idx) => (
          <motion.div
            key={supplier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              'p-5 rounded-lg border transition-all',
              'hover:border-cyan-500/50 cursor-pointer',
              supplier.riskLevel === 'low' ? 'border-emerald-500/30 bg-emerald-500/5' : 
              supplier.riskLevel === 'medium' ? 'border-amber-500/30 bg-amber-500/5' :
              'border-rose-500/30 bg-rose-500/5'
            )}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Name & Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {supplier.name}
                      {supplier.isVerified && (
                        <BadgeCheck className="w-5 h-5 text-cyan-400" />
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                      <MapPin className="w-4 h-4" /> {supplier.country}
                    </div>
                  </div>
                  <Badge className="bg-cyan-600 text-white">
                    {(supplier.match)}% Match
                  </Badge>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < Math.floor(supplier.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-600'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-300">
                    {supplier.rating} ({supplier.reviews} відзивів)
                  </span>
                </div>

                {/* Certifications */}
                <div className="flex gap-2 flex-wrap">
                  {supplier.certifications.map((cert) => (
                    <Badge key={cert} variant="outline" className="text-xs bg-slate-700/50">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Middle: Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Ціна</p>
                  <p className="text-xl font-bold text-white">${supplier.price}</p>
                  <p className="text-xs text-emerald-400 mt-1">Найліпша пропозиція</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Надійність</p>
                  <p className="text-xl font-bold text-cyan-400">{supplier.reliability}%</p>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${supplier.reliability}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Доставка</p>
                  <p className="text-sm font-bold text-white">{supplier.shipment}</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Ризик</p>
                  <div className="flex items-center gap-2">
                    {supplier.riskLevel === 'low' && (
                      <Badge className="bg-emerald-500/20 text-emerald-300">Низький</Badge>
                    )}
                    {supplier.riskLevel === 'medium' && (
                      <Badge className="bg-amber-500/20 text-amber-300">Середній</Badge>
                    )}
                    {supplier.riskLevel === 'high' && (
                      <Badge className="bg-rose-500/20 text-rose-300">Високий</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-col gap-2 justify-between">
                <div className="space-y-2">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-9 text-sm">
                    <Zap className="w-4 h-4 mr-1" /> Рекомендувати
                  </Button>
                  <Button variant="outline" className="w-full border-slate-700 h-9 text-sm">
                    <Shield className="w-4 h-4 mr-1" /> Детальна перевірка
                  </Button>
                  <Button variant="outline" className="w-full border-slate-700 h-9 text-sm">
                    <Mail className="w-4 h-4 mr-1" /> Звернутися
                  </Button>
                </div>

                {/* Risk Alert */}
                {supplier.riskLevel !== 'low' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200">
                      {supplier.riskLevel === 'medium' 
                        ? 'Середній ризик - рекомендуються додаткові перевірки'
                        : 'Високий ризик - обережно!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparison Tool */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-violet-400" />
            Порівнювальний аналіз
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
            <Download className="w-4 h-4 mr-2" /> Завантажити порівняння (PDF)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierDiscovery;
