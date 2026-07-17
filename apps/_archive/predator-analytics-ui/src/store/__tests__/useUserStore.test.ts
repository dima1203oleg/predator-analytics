import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore, SubscriptionTier } from '../useUserStore'
import { UserRole } from '../../config/roles'

describe('useUserStore', () => {
  beforeEach(() => {
    // Відновлюємо початковий стан перед кожним тестом
    useUserStore.setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      isClient: false,
    })
  })

  it('повинен ініціалізуватися з порожнім користувачем безпечно', () => {
    const state = useUserStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isAdmin).toBe(false)
    expect(state.isClient).toBe(false)
    expect(state.user).toBeNull()
  })

  it('повинен правильно встановлювати користувача (setUser)', () => {
    useUserStore.getState().setUser({
      id: '1', 
      name: 'Admin User', 
      email: 'admin@predator.ua', 
      role: UserRole.ADMIN, 
      tier: SubscriptionTier.ENTERPRISE,
      tenant_id: '1',
      tenant_name: 'test',
      last_login: '2026-01-01T00:00:00Z',
      data_sectors: []
    })
    
    const state = useUserStore.getState()
    expect(state.user?.name).toBe('Admin User')
    expect(state.isAuthenticated).toBe(true)
    expect(state.isAdmin).toBe(true)
    expect(state.isClient).toBe(false)
  })

  it('повинен очищати стан при виході (logout)', () => {
    // Спочатку логін
    useUserStore.getState().setUser({
      id: '1', name: 'Admin', email: 'a@p.ua', role: UserRole.ADMIN, tier: SubscriptionTier.FREE,
      tenant_id: '1', tenant_name: 't', last_login: '', data_sectors: []
    })
    
    // Перевіряємо що setUser працював
    expect(useUserStore.getState().isAuthenticated).toBe(true)
    
    // Потім логаут. Мокаємо window.location.href, так як logout робить redirect
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { ...originalLocation, href: '' };

    useUserStore.getState().logout()
    
    const state = useUserStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isAdmin).toBe(false);
    
    (window as any).location = originalLocation;
  })
})
