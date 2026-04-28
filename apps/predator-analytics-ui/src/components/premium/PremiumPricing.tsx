/**
 * PREDATOR Premium Pricing - Комерційні Тарифні Плани
 *
 * Компонент для показу цінових планів та активації підписки:
 * - STARTER: Базова аналітика
 * - PROFESSIONAL: Повний TITAN/INQUISITOR/SOVEREIGN доступ
 * - ENTERPRISE: Кастомізація + API + Виділенапідтримка
 *
 * © 2026 PREDATOR Analytics
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Check, X, Star, Zap, Shield, Target, Building2,
  Users, Clock, Phone, Globe, Lock, Database, BarChart3,
  BrainCircuit, Bell, FileText, Sparkles, ArrowRight, ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';

import { premiumLocales } from '../../locales/uk/premium';

// Pricing Plans
const PRICING_PLANS = [
  {
    id: 'starter',
    name: premiumLocales.pricing.plans.starter.name,
    subtitle: premiumLocales.pricing.plans.starter.subtitle,
    price: 99,
    currency: '$',
    period: '/міс',
    color: 'slate',
    gradient: 'from-slate-500 to-slate-600',
    icon: Zap,
    popular: false,
    features: premiumLocales.pricing.plans.starter.features.map((f, i) => ({ text: f, included: i < 5 })),
    cta: premiumLocales.pricing.cta.starter,
    ctaStyle: 'outline'
  },
  {
    id: 'professional',
    name: premiumLocales.pricing.plans.professional.name,
    subtitle: premiumLocales.pricing.plans.professional.subtitle,
    price: 499,
    currency: '$',
    period: '/міс',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    icon: Target,
    popular: true,
    features: premiumLocales.pricing.plans.professional.features.map(f => ({ text: f, included: true })),
    cta: premiumLocales.pricing.cta.professional,
    ctaStyle: 'primary'
  },
  {
    id: 'enterprise',
    name: premiumLocales.pricing.plans.enterprise.name,
    subtitle: premiumLocales.pricing.plans.enterprise.subtitle,
    price: null,
    priceLabel: premiumLocales.pricing.plans.enterprise.priceLabel,
    currency: '',
    period: '',
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    icon: Crown,
    popular: false,
    features: premiumLocales.pricing.plans.enterprise.features.map(f => ({ text: f, included: true })),
    cta: premiumLocales.pricing.cta.enterprise,
    ctaStyle: 'enterprise'
  }
];

// Comparison Features
const COMPARISON_FEATURES = [
  {
    category: premiumLocales.pricing.comparison.categories.search,
    features: [
      { name: premiumLocales.pricing.comparison.features.searchScope, starter: premiumLocales.pricing.comparison.values.basic, pro: premiumLocales.pricing.comparison.values.advanced, enterprise: premiumLocales.pricing.comparison.values.full },
      { name: premiumLocales.pricing.comparison.features.dailyQueries, starter: '1,000', pro: premiumLocales.pricing.comparison.values.unlimited, enterprise: premiumLocales.pricing.comparison.values.unlimited },
      { name: premiumLocales.pricing.comparison.features.exportLimit, starter: premiumLocales.pricing.comparison.values.limit100, pro: premiumLocales.pricing.comparison.values.unlimited, enterprise: premiumLocales.pricing.comparison.values.unlimitedApi },
      { name: premiumLocales.pricing.comparison.features.dataHistory, starter: premiumLocales.pricing.comparison.values.year1, pro: premiumLocales.pricing.comparison.values.years5, enterprise: premiumLocales.pricing.comparison.values.fullHistory },
    ]
  },
  {
    category: premiumLocales.pricing.comparison.categories.analytics,
    features: [
      { name: premiumLocales.pricing.comparison.features.aiInsights, starter: '❌', pro: '✅', enterprise: premiumLocales.pricing.comparison.values.customModels },
      { name: premiumLocales.pricing.comparison.features.compAnalysis, starter: '❌', pro: '✅', enterprise: '✅' },
      { name: premiumLocales.pricing.comparison.features.riskScoring, starter: '❌', pro: '✅', enterprise: premiumLocales.pricing.comparison.values.customRules },
      { name: premiumLocales.pricing.comparison.features.forecasting, starter: '❌', pro: premiumLocales.pricing.comparison.values.basic, enterprise: premiumLocales.pricing.comparison.values.advanced },
    ]
  },
  {
    category: premiumLocales.pricing.comparison.categories.support,
    features: [
      { name: premiumLocales.pricing.comparison.features.supportChannel, starter: premiumLocales.pricing.comparison.values.email, pro: premiumLocales.pricing.comparison.values.emailChat, enterprise: premiumLocales.pricing.comparison.values.phoneDedicated },
      { name: premiumLocales.pricing.comparison.features.responseTime, starter: premiumLocales.pricing.comparison.values.h48, pro: premiumLocales.pricing.comparison.values.h4, enterprise: premiumLocales.pricing.comparison.values.h1 },
      { name: premiumLocales.pricing.comparison.features.onboarding, starter: '❌', pro: '✅', enterprise: '✅ + Training' },
      { name: premiumLocales.pricing.comparison.features.sla, starter: '❌', pro: '99%', enterprise: '99.9%' },
    ]
  },
];

// Plan Card Component
const PlanCard: React.FC<{
  plan: typeof PRICING_PLANS[0];
  onSelect: (planId: string) => void;
  isAnnual: boolean;
}> = ({ plan, onSelect, isAnnual }) => {
  const Icon = plan.icon;
  const annualDiscount = 0.2; // 20% off for annual
  const displayPrice = plan.price
    ? isAnnual
      ? Math.round(plan.price * (1 - annualDiscount))
      : plan.price
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={cn(
        "relative p-6 rounded-[32px] border backdrop-blur-xl transition-all",
        plan.popular
          ? `bg-gradient-to-b from-${plan.color}-500/10 to-slate-950/80 border-${plan.color}-500/30 shadow-xl shadow-${plan.color}-500/10`
          : "bg-slate-950/80 border-white/10"
      )}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className={cn(
          "absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
          `bg-gradient-to-r ${plan.gradient} text-white shadow-lg`
        )}>
          <Sparkles size={10} className="inline-block mr-1" />
          {premiumLocales.pricing.popular}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6 pt-2">
        <div className={cn(
          "w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center",
          `bg-gradient-to-br ${plan.gradient}`
        )}>
          <Icon size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-black text-white tracking-tight">{plan.name}</h3>
        <p className="text-[11px] text-slate-500 mt-1">{plan.subtitle}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        {displayPrice !== null ? (
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-slate-500 text-lg">{plan.currency}</span>
            <span className="text-4xl font-black text-white">{displayPrice}</span>
            <span className="text-slate-500 text-sm">{plan.period}</span>
          </div>
        ) : (
          <div className="text-2xl font-black text-white">{plan.priceLabel}</div>
        )}
        {isAnnual && plan.price && (
          <div className="text-[10px] text-emerald-400 mt-1">
            {premiumLocales.pricing.billing.save.replace('{amount}', `$${Math.round(plan.price * annualDiscount * 12)}`)}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-3 mb-6">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
              feature.included ? "bg-emerald-500/20" : "bg-slate-800"
            )}>
              {feature.included ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <X size={12} className="text-slate-600" />
              )}
            </div>
            <span className={cn(
              "text-[11px]",
              feature.included ? "text-slate-300" : "text-slate-600"
            )}>
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => onSelect(plan.id)}
        className={cn(
          "w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all",
          plan.ctaStyle === 'primary' && `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl hover:scale-[1.02]`,
          plan.ctaStyle === 'outline' && "bg-transparent border-2 border-white/20 text-white hover:bg-white/5",
          plan.ctaStyle === 'enterprise' && "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
        )}
      >
        {plan.cta}
        <ArrowRight size={14} className="inline-block ml-2" />
      </button>
    </motion.div>
  );
};

// Main Pricing Component
export const PremiumPricing: React.FC<{
  onSelectPlan?: (planId: string) => void;
}> = ({ onSelectPlan }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  const handleSelectPlan = (planId: string) => {
    onSelectPlan?.(planId);
    // In real implementation, redirect to checkout
    console.log('Selected plan:', planId);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4"
        >
          <Crown className="text-amber-400" size={16} />
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Premium Intelligence</span>
        </motion.div>

        <h2 className="text-4xl font-black text-white tracking-tight mb-3">
          {premiumLocales.pricing.title}
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          {premiumLocales.pricing.description}
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={cn("text-sm font-bold", !isAnnual ? "text-white" : "text-slate-500")}>
          {premiumLocales.pricing.billing.monthly}
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          aria-label={isAnnual ? "Switch to monthly billing" : "Switch to annual billing"}
          title={isAnnual ? "Switch to monthly billing" : "Switch to annual billing"}
          className={cn(
            "relative w-14 h-8 rounded-full transition-colors",
            isAnnual ? "bg-amber-500" : "bg-slate-700"
          )}
        >
          <div className={cn(
            "absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg",
            isAnnual ? "translate-x-7" : "translate-x-1"
          )} />
        </button>
        <span className={cn("text-sm font-bold", isAnnual ? "text-white" : "text-slate-500")}>
          {premiumLocales.pricing.billing.annual}
          <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded">
            -20%
          </span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PRICING_PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <PlanCard
              plan={plan}
              onSelect={handleSelectPlan}
              isAnnual={isAnnual}
            />
          </motion.div>
        ))}
      </div>

      {/* Comparison Table Toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
        >
          {premiumLocales.pricing.comparison.trigger}
          <ChevronRight size={16} className={cn("transition-transform", showComparison && "rotate-90")} />
        </button>
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <div className="bg-slate-950/80 border border-white/10 rounded-[32px] p-8 overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-sm font-black text-white">{premiumLocales.pricing.comparison.header}</th>
                  <th className="text-center py-4 px-4 text-sm font-black text-slate-300">STARTER</th>
                  <th className="text-center py-4 px-4 text-sm font-black text-amber-400">PROFESSIONAL</th>
                  <th className="text-center py-4 px-4 text-sm font-black text-indigo-400">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((category) => (
                  <React.Fragment key={category.category}>
                    <tr className="bg-white/5">
                      <td colSpan={4} className="py-3 px-4 text-xs font-black text-slate-300 uppercase tracking-wider">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-300">{feature.name}</td>
                        <td className="py-3 px-4 text-center text-sm text-slate-300">{feature.starter}</td>
                        <td className="py-3 px-4 text-center text-sm text-amber-400">{feature.pro}</td>
                        <td className="py-3 px-4 text-center text-sm text-indigo-400">{feature.enterprise}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-8 py-8 border-t border-white/5">
        <div className="flex items-center gap-2 text-slate-300">
          <Lock size={16} />
          <span className="text-xs">256-bit SSL</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Shield size={16} />
          <span className="text-xs">GDPR Compliant</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Clock size={16} />
          <span className="text-xs">14 днів гарантії</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Users size={16} />
          <span className="text-xs">1000+ клієнтів</span>
        </div>
      </div>
    </div>
  );
};

export default PremiumPricing;
