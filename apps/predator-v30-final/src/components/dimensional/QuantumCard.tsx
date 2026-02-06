/**
 * QuantumCard - Adaptive Multi-State Component
 *
 * A revolutionary component that exists in multiple states simultaneously
 * but renders different versions based on the observer's (user's) role.
 *
 * Concept: Quantum superposition of UI states
 *
 * Usage:
 * <QuantumCard data={companyData}>
 *   <ExplorerView>Simple friendly cards</ExplorerView>
 *   <OperatorView>Detailed metrics and charts</OperatorView>
 *   <CommanderView>Raw data + edit controls</CommanderView>
 * </QuantumCard>
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useDimensionalContext, Dimension } from '../../hooks/useDimensionalContext';
import { UserRole } from '../../config/roles';

interface QuantumCardProps {
  children: ReactNode;
  className?: string;
  data?: any; // Optional data context for the card
  onCollapse?: () => void;
}

interface DimensionViewProps {
  children: ReactNode;
  className?: string;
}

/**
 * Container для різних views
 */
const DimensionViewContext = React.createContext<Dimension>('NEBULA');

/**
 * Main QuantumCard component
 */
export const QuantumCard: React.FC<QuantumCardProps> = ({
  children,
  className = '',
  data,
  onCollapse,
}) => {
  const { dimension, informationDensity } = useDimensionalContext();

  // Animate based on information density
  const cardVariant = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <DimensionViewContext.Provider value={dimension}>
      <motion.div
        initial="initial"
        animate="animate"
        variants={cardVariant}
        className={`quantum-card dimension-${dimension.toLowerCase()} ${className}`}
        style={{
          '--info-density': informationDensity,
        } as React.CSSProperties}
      >
        {children}
      </motion.div>
    </DimensionViewContext.Provider>
  );
};

/**
 * Explorer View - Simplified, user-friendly
 */
export const ExplorerView: React.FC<DimensionViewProps> = ({ children, className = '' }) => {
  const dimension = React.useContext(DimensionViewContext);
  const { isExplorer } = useDimensionalContext();

  if (!isExplorer) return null;

  return (
    <div className={`explorer-view ${className}`}>
      {children}
    </div>
  );
};

/**
 * Operator View - Detailed tactical information
 */
export const OperatorView: React.FC<DimensionViewProps> = ({ children, className = '' }) => {
  const dimension = React.useContext(DimensionViewContext);
  const { isOperator } = useDimensionalContext();

  if (!isOperator) return null;

  return (
    <div className={`operator-view ${className}`}>
      {children}
    </div>
  );
};

/**
 * Commander View - Full access with controls
 */
export const CommanderView: React.FC<DimensionViewProps> = ({ children, className = '' }) => {
  const dimension = React.useContext(DimensionViewContext);
  const { isCommander } = useDimensionalContext();

  if (!isCommander) return null;

  return (
    <div className={`commander-view ${className}`}>
      {children}
    </div>
  );
};

/**
 * Fallback View - Renders for all roles if specific views aren't provided
 */
export const UniversalView: React.FC<DimensionViewProps> = ({ children, className = '' }) => {
  return (
    <div className={`universal-view ${className}`}>
      {children}
    </div>
  );
};

/**
 * Conditional View - Render only if condition is met
 */
export const ConditionalView: React.FC<{
  condition: (context: { dimension: Dimension; role: UserRole }) => boolean;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}> = ({ condition, children, fallback, className = '' }) => {
  const { dimension, role } = useDimensionalContext();

  const shouldRender = condition({ dimension, role });

  if (!shouldRender) {
    return fallback ? <>{fallback}</> : null;
  }

  return <div className={className}>{children}</div>;
};

/**
 * Progressive Reveal - Show content based on minimum role
 */
export const ProgressiveReveal: React.FC<{
  minRole: UserRole;
  children: ReactNode;
  placeholder?: ReactNode;
  className?: string;
}> = ({ minRole, children, placeholder, className = '' }) => {
  const { canAccessLevel } = useDimensionalContext();

  if (!canAccessLevel(minRole)) {
    return placeholder ? (
      <div className={`opacity-50 ${className}`}>{placeholder}</div>
    ) : null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Information Tier - Different content tiers based on role hierarchy
 */
export const InformationTier: React.FC<{
  tier: 1 | 2 | 3; // 1=Explorer, 2=Operator, 3=Commander
  children: ReactNode;
  className?: string;
}> = ({ tier, children, className = '' }) => {
  const { role } = useDimensionalContext();

  const roleToTier: Record<UserRole, number> = {
    [UserRole.CLIENT_BASIC]: 1,
    [UserRole.CLIENT_PREMIUM]: 2,
    [UserRole.ADMIN]: 3,
  };

  const currentTier = roleToTier[role];

  if (currentTier < tier) return null;

  return <div className={`tier-${tier} ${className}`}>{children}</div>;
};

// Export all components
export default QuantumCard;
