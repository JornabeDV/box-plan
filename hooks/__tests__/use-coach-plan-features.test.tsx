import { renderHook, waitFor } from '@testing-library/react'
import { useCoachPlanFeatures } from '../use-coach-plan-features'
import { server } from '../../__mocks__/server'
import { rest } from 'msw'
import { createMockSession } from '../../__tests__/fixtures/test-data'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: createMockSession(),
    status: 'authenticated',
    update: jest.fn(),
  })),
}))

describe('useCoachPlanFeatures', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should load plan features successfully', async () => {
    const mockPlanData = {
      planInfo: {
        planId: 1,
        planName: 'pro',
        displayName: 'Plan Pro',
        features: {
          dashboard_custom: true,
          weekly_planification: true,
          planification_access: 'weekly',
          score_loading: true,
          score_database: true,
          mercadopago_connection: true,
          whatsapp_integration: true,
          max_disciplines: 999999,
        },
        maxStudents: 999999,
        commissionRate: 20,
        isActive: true,
        isTrial: false
      }
    }

    server.use(
      rest.get('/api/coaches/plan-features', (req, res, ctx) => {
        return res(ctx.json(mockPlanData))
      })
    )

    const { result } = renderHook(() => useCoachPlanFeatures())

    // Initially loading
    expect(result.current.loading).toBe(true)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.planInfo).toEqual(mockPlanData.planInfo)
    expect(result.current.hasFeature('dashboard_custom')).toBe(true)
    expect(result.current.hasFeature('score_loading')).toBe(true)
    expect(result.current.canUseMercadoPago).toBe(true)
    expect(result.current.canUseWhatsApp).toBe(true)
    expect(result.current.maxDisciplines).toBe(999999)
  })

  it('should use cached data when available', async () => {
    const mockPlanData = {
      planInfo: {
        planId: 1,
        planName: 'basic',
        displayName: 'Plan Básico',
        features: {
          dashboard_custom: true,
          weekly_planification: true,
          planification_access: 'weekly',
          score_loading: false,
          max_disciplines: 5,
        },
        maxStudents: 25,
        commissionRate: 15,
        isActive: true,
        isTrial: false
      }
    }

    // Pre-populate cache
    localStorage.setItem('plan_features_1', JSON.stringify({
      planInfo: mockPlanData.planInfo,
      timestamp: Date.now()
    }))

    let apiCallCount = 0

    server.use(
      rest.get('/api/coaches/plan-features', (req, res, ctx) => {
        apiCallCount++
        return res(ctx.json(mockPlanData))
      })
    )

    const { result } = renderHook(() => useCoachPlanFeatures())

    // Should load from cache immediately
    expect(result.current.loading).toBe(false)
    expect(result.current.planInfo).toEqual(mockPlanData.planInfo)
    expect(apiCallCount).toBe(0) // Should not call API
  })

  it('should refetch when cache is stale', async () => {
    const mockPlanData = {
      planInfo: {
        planId: 1,
        planName: 'basic',
        displayName: 'Plan Básico',
        features: {
          dashboard_custom: true,
          weekly_planification: true,
          planification_access: 'weekly',
          score_loading: false,
          max_disciplines: 5,
        },
        maxStudents: 25,
        commissionRate: 15,
        isActive: true,
        isTrial: false
      }
    }

    // Pre-populate cache with old timestamp
    const oldTimestamp = Date.now() - (6 * 60 * 1000) // 6 minutes ago (cache duration is 5 minutes)
    localStorage.setItem('plan_features_1', JSON.stringify({
      planInfo: mockPlanData.planInfo,
      timestamp: oldTimestamp
    }))

    server.use(
      rest.get('/api/coaches/plan-features', (req, res, ctx) => {
        return res(ctx.json(mockPlanData))
      })
    )

    const { result } = renderHook(() => useCoachPlanFeatures())

    // Initially loading (should refetch)
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.planInfo).toEqual(mockPlanData.planInfo)
  })

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/coaches/plan-features', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    const { result } = renderHook(() => useCoachPlanFeatures())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.planInfo).toBeNull()
    expect(result.current.error).toBe('Error al obtener información del plan')
  })

  it('should handle network errors', async () => {
    server.use(
      rest.get('/api/coaches/plan-features', (req, res) => {
        return res.networkError('Failed to connect')
      })
    )

    const { result } = renderHook(() => useCoachPlanFeatures())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.planInfo).toBeNull()
    expect(result.current.error).toBeDefined()
  })

  it('should refetch when called manually', async () => {
    const mockPlanData = {
      planInfo: {
        planId: 1,
        planName: 'basic',
        displayName: 'Plan Básico',
        features: {
          dashboard_custom: true,
          weekly_planification: true,
          planification_access: 'weekly',
          score_loading: false,
          max_disciplines: 5,
        },
        maxStudents: 25,
        commissionRate: 15,
        isActive: true,
        isTrial: false
      }
    }

    server.use(
      rest.get('/api/coaches/plan-features', (req, res, ctx) => {
        return res(ctx.json(mockPlanData))
      })
    )

    const { result } = renderHook(() => useCoachPlanFeatures())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.planInfo).toBeDefined()

    // Clear cache and refetch
    localStorage.removeItem('plan_features_1')

    await result.current.refetch()

    expect(result.current.planInfo).toEqual(mockPlanData.planInfo)
  })

  it('should calculate derived values correctly', async () => {
    const mockPlanData = {
      planInfo: {
        planId: 1,
        planName: 'elite',
        displayName: 'Plan Elite',
        features: {
          dashboard_custom: true,
          planification_access: 'monthly',
          planification_monthly: true,
          planification_unlimited: false,
          score_loading: true,
          score_database: true,
          mercadopago_connection: true,
          whatsapp_integration: true,
          max_disciplines: 999999,
          planification_weeks: 4,
        },
        maxStudents: 100,
        commissionRate: 25,
        isActive: true,
        isTrial: false
      }
    }

    server.use(
      rest.get('/api/coaches/plan-features', (req, res, ctx) => {
        return res(ctx.json(mockPlanData))
      })
    )

    const { result } = renderHook(() => useCoachPlanFeatures())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Test derived values
    expect(result.current.canLoadMonthlyPlanifications).toBe(true)
    expect(result.current.canLoadUnlimitedPlanifications).toBe(false)
    expect(result.current.planificationWeeks).toBe(4)
    expect(result.current.canUseMercadoPago).toBe(true)
    expect(result.current.canUseWhatsApp).toBe(true)
    expect(result.current.canLoadScores).toBe(true)
    expect(result.current.canAccessScoreDatabase).toBe(true)
    expect(result.current.maxDisciplines).toBe(999999)
  })
})
