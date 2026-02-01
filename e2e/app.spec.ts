import { test, expect } from '@playwright/test';

test.describe('International Meeting Planner - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Logo image with alt text
    await expect(page.locator('img[alt="International Meeting Planner"]')).toBeVisible();
  });

  test('should display default cities', async ({ page }) => {
    await page.goto('/');

    // Wait for the timeline grid to load
    await expect(page.getByRole('table')).toBeVisible();

    // Check for Best Times row (use exact match to avoid duplicates)
    await expect(page.getByText('Best Times', { exact: true })).toBeVisible();
  });

  test('should show city search', async ({ page }) => {
    await page.goto('/');

    // Look for the search input - placeholder is "Add city..."
    const searchInput = page.getByPlaceholder(/add city/i);
    await expect(searchInput).toBeVisible();
  });

  test('should navigate dates', async ({ page }) => {
    await page.goto('/');

    // Find the Today button
    const todayButton = page.getByRole('button', { name: /today/i });
    await expect(todayButton).toBeVisible();

    // Find navigation buttons (they have title attributes)
    const prevButton = page.getByTitle('Previous day');
    const nextButton = page.getByTitle('Next day');

    // Both should be visible
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });
});

test.describe('International Meeting Planner - City Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should search for a city', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/add city/i);
    await searchInput.fill('Tokyo');

    // Wait for search results (buttons in dropdown)
    await expect(page.locator('button').filter({ hasText: 'Tokyo' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should add a city from search results', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/add city/i);
    await searchInput.fill('Paris');

    // Wait for and click on a search result
    await page.waitForTimeout(500); // Wait for results to populate
    const parisResult = page.locator('button').filter({ hasText: /Paris/ }).first();
    await parisResult.click();

    // Verify Paris appears in the timeline
    await expect(page.locator('table').getByText('Paris')).toBeVisible();
  });

  test('should remove a city', async ({ page }) => {
    await page.goto('/');

    // Wait for cities to load
    await expect(page.getByRole('table')).toBeVisible();

    // Find remove buttons
    const removeButtons = page.getByTitle('Remove city');
    const initialCount = await removeButtons.count();

    if (initialCount > 0) {
      // Click the first remove button
      await removeButtons.first().click();

      // Verify one less city
      await expect(removeButtons).toHaveCount(initialCount - 1);
    }
  });
});

test.describe('International Meeting Planner - Timeline Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display time slots', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    // Check for time labels
    await expect(page.getByText('9AM').first()).toBeVisible();
    await expect(page.getByText('12PM').first()).toBeVisible();
  });

  test('should scroll timeline horizontally', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // The timeline should be scrollable
    const scrollContainer = page.locator('.timeline-scroll');
    const scrollWidth = await scrollContainer.evaluate(el => el.scrollWidth);
    const clientWidth = await scrollContainer.evaluate(el => el.clientWidth);

    // Scroll width should be larger than client width (indicating horizontal scroll)
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  });

  test('should show color-coded working hours', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    // Check that the table has cells - the color classes are applied via Tailwind
    // Look for td elements with div children that have background colors
    const cells = page.locator('td div');
    await expect(cells.first()).toBeVisible();

    // Verify multiple cells exist (should have many time slots)
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThan(10);
  });
});

test.describe('International Meeting Planner - Meeting Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should select a time slot on click', async ({ page, isMobile }) => {
    await expect(page.getByRole('table')).toBeVisible();

    // Find a clickable time slot (not in the past)
    const slots = page.locator('td[class*="cursor-crosshair"]');
    const slotCount = await slots.count();

    if (slotCount > 0) {
      if (isMobile) {
        // Simulate touch detection first
        await page.evaluate(() => {
          window.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
        });

        // Tap on a slot
        await slots.first().tap();

        // Should see the tap instruction banner
        await expect(page.getByText(/Tap another time/)).toBeVisible();
      } else {
        // Desktop: just click
        await slots.first().click();
      }
    }
  });
});

test.describe('International Meeting Planner - Working Hours Modal', () => {
  test('should open working hours modal', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('table')).toBeVisible();

    // Find and click the edit working hours button
    const editButton = page.getByTitle('Edit working hours').first();
    await editButton.click();

    // Modal should appear
    await expect(page.getByText(/Working Hours/)).toBeVisible();
  });
});

test.describe('International Meeting Planner - Responsive Layout', () => {
  test('should adapt layout for viewport', async ({ page }) => {
    await page.goto('/');

    // App logo should be visible
    await expect(page.locator('img[alt="International Meeting Planner"]')).toBeVisible();

    // Timeline should be present
    await expect(page.getByRole('table')).toBeVisible();
  });
});
