import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'

// Mock session
const mockSession = {
  user: {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user'
  },
  expires: '2024-12-31T23:59:59.999Z'
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider session={mockSession}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Custom test utilities
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  ...overrides
})

export const createMockSession = (userOverrides = {}) => ({
  user: createMockUser(userOverrides),
  expires: '2024-12-31T23:59:59.999Z'
})

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))
