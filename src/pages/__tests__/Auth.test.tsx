import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Auth from '../Auth'
import { supabase } from '@/integrations/supabase/client'

// Helper to get screen queries
const screen = {
  getByRole: (role: string, options?: any) => document.querySelector(`[role="${role}"]${options?.name ? `[aria-label*="${options.name}"]` : ''}`) as HTMLElement,
  getByPlaceholderText: (text: RegExp | string) => document.querySelector(`[placeholder*="${typeof text === 'string' ? text : text.source}"]`) as HTMLElement,
  getByText: (text: RegExp | string) => document.querySelector(`*:contains("${typeof text === 'string' ? text : text.source}")`) as HTMLElement,
}

const renderAuth = () => {
  return render(
    <BrowserRouter>
      <Auth />
    </BrowserRouter>
  )
}

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form by default', () => {
    renderAuth()
    
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should switch to signup mode', async () => {
    renderAuth()
    
    await userEvent.click(screen.getByText(/create an account/i))
    
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should handle email/password login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: { id: '123' } as any, session: null },
      error: null,
    })

    renderAuth()
    
    await userEvent.type(screen.getByPlaceholderText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('should handle OAuth login', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://oauth.url' },
      error: null,
    })

    renderAuth()
    
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/assess'),
      },
    })
  })

  it('should display error messages', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' } as any,
    })

    renderAuth()
    
    await userEvent.type(screen.getByPlaceholderText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Wait for error to appear
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
  })
})