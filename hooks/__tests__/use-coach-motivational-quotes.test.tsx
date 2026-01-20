import { renderHook, waitFor, act } from '@testing-library/react'
import { useCoachMotivationalQuotes } from '../use-coach-motivational-quotes'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useCoachMotivationalQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty quotes array when enabled is true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quotes: [] }),
    })

    const { result } = renderHook(() => useCoachMotivationalQuotes())

    expect(result.current.loading).toBe(true)
    expect(result.current.quotes).toEqual([])
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/students/coach-motivational-quotes')
    expect(result.current.quotes).toEqual([])
  })

  it('should handle API response with quotes', async () => {
    const mockQuotes = ['Frase 1', 'Frase 2', 'Frase 3']

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quotes: mockQuotes }),
    })

    const { result } = renderHook(() => useCoachMotivationalQuotes())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.quotes).toEqual(mockQuotes)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useCoachMotivationalQuotes())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.quotes).toEqual([])
    expect(result.current.error).toBe('Error al obtener frases motivacionales')
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCoachMotivationalQuotes())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.quotes).toEqual([])
    expect(result.current.error).toBe('Network error')
  })

  it('should call refetch function', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quotes: ['Test quote'] }),
    })

    const { result } = renderHook(() => useCoachMotivationalQuotes())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.quotes).toEqual(['Test quote'])

    // Call refetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quotes: ['New quote'] }),
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.quotes).toEqual(['New quote'])
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
