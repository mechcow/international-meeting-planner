import { test, expect } from '@playwright/test';

// Only run these tests on mobile devices
test.describe('Mobile - Tap to Select', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show tap instruction banner after first tap', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    // Simulate touch by dispatching touch event
    // First, we need to trigger the touch detection
    await page.evaluate(() => {
      window.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    });

    // Find a clickable time slot
    const slots = page.locator('td[class*="cursor-crosshair"]');
    const slotCount = await slots.count();

    if (slotCount > 0) {
      // Tap on a slot
      await slots.first().tap();

      // Should see the instruction banner
      await expect(page.getByText(/Tap another time to complete selection/)).toBeVisible();

      // Should see the Cancel button
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    }
  });

  test('should cancel selection when Cancel button is tapped', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    // Trigger touch detection
    await page.evaluate(() => {
      window.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    });

    const slots = page.locator('td[class*="cursor-crosshair"]');
    const slotCount = await slots.count();

    if (slotCount > 0) {
      // First tap
      await slots.first().tap();

      // Banner should appear
      await expect(page.getByText(/Tap another time/)).toBeVisible();

      // Tap cancel
      await page.getByRole('button', { name: /cancel/i }).tap();

      // Banner should disappear
      await expect(page.getByText(/Tap another time/)).not.toBeVisible();
    }
  });

  test('should complete selection on second tap', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    // Trigger touch detection
    await page.evaluate(() => {
      window.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    });

    const slots = page.locator('td[class*="cursor-crosshair"]');
    const slotCount = await slots.count();

    if (slotCount >= 2) {
      // First tap
      await slots.first().tap();

      // Banner should appear
      await expect(page.getByText(/Tap another time/)).toBeVisible();

      // Second tap on a different slot
      await slots.nth(2).tap();

      // Banner should disappear (selection complete)
      await expect(page.getByText(/Tap another time/)).not.toBeVisible();
    }
  });

  test('should create 1-hour meeting when same slot tapped twice', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    // Trigger touch detection
    await page.evaluate(() => {
      window.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    });

    const slots = page.locator('td[class*="cursor-crosshair"]');
    const slotCount = await slots.count();

    if (slotCount > 0) {
      const firstSlot = slots.first();

      // First tap
      await firstSlot.tap();

      // Banner should appear
      await expect(page.getByText(/or same time for 1-hour meeting/)).toBeVisible();

      // Tap same slot again
      await firstSlot.tap();

      // Banner should disappear (meeting created)
      await expect(page.getByText(/Tap another time/)).not.toBeVisible();
    }
  });
});

test.describe('Mobile - Touch Scrolling', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only tests');

  test('should allow horizontal scrolling on timeline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    const scrollContainer = page.locator('.timeline-scroll');

    // Get initial scroll position
    const initialScroll = await scrollContainer.evaluate(el => el.scrollLeft);

    // Swipe left (scroll right)
    await scrollContainer.evaluate(el => {
      el.scrollLeft += 200;
    });

    // Get new scroll position
    const newScroll = await scrollContainer.evaluate(el => el.scrollLeft);

    // Should have scrolled
    expect(newScroll).toBeGreaterThan(initialScroll);
  });
});

test.describe('Mobile - Responsive Design', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only tests');

  test('should display title on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('img[alt="International Meeting Planner"]')).toBeVisible();
  });

  test('should have sticky city column', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    // Scroll right
    const scrollContainer = page.locator('.timeline-scroll');
    await scrollContainer.evaluate(el => {
      el.scrollLeft = 500;
    });

    // City column should still be visible (sticky) - use exact match
    await expect(page.getByText('City', { exact: true })).toBeVisible();
    await expect(page.getByText('Best Times', { exact: true })).toBeVisible();
  });

  test('should have proper touch targets', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    // Check that buttons are reasonably sized for touch
    const editButtons = page.getByTitle('Edit working hours');
    const removeButtons = page.getByTitle('Remove city');

    // Get button dimensions
    if (await editButtons.count() > 0) {
      const box = await editButtons.first().boundingBox();
      if (box) {
        // Minimum touch target should be around 24x24 pixels
        expect(box.width).toBeGreaterThanOrEqual(20);
        expect(box.height).toBeGreaterThanOrEqual(20);
      }
    }
  });
});

test.describe('Mobile - City Search', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only tests');

  test('should search and add city on mobile', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/add city/i);
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.tap();
    await searchInput.fill('Sydney');

    // Wait for results
    await page.waitForTimeout(500);
    const sydneyResult = page.locator('button').filter({ hasText: /Sydney/ }).first();
    await expect(sydneyResult).toBeVisible({ timeout: 10000 });

    // Tap to add
    await sydneyResult.tap();

    // Verify added - use first() to avoid multiple match error
    await expect(page.locator('table').getByText('Sydney').first()).toBeVisible();
  });
});
