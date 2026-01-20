import { http, HttpResponse } from 'msw'

// Mock API handlers
const handlers = [
  // Auth API mocks
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      token: 'mock-jwt-token'
    })
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      user: {
        id: 2,
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user'
      },
      token: 'mock-jwt-token'
    })
  }),

  // User role API mock
  http.get('/api/user-role', () => {
    return HttpResponse.json({
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
  }),

  // Coach plan features API mock
  http.get('/api/coaches/plan-features', () => {
    return HttpResponse.json({
      planInfo: {
        planId: 1,
        planName: 'basic',
        displayName: 'Plan Básico',
        features: {
          dashboard_custom: true,
          daily_planification: true,
          score_loading: false,
          max_disciplines: 3
        },
        maxStudents: 10,
        commissionRate: 10,
        isActive: true,
        isTrial: false
      }
    })
  })
]

// Export handlers for setup in jest.setup.js
export { handlers }
