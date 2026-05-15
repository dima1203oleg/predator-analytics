import { UserRole, ROLE_CAPABILITIES, RoleCapabilities } from '@/config/roles';

/**
 * PREDATOR ELITE Data Masking Engine v2.0
 * 
 * Centralized logic for applying data masking rules based on User Role capabilities.
 */

// 1. Financial Data Masking
export const maskFinancialValue = (value: number, precision: RoleCapabilities['financialPrecision']): string => {
  if (precision === 'transactional' || precision === 'exact') {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value);
  }
  
  // 'range' logic (Terminal level)
  if (value < 1000000) return '< 1M UAH';
  if (value < 10000000) return '1M - 10M UAH';
  if (value < 50000000) return '10M - 50M UAH';
  if (value < 100000000) return '50M - 100M UAH';
  return '> 100M UAH';
};

// 2. Identifier Masking (EDRPOU, INN, etc.)
export const maskIdentifier = (identifier: string, maskingLevel: RoleCapabilities['identifierMasking']): string => {
  if (!identifier) return '';
  
  if (maskingLevel === 'international' || maskingLevel === 'full') {
    return identifier; // Sovereign, Core, Pro see full EDRPOU
  }
  
  // 'partial' logic (Terminal level) - Show first 4 chars, mask rest
  if (identifier.length <= 4) return identifier;
  return `${identifier.substring(0, 4)}${'*'.repeat(identifier.length - 4)}`;
};

// 3. Personal Data Masking (Names, Beneficiaries)
export const maskPersonalData = (name: string, accessLevel: RoleCapabilities['personalDataAccess']): string => {
  if (!name) return '';
  
  if (accessLevel === 'deanonymized' || accessLevel === 'full') {
    return name;
  }
  
  // 'masked' logic (Terminal level) - Show first letter of each word
  return name.split(' ').map(word => {
    if (word.length <= 1) return word;
    return `${word[0]}${'*'.repeat(word.length - 1)}`;
  }).join(' ');
};

// 4. Utility for direct role checking
export const maskDataByRole = (
  role: UserRole, 
  data: { type: 'finance' | 'identifier' | 'person', value: any }
): string => {
  const capabilities = ROLE_CAPABILITIES[role] || ROLE_CAPABILITIES[UserRole.TERMINAL];
  
  switch (data.type) {
    case 'finance':
      return maskFinancialValue(Number(data.value), capabilities.financialPrecision);
    case 'identifier':
      return maskIdentifier(String(data.value), capabilities.identifierMasking);
    case 'person':
      return maskPersonalData(String(data.value), capabilities.personalDataAccess);
    default:
      return String(data.value);
  }
};
