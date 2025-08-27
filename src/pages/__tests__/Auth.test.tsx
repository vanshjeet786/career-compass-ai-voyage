import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Auth from '../Auth'
import { supabase } from '@/integrations/supabase/client'

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Auth />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    )
  })

  it('should render login form by default', () => {
    expect(screen.getByRole('heading', { name: /career compass/i })).toBeInTheDocument()
    expect(screen.getByText(/log in to continue your assessment/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('should switch to signup mode', async () => {
    await userEvent.click(screen.getByText(/sign up/i))
    
    expect(screen.getByText(/create an account to start your journey/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should handle email/password login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: { id: '123' } as any, session: null },
      error: null,
    })
    
    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText(/••••••••/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

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
    
    await userEvent.click(screen.getByRole('button', { name: /google/i }))

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/'),
      },
    })
  })

  it('should display error messages', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' } as any,
    })
    
    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    // Wait for error to appear
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
  })
})