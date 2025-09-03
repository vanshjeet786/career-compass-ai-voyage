import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { supabase } from '@/integrations/supabase/client'

describe('useAuth', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
  })

  it('should handle auth state changes', async () => {
    const mockUser = { id: '123', email: 'test@example.com' } as any
    const mockSession = { user: mockUser, access_token: 'token' } as any
    
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    // Wait for auth state to update
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.user).toEqual(mockUser)
  })

  it('should handle auth errors', async () => {
    const mockError = { message: 'Auth error' } as any
    
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: mockError,
    })

    const { result } = renderHook(() => useAuth())

    // Wait for auth state to update
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.user).toBe(null)
  })
})