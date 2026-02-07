import { renderHook, waitFor } from '@testing-library/react'
import { useAuthWithRoles } from '../use-auth-with-roles'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('next-auth', () => ({
  signOut: jest.fn(),
}))

import { useSession } from 'next-auth/react'

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Helper function to create mock session
const createMockSession = (userOverrides = {}) => ({
  user: {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    ...userOverrides
  },
  expires: '2024-12-31T23:59:59.999Z'
})

describe('useAuthWithRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should return loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuthWithRoles())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.userRole).toBeNull()
    expect(result.current.adminProfile).toBeNull()
    expect(result.current.coachProfile).toBeNull()
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isCoach).toBe(false)
    expect(result.current.isStudent).toBe(false)
  })

  it('should handle unauthenticated state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuthWithRoles())

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.userRole).toBeNull()
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isCoach).toBe(false)
    expect(result.current.isUser).toBe(false)
    expect(result.current.isStudent).toBe(false)
  })

  it('should load coach role and profile for authenticated coach user', async () => {
    const mockSession = createMockSession({ role: 'coach' })

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    // Mock the API response for user role
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        role: {
          id: '1',
          user_id: '1',
          role: 'coach',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        coachProfile: {
          id: 1,
          userId: 1,
          businessName: 'Test Gym',
          phone: '+1234567890',
          address: '123 Test St',
          maxStudents: 50,
          currentStudentCount: 10,
          commissionRate: 15,
          totalEarnings: 1500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    })

    const { result } = renderHook(() => useAuthWithRoles())

    // Initially loading
    expect(result.current.loading).toBe(true)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockSession.user)
    expect(result.current.userRole?.role).toBe('coach')
    expect(result.current.isCoach).toBe(true)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.coachProfile?.businessName).toBe('Test Gym')
    expect(result.current.adminProfile).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    const mockSession = createMockSession()

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useAuthWithRoles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.userRole).toBeNull()
    expect(result.current.user).toEqual(mockSession.user)
    expect(result.current.adminProfile).toBeNull()
    expect(result.current.coachProfile).toBeNull()
  })

  it('should prevent duplicate API calls', async () => {
    const mockSession = createMockSession()

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        role: {
          id: '1',
          user_id: '1',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })
    })

    const { rerender, result } = renderHook(() => useAuthWithRoles())

    // Re-render multiple times with same session
    rerender()
    rerender()
    rerender()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should only call API once due to deduplication
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should handle session logout', async () => {
    // Start with authenticated session
    const mockSession = createMockSession()
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        role: {
          id: '1',
          user_id: '1',
          role: 'coach',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        coachProfile: {
          id: 1,
          userId: 1,
          businessName: 'Test Gym',
          phone: '+1234567890',
          address: '123 Test St',
          maxStudents: 50,
          currentStudentCount: 10,
          commissionRate: 15,
          totalEarnings: 1500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    })

    const { rerender, result } = renderHook(() => useAuthWithRoles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.userRole?.role).toBe('coach')
    expect(result.current.coachProfile).not.toBeNull()

    // Change session to null (logout)
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    rerender()

    await waitFor(() => {
      expect(result.current.userRole).toBeNull()
      expect(result.current.coachProfile).toBeNull()
      expect(result.current.adminProfile).toBeNull()
    })
  })
})