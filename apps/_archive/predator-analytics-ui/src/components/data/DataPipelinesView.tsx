
import React from 'react';
import { motion } from 'framer-motion';
import { ETLTruthDashboard, AZRConstitutionalDashboard } from '../';

export const DataPipelinesView: React.FC = () => {
    return (
        <motion.div
            key="pipelines"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <ETLTruthDashboard />
            <div className="pt-8 border-t border-white/5">
                <AZRConstitutionalDashboard />
            </div>
        </motion.div>
    );
};
