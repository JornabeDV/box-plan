// Test data fixtures for consistent testing

export const mockUsers = {
  admin: {
    id: 1,
    email: 'admin@test.com',
    name: 'Admin User',
    password: 'hashed_password_admin',
    phone: '+1234567890',
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  coach: {
    id: 2,
    email: 'coach@test.com',
    name: 'Coach User',
    password: 'hashed_password_coach',
    phone: '+1234567891',
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  student: {
    id: 3,
    email: 'student@test.com',
    name: 'Student User',
    password: 'hashed_password_student',
    phone: '+1234567892',
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export const mockUserRoles = {
  admin: {
    id: '1',
    userId: 1,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  coach: {
    id: '2',
    userId: 2,
    role: 'coach',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  student: {
    id: '3',
    userId: 3,
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export const mockCoachProfiles = {
  basic: {
    id: 1,
    userId: 2,
    businessName: 'Test Gym',
    phone: '+1234567891',
    address: '123 Test St',
    maxStudents: 50,
    currentStudentCount: 10,
    commissionRate: 15,
    totalEarnings: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export const mockSessions = {
  valid: {
    sessionToken: 'valid_session_token',
    userId: 1,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  expired: {
    sessionToken: 'expired_session_token',
    userId: 1,
    expires: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export const mockAccounts = {
  google: {
    id: '1',
    userId: 1,
    type: 'oauth',
    provider: 'google',
    providerAccountId: 'google_123',
    refresh_token: 'refresh_token',
    access_token: 'access_token',
    expires_at: Date.now() + 3600,
    token_type: 'Bearer',
    scope: 'email profile',
    id_token: 'id_token',
    session_state: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// Helper functions to create test data
export const createTestUser = (overrides = {}) => ({
  ...mockUsers.student,
  ...overrides
})

export const createTestCoach = (overrides = {}) => ({
  user: { ...mockUsers.coach, ...overrides.user },
  role: { ...mockUserRoles.coach, userId: overrides.user?.id || mockUsers.coach.id },
  profile: { ...mockCoachProfiles.basic, userId: overrides.user?.id || mockUsers.coach.id, ...overrides.profile }
})

export const createTestStudent = (overrides = {}) => ({
  user: { ...mockUsers.student, ...overrides.user },
  role: { ...mockUserRoles.student, userId: overrides.user?.id || mockUsers.student.id }
})
