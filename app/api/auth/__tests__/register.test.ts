import { POST } from '../register/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register a new user successfully', async () => {
    // Mock successful database operations
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      phone: null,
      image: null,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [{
        id: 1,
        userId: 1,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }]
    })
    mockPrisma.userRole.create.mockResolvedValue({
      id: '1',
      userId: 1,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockBcrypt.hash.mockResolvedValue('hashed_password')

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Usuario creado exitosamente')
    expect(data.userId).toBeDefined()
    expect(typeof data.userId).toBe('number')
    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10) // Note: API uses salt rounds 10, not 12
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
        phone: null,
        roles: {
          create: {
            role: 'user'
          }
        }
      }
    })
  })

  it('should return 400 for missing email or password', async () => {
    const requestBody = {
      name: 'Test User',
      // Missing email and password
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email y contraseña son requeridos')
  })

  it('should return 409 for duplicate email', async () => {
    // Mock existing user
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'duplicate@example.com',
      name: 'Existing User',
      password: 'hashed_password',
      phone: null,
      image: null,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const requestBody = {
      name: 'Test User 2',
      email: 'duplicate@example.com',
      password: 'password456',
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('El email ya está registrado')
  })

  it('should handle database errors during user creation', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockBcrypt.hash.mockResolvedValue('hashed_password')
    mockPrisma.user.create.mockRejectedValue(new Error('Database error'))

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Error al crear la cuenta')
  })

  it('should handle malformed JSON', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('should handle bcrypt hashing errors', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockBcrypt.hash.mockRejectedValue(new Error('Hashing error'))

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Error al crear la cuenta')
  })

  it('should create user with phone number when provided', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      phone: '+1234567890',
      image: null,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [{
        id: 1,
        userId: 1,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }]
    })
    mockPrisma.userRole.create.mockResolvedValue({
      id: '1',
      userId: 1,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockBcrypt.hash.mockResolvedValue('hashed_password')

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '+1234567890',
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.userId).toBeDefined()
  })
})
