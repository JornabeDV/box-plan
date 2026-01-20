import { renderHook, waitFor, act } from '@testing-library/react'
import { useDashboardData } from '../use-dashboard-data'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useDashboardData', () => {
  const mockDashboardData = {
    disciplines: {
      disciplines: [
        { id: 1, name: 'Boxeo', description: 'Deporte de combate' },
        { id: 2, name: 'Kickboxing', description: 'Arte marcial' }
      ],
      levels: [
        { id: 1, disciplineId: 1, name: 'Principiante', difficulty: 1 },
        { id: 2, disciplineId: 1, name: 'Intermedio', difficulty: 2 }
      ]
    },
    planifications: [
      { id: 1, title: 'Plan Semanal', date: '2024-01-15' },
      { id: 2, title: 'Plan Mensual', date: '2024-01-20' }
    ],
    users: [
      { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
      { id: 2, name: 'María García', email: 'maria@example.com' }
    ],
    subscriptionPlans: [
      { id: 1, name: 'Plan Básico', price: 29.99 },
      { id: 2, name: 'Plan Premium', price: 49.99 }
    ],
    coachAccess: {
      hasAccess: true,
      isTrial: false,
      trialEndsAt: null,
      daysRemaining: 30,
      subscription: { id: 1, status: 'active' }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should return initial loading state when coachId is null', () => {
    const { result } = renderHook(() => useDashboardData(null))

    expect(result.current.loading).toBe(false) // No loading when no coachId
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.disciplines).toEqual([])
    expect(result.current.disciplineLevels).toEqual([])
    expect(result.current.planifications).toEqual([])
    expect(result.current.users).toEqual([])
    expect(result.current.subscriptionPlans).toEqual([])
    expect(result.current.coachAccess).toBeNull()
  })

  it('should load dashboard data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDashboardData
    })

    const { result } = renderHook(() => useDashboardData('coach-123'))

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockDashboardData)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/dashboard-data?coachId=coach-123',
      { cache: 'default', headers: undefined }
    )
  })

  it('should provide direct accessors for dashboard data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDashboardData
    })

    const { result } = renderHook(() => useDashboardData('coach-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.disciplines).toEqual(mockDashboardData.disciplines.disciplines)
    expect(result.current.disciplineLevels).toEqual(mockDashboardData.disciplines.levels)
    expect(result.current.planifications).toEqual(mockDashboardData.planifications)
    expect(result.current.users).toEqual(mockDashboardData.users)
    expect(result.current.subscriptionPlans).toEqual(mockDashboardData.subscriptionPlans)
    expect(result.current.coachAccess).toEqual(mockDashboardData.coachAccess)
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useDashboardData('coach-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Error al cargar datos del dashboard')
    expect(result.current.disciplines).toEqual([])
    expect(result.current.disciplineLevels).toEqual([])
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useDashboardData('coach-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Network error')
  })

  it('should prevent duplicate API calls for same coachId', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDashboardData
    })

    const { rerender, result } = renderHook(() => useDashboardData('coach-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Re-render with same coachId
    rerender()

    // Should only call API once
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should reload data when coachId changes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDashboardData
    })

    const { rerender, result } = renderHook(({ coachId }) => useDashboardData(coachId), {
      initialProps: { coachId: 'coach-123' }
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Change coachId
    rerender({ coachId: 'coach-456' })

    // Should call API again
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/admin/dashboard-data?coachId=coach-456',
      { cache: 'default', headers: undefined }
    )
  })

  it('should support forced refresh', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDashboardData
    })

    const { result } = renderHook(() => useDashboardData('coach-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Trigger refresh
    act(() => {
      result.current.refresh()
    })

    // Should call API again with no-cache headers
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/admin/dashboard-data?coachId=coach-123',
      {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      }
    )
  })

  it('should prevent multiple concurrent API calls', async () => {
    // Create a promise that doesn't resolve immediately
    let resolvePromise: (value: any) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(pendingPromise)

    const { result, rerender } = renderHook(() => useDashboardData('coach-123'))

    expect(result.current.loading).toBe(true)

    // Try to trigger another load while first is pending by re-rendering
    rerender()

    // Resolve the first call
    act(() => {
      resolvePromise!({
        ok: true,
        json: async () => mockDashboardData
      })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should only have called API once
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should reset data and error when coachId becomes null', () => {
    // Start with null coachId - should not make any API calls
    const { rerender, result } = renderHook(({ coachId }) => useDashboardData(coachId), {
      initialProps: { coachId: null }
    })

    // Should not be loading and no API calls made
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()

    // Change to valid coachId - should trigger API call
    rerender({ coachId: 'coach-123' })
    expect(result.current.loading).toBe(true)

    // Change back to null - should stop loading
    rerender({ coachId: null })
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should clear error state on successful reload', async () => {
    // First call fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // Second call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDashboardData
    })

    const { result } = renderHook(() => useDashboardData('coach-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Error al cargar datos del dashboard')

    // Trigger refresh
    act(() => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Error should be cleared
    expect(result.current.error).toBeNull()
    expect(result.current.data).toEqual(mockDashboardData)
  })

  it('should maintain data when refresh fails', async () => {
    // First call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDashboardData
    })

    // Refresh fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useDashboardData('coach-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockDashboardData)
    expect(result.current.error).toBeNull()

    // Trigger refresh
    act(() => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Data should be maintained, error should be set
    expect(result.current.data).toEqual(mockDashboardData)
    expect(result.current.error).toBe('Error al cargar datos del dashboard')
  })

  it('should handle empty response data gracefully', async () => {
    const emptyData = {
      disciplines: { disciplines: [], levels: [] },
      planifications: [],
      users: [],
      subscriptionPlans: [],
      coachAccess: {
        hasAccess: false,
        isTrial: false,
        trialEndsAt: null,
        daysRemaining: 0,
        subscription: null
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyData
    })

    const { result } = renderHook(() => useDashboardData('coach-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(emptyData)
    expect(result.current.disciplines).toEqual([])
    expect(result.current.disciplineLevels).toEqual([])
    expect(result.current.planifications).toEqual([])
    expect(result.current.users).toEqual([])
    expect(result.current.subscriptionPlans).toEqual([])
    expect(result.current.coachAccess).toEqual(emptyData.coachAccess)
  })
})
