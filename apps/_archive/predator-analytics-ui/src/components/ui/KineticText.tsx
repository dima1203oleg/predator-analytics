/**
 * 📡 KineticText — Data Stream Typography
- Character scramble перед показом значення
- Tabular nums alignment
- Color flash для змін (green/red)
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface KineticTextProps {
  value: string | number;
  previousValue?: string | number;
  variant?: 'default' | 'up' | 'down';
  className?: string;
  scramble?: boolean;
  duration?: number;
}

const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

export const KineticText: React.FC<KineticTextProps> = ({
  value,
  previousValue,
  variant = 'default',
  className,
  scramble = true,
  duration = 150,
}) => {
  const [displayValue, setDisplayValue] = useState(value.toString());
  const [isScrambling, setIsScrambling] = useState(false);

  useEffect(() => {
    if (!scramble) {
      setDisplayValue(value.toString());
      return;
    }

    if (value === previousValue) return;

    setIsScrambling(true);
    const valueStr = value.toString();
    const length = valueStr.length;
    let iterations = 0;
    const maxIterations = Math.ceil(duration / 30);

    const interval = setInterval(() => {
      iterations++;

      // Scramble characters
      let scrambled = '';
      for (let i = 0; i < length; i++) {
        if (iterations < maxIterations * 0.7) {
          // Full scramble
          scrambled += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        } else {
          // Lock characters progressively
          const lockIndex = Math.floor((iterations - maxIterations * 0.7) / (maxIterations * 0.3) * length);
          if (i < lockIndex) {
            scrambled += valueStr[i];
          } else {
            scrambled += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        }
      }

      setDisplayValue(scrambled);

      if (iterations >= maxIterations) {
        clearInterval(interval);
        setDisplayValue(valueStr);
        setIsScrambling(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [value, previousValue, scramble, duration]);

  const variantClass = {
    default: 'text-[#e8e8e8]',
    up: 'text-[#4ecdc4]',
    down: 'text-[#e11d48]',
  }[variant];

  return (
    <motion.span
      className={cn('font-data', variantClass, className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      {displayValue}
    </motion.span>
  );
};

export default KineticText;
