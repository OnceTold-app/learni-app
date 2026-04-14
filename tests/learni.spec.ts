import { test, expect } from '@playwright/test'

// Test credentials — use Lia's actual account
const TEST_PARENT_EMAIL = 'mo_olckers@outlook.com'
const TEST_CHILD_NAME = 'Lia'
const TEST_CHILD_PIN = '1960'
const CHILD_USERNAME = 'LULULEMON'

test.describe('Learni — Core Flow Tests', () => {

  // ─── 1. All pages load ───────────────────────────────────────────────────
  const PAGES = [
    '/', '/login', '/signup', '/dashboard', '/kid-hub',
    '/session', '/baseline', '/start-session', '/subscribe',
    '/terms', '/privacy', '/forgot-password', '/progress',
    '/kid-avatar', '/onboarding', '/kid-welcome', '/homework', '/admin',
  ]

  for (const path of PAGES) {
    test(`page loads: ${path}`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBeLessThan(400)
    })
  }

  // ─── 2. Landing page content ─────────────────────────────────────────────
  test('landing page shows Learni branding', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=learni')).toBeVisible()
    await expect(page.locator('text=Earn')).toBeVisible()
    // Should NOT show fake testimonials
    await expect(page.locator('text=Mum of Lia')).not.toBeVisible()
    await expect(page.locator('text=Sarah M.')).not.toBeVisible()
  })

  // ─── 3. Login page ───────────────────────────────────────────────────────
  test('login page has correct fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="text"], input[type="email"]')).toBeVisible()
    await expect(page.locator('text=Forgot password')).toBeVisible()
    await expect(page.locator('text=Sign up')).toBeVisible()
  })

  // ─── 4. Kid login flow ───────────────────────────────────────────────────
  test('kid can log in with username and PIN', async ({ page }) => {
    await page.goto('/login')
    // Type username
    const nameInput = page.locator('input').first()
    await nameInput.fill(CHILD_USERNAME)
    // Wait for PIN field to appear
    await page.waitForTimeout(500)
    const pinInput = page.locator('input').nth(1)
    await pinInput.fill(TEST_CHILD_PIN)
    await page.locator('button[type="submit"], button:has-text("Log in")').click()
    // Should redirect to kid-hub or kid-welcome
    await page.waitForURL(/\/(kid-hub|kid-welcome|kid-avatar)/, { timeout: 15000 })
    console.log('✅ Kid login successful, redirected to:', page.url())
  })

  // ─── 5. Session subject stays correct ────────────────────────────────────
  test('spelling session gives spelling questions (not maths)', async ({ page }) => {
    await page.goto('/login')
    // Log in as kid
    await page.locator('input').first().fill(CHILD_USERNAME)
    await page.waitForTimeout(300)
    await page.locator('input').nth(1).fill(TEST_CHILD_PIN)
    await page.locator('button[type="submit"], button:has-text("Log in")').click()
    await page.waitForURL(/\/(kid-hub|kid-welcome)/, { timeout: 15000 })

    // Go to activity chooser
    await page.goto('/start-session')
    await page.waitForTimeout(1000)

    // Click Grammar & Spelling tab
    const spellingTab = page.locator('button, div').filter({ hasText: /Grammar.*Spell|Spell.*Grammar/i }).first()
    await spellingTab.click()
    await page.waitForTimeout(500)

    // Click Spelling category
    const spellingBtn = page.locator('button').filter({ hasText: /^Spelling$/i }).first()
    await spellingBtn.click()
    await page.waitForTimeout(500)

    // Click Common words option
    const commonWords = page.locator('button').filter({ hasText: /Common words/i }).first()
    await commonWords.click()

    // Wait for session to load
    await page.waitForURL('/session', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Check what subject is stored
    const subject = await page.evaluate(() => localStorage.getItem('learni_subject'))
    console.log('Subject in localStorage:', subject)
    expect(subject).toContain('Spelling')
    expect(subject).not.toBe('Maths')

    // Wait for Earni's first message
    await page.waitForTimeout(5000)

    // Check Earni isn't asking maths questions
    const earniText = await page.locator('text').allTextContents()
    const fullText = earniText.join(' ').toLowerCase()
    console.log('Session content sample:', fullText.slice(0, 200))

    // Should NOT contain maths-specific content in early exchanges
    const mathsKeywords = ['times table', 'multiply', '× ', 'add these', 'subtract', 'what is 7']
    const hasMaths = mathsKeywords.some(k => fullText.includes(k))
    if (hasMaths) {
      console.error('❌ MATHS CONTENT DETECTED in spelling session!')
      console.error('Full text:', fullText.slice(0, 500))
    }
    expect(hasMaths).toBe(false)
  })

  // ─── 6. Session complete saves stars ─────────────────────────────────────
  test('session complete API saves to database', async ({ page }) => {
    // Call the API directly
    const response = await page.request.post('https://learniapp.co/api/session/complete', {
      data: {
        childId: '799637a1-6e62-4646-b9f7-b8948f452e0c', // Lia's ID
        starsEarned: 5,
        correctCount: 2,
        totalQuestions: 3,
        subjects: ['Playwright Test'],
        duration: 60,
        jarAllocation: { save: 50, spend: 30, give: 20 },
      },
    })
    const data = await response.json()
    console.log('Session save response:', data)
    expect(response.status()).toBe(200)
    expect(data.success).toBe(true)
    expect(data.sessionId).toBeTruthy()
  })

  // ─── 7. API endpoints respond ─────────────────────────────────────────────
  test('lesson API responds with valid JSON', async ({ page }) => {
    const response = await page.request.post('https://learniapp.co/api/lesson', {
      data: {
        childName: 'Test',
        yearLevel: 5,
        subject: 'Grammar & Spelling — Common words',
        phase: 'lesson',
        sessionStats: { correctCount: 0, totalQuestions: 0, streakCount: 0, personalBest: 0, starsEarned: 0 },
      },
    })
    expect(response.status()).toBe(200)
    const data = await response.json()
    console.log('Lesson API response:', JSON.stringify(data).slice(0, 200))
    expect(data.earniSays).toBeTruthy()
    // Should not be maths content
    const text = (data.earniSays + ' ' + (data.question || '')).toLowerCase()
    expect(text).not.toMatch(/what is \d+ [×x\*] \d+/)
  })

  // ─── 8. Kid stats load ───────────────────────────────────────────────────
  test('kid stats API returns data', async ({ page }) => {
    const response = await page.request.get(
      'https://learniapp.co/api/kid/stats?childId=799637a1-6e62-4646-b9f7-b8948f452e0c'
    )
    expect(response.status()).toBe(200)
    const data = await response.json()
    console.log('Kid stats:', { totalStars: data.totalStars, streak: data.streak, sessions: data.sessionCount })
    expect(typeof data.totalStars).toBe('number')
    expect(typeof data.streak).toBe('number')
  })

  // ─── 9. No raw JSON on screen ────────────────────────────────────────────
  test('session page shows no raw JSON', async ({ page }) => {
    // Log in and start a session
    await page.goto('/login')
    await page.locator('input').first().fill(CHILD_USERNAME)
    await page.waitForTimeout(300)
    await page.locator('input').nth(1).fill(TEST_CHILD_PIN)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/(kid-hub|kid-welcome)/, { timeout: 15000 })

    // Set up localStorage
    await page.evaluate(() => {
      localStorage.setItem('learni_subject', 'Grammar & Spelling — Common words')
      localStorage.setItem('learni_session_mode', 'learn')
    })

    await page.goto('/session')
    // Skip audio check
    await page.waitForTimeout(2000)
    const skipBtn = page.locator('button:has-text("Continue without sound"), button:has-text("Let\'s go")')
    if (await skipBtn.isVisible()) await skipBtn.click()

    await page.waitForTimeout(6000)

    // Check for raw JSON patterns
    const bodyText = await page.locator('body').textContent()
    const hasRawJson = bodyText?.includes('{"earniSays"') || bodyText?.includes('"question":') || bodyText?.includes('"options":')
    if (hasRawJson) {
      console.error('❌ RAW JSON VISIBLE on page!')
      console.error('Sample:', bodyText?.slice(0, 300))
    }
    expect(hasRawJson).toBe(false)
  })
})
