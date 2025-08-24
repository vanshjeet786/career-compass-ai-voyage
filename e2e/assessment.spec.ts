import { test, expect } from '@playwright/test'

test.describe('Career Assessment E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete assessment journey', async ({ page }) => {
    // Start assessment
    await page.click('text=Start Assessment')
    
    // Should redirect to auth if not logged in
    await expect(page).toHaveURL(/\/auth/)
    
    // Mock successful login (in real test, would use test user)
    await page.fill('[placeholder*="email"]', 'test@example.com')
    await page.fill('[placeholder*="password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    
    // Should redirect to assessment
    await expect(page).toHaveURL(/\/assess/)
    
    // Complete Layer 1 questions
    await expect(page.locator('h2')).toContainText('Layer 1')
    
    // Answer a few questions
    const firstQuestion = page.locator('.space-y-6').first()
    await firstQuestion.locator('input[value="Agree"]').check()
    
    // Go to next layer
    await page.click('button:has-text("Next")')
    
    // Should be on Layer 2
    await expect(page.locator('h2')).toContainText('Layer 2')
  })

  test('should handle AI assistance', async ({ page }) => {
    // Navigate to assessment (assuming user is logged in)
    await page.goto('/assess')
    
    // Wait for questions to load
    await page.waitForSelector('.space-y-6')
    
    // Click AI explain button
    await page.click('button:has-text("AI Explain")')
    
    // Should show AI response
    await expect(page.locator('.ai-response')).toBeVisible()
  })

  test('should export PDF results', async ({ page }) => {
    // Navigate to results page (assuming assessment is complete)
    await page.goto('/results?assess=test-id')
    
    // Wait for results to load
    await page.waitForSelector('.recharts-wrapper')
    
    // Click export PDF button
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Download PDF")')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('career-assessment-results.pdf')
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/assess')
    
    // Check mobile layout
    const container = page.locator('.container')
    await expect(container).toHaveCSS('padding-left', '16px')
    await expect(container).toHaveCSS('padding-right', '16px')
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/functions/v1/gemini-assist', route => {
      route.abort('internetdisconnected')
    })
    
    await page.goto('/assess')
    
    // Try to use AI assistance
    await page.click('button:has-text("AI Explain")')
    
    // Should show error message
    await expect(page.locator('text=Error')).toBeVisible()
  })

  test('should track analytics events', async ({ page }) => {
    // Listen for analytics calls
    const analyticsEvents: string[] = []
    
    page.on('console', msg => {
      if (msg.text().includes('📊 Analytics:')) {
        analyticsEvents.push(msg.text())
      }
    })
    
    await page.goto('/assess')
    
    // Should track page view
    expect(analyticsEvents.some(event => event.includes('assessment_started'))).toBeTruthy()
  })
})