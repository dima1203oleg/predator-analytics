import { describe, expect, it } from 'vitest';
import {
  getRecommendedNavigation,
  getVisibleNavigation,
  resolveNavigationAudience,
} from '../navigation';

describe('navigation', () => {
  it('зводить навігацію до семи верхніх бізнес-блоків і будує вкладені групи', () => {
    const sections = getVisibleNavigation('admin');

    expect(sections).toHaveLength(7);
    expect(sections.map((section) => section.label)).toEqual([
      'КОМАНДНИЙ ЦЕНТ ',
      'РОЗВІДКА КОНТ АГЕНТІВ',
      'ФІНАНСОВА РОЗВІДКА',
      'ЛАНЦЮГИ ПОСТАЧАННЯ',
      'БІЗНЕС-МОЖЛИВОСТІ',
      'ШІ-ЛАБО АТО ІЯ',
      'МІСІЯ-КОНТ ОЛЬ',
    ]);
    expect(sections[0]?.groups?.map((group) => group.title)).toContain('Оперативний огляд');
    expect(sections[1]?.groups?.map((group) => group.title)).toContain('OSINT та розслідування');
  });

  it('ховає адміністративні модулі від бізнес-ролей', () => {
    const businessSections = getVisibleNavigation('client_basic');
    const businessItems = businessSections.flatMap((section) => (section.items || []).map((item) => item.label));

    expect(businessItems).not.toContain('Фабрика');
    expect(businessItems).not.toContain('Суверенне врядування');
    expect(businessItems).not.toContain('Пайплайни');
    expect(businessItems).toContain('ШІ-агенти');
    expect(businessItems).toContain('ШІ-інсайти');
  });

  it('звужує керівний режим і залишає графи аналітику', () => {
    const executiveItems = getVisibleNavigation('client_basic').flatMap((section) => (section.items || []).map((item) => item.label));
    const analystItems = getVisibleNavigation('client_premium').flatMap((section) => (section.items || []).map((item) => item.label));

    expect(executiveItems).not.toContain('Граф звʼязків');
    expect(executiveItems).not.toContain('Граф сутностей');
    expect(analystItems).toContain('Граф звʼязків');
    expect(analystItems).toContain('Граф сутностей');
  });

  it('дає рекомендації з найвищим пріоритетом', () => {
    const recommended = getRecommendedNavigation('client_premium', 4);

    expect(recommended).toHaveLength(4);
    expect(recommended[0]?.label).toBe('Панель управління');
    expect(recommended.map((item) => item.label)).toEqual([
      'Панель управління',
      'Предиктивний Нексус',
      'P&L  изиків Портфелю',
      'SWIFT/SEPA Монітор',
    ]);
  });

  it('мапить майбутні ролі на бізнес-аудиторії', () => {
    expect(resolveNavigationAudience('ceo')).toBe('business');
    expect(resolveNavigationAudience('analyst')).toBe('analyst');
    expect(resolveNavigationAudience('supply_chain')).toBe('supply_chain');
  });
});
