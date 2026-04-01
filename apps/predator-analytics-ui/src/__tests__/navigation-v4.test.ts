/**
 * Extended Navigation Tests for PREDATOR Analytics v4.0
 * 
 * Tests for the new 6-section navigation architecture
 * and role-based filtering
 */

import { describe, expect, it } from 'vitest';
import { 
  getVisibleNavigation, 
  getNavigationTotals, 
  getNavigationContext,
  navigationConfig 
} from '../config/navigation';

describe('Navigation Architecture v4.0', () => {
  describe('Section Structure', () => {
    it('має рівно 6 основних розділів плюс глобальний шар', () => {
      const sections = getVisibleNavigation('admin');
      const mainSections = sections.filter(section => !section.isGlobal);
      
      expect(mainSections).toHaveLength(6);
      expect(sections.some(section => section.isGlobal)).toBe(true);
    });

    it('глобальний шар містить 5 швидких дій', () => {
      const sections = getVisibleNavigation('admin');
      const globalSection = sections.find(section => section.isGlobal);
      
      expect(globalSection).toBeDefined();
      expect(globalSection?.items).toHaveLength(5);
      
      const itemIds = globalSection?.items.map(item => item.id);
      expect(itemIds).toContain('global-search');
      expect(itemIds).toContain('global-favorites');
      expect(itemIds).toContain('global-recent');
      expect(itemIds).toContain('global-ai-reco');
      expect(itemIds).toContain('global-assistant');
    });

    it('кожен основний розділ має унікальний акцент', () => {
      const sections = getVisibleNavigation('admin');
      const mainSections = sections.filter(section => !section.isGlobal);
      const accents = mainSections.map(section => section.accent);
      
      expect(new Set(accents)).toHaveLength(new Set(accents).size);
      expect(accents).toContain('amber'); // Командний центр
      expect(accents).toContain('emerald'); // Розвідка
      expect(accents).toContain('cyan'); // Торгівля та логістика
      expect(accents).toContain('rose'); // Контрагенти
      expect(accents).toContain('indigo'); // AI та автоматизація
      expect(accents).toContain('sky'); // Система
    });
  });

  describe('Business Role Filtering', () => {
    it('business роль бачить тільки бізнес-орієнтовані розділи', () => {
      const sections = getVisibleNavigation('business');
      const sectionIds = sections.map(section => section.id);
      
      // Має бачити основні бізнес-розділи
      expect(sectionIds).toContain('command-center');
      expect(sectionIds).toContain('intelligence');
      expect(sectionIds).toContain('trade-logistics');
      expect(sectionIds).toContain('clients');
      
      // Системний розділ лишається доступним частково через налаштування та білінг
      expect(sectionIds).toContain('system');
      
      // Глобальний шар завжди видимий
      expect(sectionIds).toContain('global-layer');
    });

    it('supply_chain роль має фокус на торгівлі та контрагентах', () => {
      const sections = getVisibleNavigation('supply_chain');
      const sectionIds = sections.map(section => section.id);
      
      expect(sectionIds).toContain('trade-logistics');
      expect(sectionIds).toContain('clients');
      expect(sectionIds).toContain('command-center');
      expect(sectionIds).toContain('global-layer');
    });

    it('admin роль бачить всі розділи', () => {
      const sections = getVisibleNavigation('admin');
      const sectionIds = sections.map(section => section.id);
      
      expect(sectionIds).toContain('command-center');
      expect(sectionIds).toContain('intelligence');
      expect(sectionIds).toContain('trade-logistics');
      expect(sectionIds).toContain('clients');
      expect(sectionIds).toContain('ai-autonomy');
      expect(sectionIds).toContain('system');
      expect(sectionIds).toContain('global-layer');
    });

    it('analyst роль має доступ до розвідки та аналітики', () => {
      const sections = getVisibleNavigation('analyst');
      const sectionIds = sections.map(section => section.id);
      
      expect(sectionIds).toContain('intelligence');
      expect(sectionIds).toContain('command-center');
      expect(sectionIds).toContain('global-layer');
      
      // Має доступ до OSINT інструментів
      const intelligenceSection = sections.find(s => s.id === 'intelligence');
      const osintGroup = intelligenceSection?.groups?.find(g => g.id === 'osint-investigation');
      expect(osintGroup).toBeDefined();
    });
  });

  describe('Navigation Context', () => {
    it('правильно визначає контекст для головної сторінки', () => {
      const context = getNavigationContext('/', 'admin');
      
      expect(context.item).toBeDefined();
      expect(context.item?.id).toBe('dashboard');
      expect(context.section?.id).toBe('command-center');
    });

    it('правильно визначає контекст для сторінки розвідки', () => {
      const context = getNavigationContext('/intelligence', 'admin');
      
      expect(context.item).toBeDefined();
      expect(context.item?.id).toBe('intelligence');
      expect(context.section?.id).toBe('intelligence');
    });

    it('повертає null для невідомих шляхів', () => {
      const context = getNavigationContext('/unknown-path', 'admin');
      
      expect(context.item).toBeNull();
      expect(context.section).toBeNull();
    });

    it('працює з matchPaths для динамічних маршрутів', () => {
      const context = getNavigationContext('/company/12345', 'admin');
      
      expect(context.item).toBeDefined();
      expect(context.item?.id).toBe('diligence');
      expect(context.section?.id).toContain('intelligence');
    });
  });

  describe('Navigation Totals', () => {
    it('правильно рахує загальну кількість елементів', () => {
      const totals = getNavigationTotals('admin');
      
      expect(totals.sections).toBeGreaterThan(0);
      expect(totals.items).toBeGreaterThan(totals.sections);
    });

    it('різні ролі мають різну кількість доступних елементів', () => {
      const adminTotals = getNavigationTotals('admin');
      const businessTotals = getNavigationTotals('business');
      
      expect(adminTotals.items).toBeGreaterThan(businessTotals.items);
      expect(adminTotals.sections).toBeGreaterThanOrEqual(businessTotals.sections);
    });
  });

  describe('Command Center Structure', () => {
    it('має всі ключові елементи командного центру', () => {
      const sections = getVisibleNavigation('admin');
      const commandCenter = sections.find(section => section.id === 'command-center');
      
      expect(commandCenter).toBeDefined();
      expect(commandCenter?.items).toHaveLength(6);
      
      const itemIds = commandCenter?.items.map(item => item.id);
      expect(itemIds).toContain('dashboard');
      expect(itemIds).toContain('overview');
      expect(itemIds).toContain('omni');
      expect(itemIds).toContain('monitoring');
      expect(itemIds).toContain('morning-brief');
      expect(itemIds).toContain('newspaper');
    });
  });

  describe('Intelligence Groups', () => {
    it('розділ розвідки має правильну структуру груп', () => {
      const sections = getVisibleNavigation('admin');
      const intelligence = sections.find(section => section.id === 'intelligence');
      
      expect(intelligence?.groups).toBeDefined();
      expect(intelligence?.groups).toHaveLength(4);
      
      const groupIds = intelligence?.groups?.map(group => group.id);
      expect(groupIds).toContain('markets-strategy');
      expect(groupIds).toContain('risk-compliance');
      expect(groupIds).toContain('osint-investigation');
      expect(groupIds).toContain('modeling');
    });

    it('OSINT група фільтрується за ролями', () => {
      const adminSections = getVisibleNavigation('admin');
      const businessSections = getVisibleNavigation('business');
      
      const adminIntelligence = adminSections.find(s => s.id === 'intelligence');
      const businessIntelligence = businessSections.find(s => s.id === 'intelligence');
      
      const adminOsintGroup = adminIntelligence?.groups?.find(g => g.id === 'osint-investigation');
      const businessOsintGroup = businessIntelligence?.groups?.find(g => g.id === 'osint-investigation');
      
      expect(adminOsintGroup).toBeDefined();
      expect(businessOsintGroup).toBeUndefined();
    });
  });

  describe('AI Autonomy Section', () => {
    it('має правильну структуру AI компонентів', () => {
      const sections = getVisibleNavigation('admin', 'enterprise');
      const aiSection = sections.find(section => section.id === 'ai-autonomy');
      
      expect(aiSection).toBeDefined();
      expect(aiSection?.items).toHaveLength(8);
      
      const itemIds = aiSection?.items.map(item => item.id);
      expect(itemIds).toContain('agents');
      expect(itemIds).toContain('ai-insights');
      expect(itemIds).toContain('knowledge');
      expect(itemIds).toContain('llm');
      expect(itemIds).toContain('engines');
      expect(itemIds).toContain('training');
      expect(itemIds).toContain('super');
      expect(itemIds).toContain('ai-control');
    });

    it('LLM та інженерні інструменти фільтруються для не-адмінів', () => {
      const sections = getVisibleNavigation('business', 'enterprise');
      const aiSection = sections.find(section => section.id === 'ai-autonomy');
      
      expect(aiSection).toBeDefined();
      
      const itemIds = aiSection?.items.map(item => item.id);
      expect(itemIds).toContain('agents');
      expect(itemIds).toContain('ai-insights');
      expect(itemIds).toContain('knowledge');
      
      // Не має бачити інженерні інструменти
      expect(itemIds).not.toContain('llm');
      expect(itemIds).not.toContain('engines');
      expect(itemIds).not.toContain('training');
    });
  });

  describe('System Section', () => {
    it('має всі системні інструменти', () => {
      const sections = getVisibleNavigation('admin', 'enterprise');
      const systemSection = sections.find(section => section.id === 'system');
      
      expect(systemSection).toBeDefined();
      expect(systemSection?.items).toHaveLength(10);
      
      const itemIds = systemSection?.items.map(item => item.id);
      expect(itemIds).toContain('security');
      expect(itemIds).toContain('compliance');
      expect(itemIds).toContain('settings');
      expect(itemIds).toContain('deployment');
      expect(itemIds).toContain('governance');
      expect(itemIds).toContain('system-factory');
      expect(itemIds).toContain('ingestion');
      expect(itemIds).toContain('data');
      expect(itemIds).toContain('reports');
    });

    it('неадміністративні ролі бачать лише безпечну бізнес-частину системного розділу', () => {
      const businessSections = getVisibleNavigation('business', 'basic');
      const analystSections = getVisibleNavigation('analyst', 'basic');
      
      const businessSystem = businessSections.find(s => s.id === 'system');
      const analystSystem = analystSections.find(s => s.id === 'system');
      
      expect(businessSystem).toBeDefined();
      expect(analystSystem).toBeDefined();
      expect(businessSystem?.items.map((item) => item.id)).toEqual(expect.arrayContaining(['settings', 'billing', 'reports']));
      expect(analystSystem?.items.map((item) => item.id)).toEqual(expect.arrayContaining(['settings', 'billing', 'reports']));
    });
  });

  describe('Navigation Configuration Integrity', () => {
    it('всі елементи мають обов\'язкові поля', () => {
      navigationConfig.forEach(section => {
        expect(section.id).toBeDefined();
        expect(section.label).toBeDefined();
        expect(section.description).toBeDefined();
        expect(section.accent).toBeDefined();
        expect(Array.isArray(section.items)).toBe(true);
        
        section.items.forEach(item => {
          expect(item.id).toBeDefined();
          expect(item.label).toBeDefined();
          expect(item.path).toBeDefined();
          expect(item.icon).toBeDefined();
          expect(item.description).toBeDefined();
        });
      });
    });

    it('всі шляхи унікальні', () => {
      const allPaths = new Set<string>();
      
      navigationConfig.forEach(section => {
        section.items.forEach(item => {
          expect(allPaths.has(item.path)).toBe(false);
          allPaths.add(item.path);
        });
        
        section.groups?.forEach(group => {
          group.items.forEach(item => {
            expect(allPaths.has(item.path)).toBe(false);
            allPaths.add(item.path);
          });
        });
      });
    });
  });
});
