import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Newspaper, Search, Bot, ArrowRight, X,
    ShieldCheck, Globe
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

const stepMetadata = [
    { icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: Newspaper, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { icon: Search, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { icon: Bot, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" }
];

const rawSteps = Object.values(premiumLocales.onboarding.steps);

const steps = rawSteps.map((step: any, i) => ({
    ...step,
    ...stepMetadata[i % stepMetadata.length]
}));

export const UserOnboarding: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const currentCompleted = localStorage.getItem('predator_onboarding_completed');
        if (!currentCompleted) {
            // Delay showing to allow app to load
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('predator_onboarding_completed', 'true');
    };

    if (!isVisible) return null;

    const StepIcon = steps[currentStep].icon;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#020617] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-500/20"
                    >
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            aria-label="Закрити"
                            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-colors z-20"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10">
                            {/* Step Indicator */}
                            <div className="flex justify-center gap-2 pt-8 pb-4">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-300",
                                            idx === currentStep ? "w-8 bg-indigo-500" : "w-2 bg-slate-800"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <div className="px-8 pb-8 pt-4 text-center">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className={cn(
                                        "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
                                        steps[currentStep].bg
                                    )}>
                                        <StepIcon size={40} className={steps[currentStep].color} />
                                    </div>

                                    <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
                                        {steps[currentStep].title}
                                    </h2>

                                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-8">
                                        {steps[currentStep].description}
                                    </p>
                                </motion.div>

                                <button
                                    onClick={handleNext}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group"
                                >
                                    {currentStep === steps.length - 1 ? premiumLocales.onboarding.ui.finish : premiumLocales.onboarding.ui.next}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
