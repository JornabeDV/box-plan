import { GET } from '../route'

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userRole: {
      findFirst: jest.fn(),
    },
    adminProfile: {
      findUnique: jest.fn(),
    },
    coachProfile: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  normalizeUserId: jest.fn(),
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockNormalizeUserId = normalizeUserId as jest.MockedFunction<typeof normalizeUserId>

describe('/api/user-role', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    mockNormalizeUserId.mockReturnValue(null)

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(mockAuth).toHaveBeenCalled()
    expect(mockNormalizeUserId).toHaveBeenCalledWith(undefined)
  })

  it('should return role data for authenticated user with user role', async () => {
    const mockSession = {
      user: { id: '1', email: 'user@example.com' }
    }

    mockAuth.mockResolvedValue(mockSession)
    mockNormalizeUserId.mockReturnValue(1)

    const mockUserRole = {
      id: '1',
      userId: 1,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockPrisma.userRole.findFirst.mockResolvedValue(mockUserRole)

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.role).toEqual(mockUserRole)
    expect(data.adminProfile).toBeNull()
    expect(data.coachProfile).toBeNull()

    // Check cache headers
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate, proxy-revalidate')
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')

    expect(mockPrisma.userRole.findFirst).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { createdAt: 'desc' }
    })
  })

  it('should return role and admin profile for admin user', async () => {
    const mockSession = {
      user: { id: '2', email: 'admin@example.com' }
    }

    mockAuth.mockResolvedValue(mockSession)
    mockNormalizeUserId.mockReturnValue(2)

    const mockUserRole = {
      id: '2',
      userId: 2,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockAdminProfile = {
      id: '1',
      userId: 2,
      name: 'Admin User',
      email: 'admin@example.com',
      organization_name: 'Test Org',
      organization_type: 'fitness',
      bio: 'Admin bio',
      avatar_url: 'avatar.jpg',
      contact_phone: '+1234567890',
      contact_email: 'contact@test.com',
      website: 'test.com',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockPrisma.userRole.findFirst.mockResolvedValue(mockUserRole)
    mockPrisma.adminProfile.findUnique.mockResolvedValue(mockAdminProfile)
    mockPrisma.coachProfile.findUnique.mockResolvedValue(null) // Not called for admin

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.role).toEqual(mockUserRole)
    expect(data.adminProfile).toEqual(mockAdminProfile)
    expect(data.coachProfile).toBeNull()

    expect(mockPrisma.adminProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: 2 }
    })
    expect(mockPrisma.coachProfile.findUnique).not.toHaveBeenCalled()
  })

  it('should return role and coach profile for coach user', async () => {
    const mockSession = {
      user: { id: '3', email: 'coach@example.com' }
    }

    mockAuth.mockResolvedValue(mockSession)
    mockNormalizeUserId.mockReturnValue(3)

    const mockUserRole = {
      id: '3',
      userId: 3,
      role: 'coach',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockCoachProfile = {
      id: 1,
      userId: 3,
      businessName: 'Test Gym',
      phone: '+1234567890',
      address: '123 Test St',
      maxStudents: 50,
      currentStudentCount: 10,
      commissionRate: 15,
      totalEarnings: 1500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockPrisma.userRole.findFirst.mockResolvedValue(mockUserRole)
    mockPrisma.adminProfile.findUnique.mockResolvedValue(null) // Not called for coach
    mockPrisma.coachProfile.findUnique.mockResolvedValue(mockCoachProfile)

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.role).toEqual(mockUserRole)
    expect(data.adminProfile).toBeNull()
    expect(data.coachProfile).toEqual(mockCoachProfile)

    expect(mockPrisma.adminProfile.findUnique).not.toHaveBeenCalled()
    expect(mockPrisma.coachProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: 3 }
    })
  })

  it('should return role: null when no role found', async () => {
    const mockSession = {
      user: { id: '4', email: 'norole@example.com' }
    }

    mockAuth.mockResolvedValue(mockSession)
    mockNormalizeUserId.mockReturnValue(4)

    mockPrisma.userRole.findFirst.mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.role).toBeNull()
    expect(data.adminProfile).toBeUndefined()
    expect(data.coachProfile).toBeUndefined()

    expect(mockPrisma.adminProfile.findUnique).not.toHaveBeenCalled()
    expect(mockPrisma.coachProfile.findUnique).not.toHaveBeenCalled()
  })

  it('should handle auth session without user id', async () => {
    const mockSession = {
      user: { email: 'user@example.com' } // No id
    }

    mockAuth.mockResolvedValue(mockSession)
    mockNormalizeUserId.mockReturnValue(null)

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('should handle database errors during role lookup', async () => {
    const mockSession = {
      user: { id: '1', email: 'user@example.com' }
    }

    mockAuth.mockResolvedValue(mockSession)
    mockNormalizeUserId.mockReturnValue(1)

    mockPrisma.userRole.findFirst.mockRejectedValue(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Internal server error' })
  })

  it('should handle auth function errors', async () => {
    mockAuth.mockRejectedValue(new Error('Auth error'))

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Internal server error' })
  })

  it('should load profiles in parallel for different roles', async () => {
    const mockSession = {
      user: { id: '5', email: 'multi@example.com' }
    }

    mockAuth.mockResolvedValue(mockSession)
    mockNormalizeUserId.mockReturnValue(5)

    const mockUserRole = {
      id: '5',
      userId: 5,
      role: 'coach', // This will load coach profile
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockCoachProfile = {
      id: 1,
      userId: 5,
      businessName: 'Test Gym',
      phone: '+1234567890',
      address: '123 Test St',
      maxStudents: 50,
      currentStudentCount: 10,
      commissionRate: 15,
      totalEarnings: 1500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockPrisma.userRole.findFirst.mockResolvedValue(mockUserRole)
    mockPrisma.adminProfile.findUnique.mockResolvedValue(null)
    mockPrisma.coachProfile.findUnique.mockResolvedValue(mockCoachProfile)

    // Spy on Promise.all to verify parallel execution
    const promiseAllSpy = jest.spyOn(Promise, 'all')

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.role).toEqual(mockUserRole)
    expect(data.coachProfile).toEqual(mockCoachProfile)
    expect(data.adminProfile).toBeNull()

    // Verify Promise.all was called (indicating parallel loading)
    expect(promiseAllSpy).toHaveBeenCalled()
    expect(promiseAllSpy.mock.calls[0][0]).toHaveLength(2) // Two promises: admin and coach

    promiseAllSpy.mockRestore()
  })

  it('should get the most recent role when multiple roles exist', async () => {
    const mockSession = {
      user: { id: '6', email: 'multipleroles@example.com' }
    }

    mockAuth.mockResolvedValue(mockSession)
    mockNormalizeUserId.mockReturnValue(6)

    const mockUserRole = {
      id: '6',
      userId: 6,
      role: 'coach',
      createdAt: new Date('2024-01-02').toISOString(), // More recent
      updatedAt: new Date('2024-01-02').toISOString(),
    }

    mockPrisma.userRole.findFirst.mockResolvedValue(mockUserRole)

    const request = new Request('http://localhost:3000/api/user-role')
    const response = await GET(request)

    expect(response.status).toBe(200)

    expect(mockPrisma.userRole.findFirst).toHaveBeenCalledWith({
      where: { userId: 6 },
      orderBy: { createdAt: 'desc' } // Should order by most recent
    })
  })
})
