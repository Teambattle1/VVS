import { test, expect } from '@playwright/test'

// Splash-skærmen kører 5 sekunder (DURATION_MS i SplashScreen.jsx) før den
// fader væk og afslører resten af appen. Vi giver E2E lidt ekstra slack.
const SPLASH_TIMEOUT_MS = 10_000

test.describe('smoke', () => {
  test('app loader og redirector ikke-loggede ind til /login', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/VVS FLOW/i)

    // ProtectedRoute redirector os til /login fordi vi ikke er logget ind
    await page.waitForURL(/\/login$/, { timeout: SPLASH_TIMEOUT_MS })

    // Email + password er unikke til login-form (splash har ingen labels)
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: SPLASH_TIMEOUT_MS })
    await expect(page.getByLabel('Adgangskode')).toBeVisible()

    // Submit-knappen er også unik
    await expect(page.getByRole('button', { name: /Log ind$/i })).toBeVisible()
  })

  test('kunde-portal håndterer ukendt token uden at crashe', async ({ page }) => {
    const response = await page.goto('/k/00000000-0000-0000-0000-000000000000', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.ok()).toBeTruthy()

    // App'en skal som minimum rendere root-elementet uden runtime-crash
    await expect(page.locator('#root')).toBeAttached()
  })
})
