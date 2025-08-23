import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-primary')
      expect(result).toBe('px-4 py-2 bg-primary')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('px-4', isActive && 'bg-primary', 'py-2')
      expect(result).toBe('px-4 bg-primary py-2')
    })

    it('should handle Tailwind merge conflicts', () => {
      const result = cn('px-2 px-4', 'py-1 py-2')
      expect(result).toBe('px-4 py-2')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle undefined and null values', () => {
      const result = cn('px-4', null, undefined, 'py-2')
      expect(result).toBe('px-4 py-2')
    })
  })
})