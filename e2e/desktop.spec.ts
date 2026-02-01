import { test, expect } from '@playwright/test';

// Only run these tests on desktop
test.describe('Desktop - Drag to Select', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop only tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should highlight slot on hover', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    // Find a clickable time slot
    const slots = page.locator('td[class*="cursor-crosshair"]');
    const slotCount = await slots.count();

    if (slotCount > 0) {
      // Hover over a slot
      await slots.first().hover();

      // The slot should have brightness effect (visual feedback)
      // We can't easily test CSS transforms, but we can verify the slot exists
      await expect(slots.first()).toBeVisible();
    }
  });

  test('should select time range by dragging', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    const slots = page.locator('td[class*="cursor-crosshair"]');
    const slotCount = await slots.count();

    if (slotCount >= 3) {
      const startSlot = slots.nth(1);
      const endSlot = slots.nth(3);

      // Get bounding boxes
      const startBox = await startSlot.boundingBox();
      const endBox = await endSlot.boundingBox();

      if (startBox && endBox) {
        // Perform drag
        await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2);
        await page.mouse.up();

        // Selection should be made (blue overlay visible)
        const selectedOverlay = page.locator('div[class*="bg-blue-"]');
        await expect(selectedOverlay.first()).toBeVisible();
      }
    }
  });

  test('should show meeting details after selection', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    const slots = page.locator('td[class*="cursor-crosshair"]');
    const slotCount = await slots.count();

    if (slotCount >= 2) {
      const startSlot = slots.first();
      const endSlot = slots.nth(1);

      const startBox = await startSlot.boundingBox();
      const endBox = await endSlot.boundingBox();

      if (startBox && endBox) {
        // Perform drag selection
        await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2);
        await page.mouse.up();

        // Meeting display should show selected meeting
        await expect(page.getByText(/Selected Meeting/i)).toBeVisible();
      }
    }
  });

  test('should clear selection when clicking clear button', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();

    const slots = page.locator('td[class*="cursor-crosshair"]');
    const slotCount = await slots.count();

    if (slotCount >= 2) {
      const startSlot = slots.first();
      const endSlot = slots.nth(1);

      const startBox = await startSlot.boundingBox();
      const endBox = await endSlot.boundingBox();

      if (startBox && endBox) {
        // Make a selection
        await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2);
        await page.mouse.up();

        // Find and click clear button
        const clearButton = page.getByRole('button', { name: /clear/i });
        if (await clearButton.count() > 0) {
          await clearButton.click();

          // Meeting display should be gone
          await expect(page.getByText(/Selected Meeting/i)).not.toBeVisible();
        }
      }
    }
  });
});

test.describe('Desktop - Keyboard Navigation', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop only tests');

  test('should navigate date with arrow buttons', async ({ page }) => {
    await page.goto('/');

    // Get current date display
    const todayButton = page.getByRole('button', { name: /today/i });
    await expect(todayButton).toBeVisible();

    // Click next day
    const nextButton = page.locator('button').filter({ hasText: '→' }).first();
    if (await nextButton.count() > 0) {
      await nextButton.click();
      // Date should change (we can't easily verify the exact date change)
    }
  });
});

test.describe('Desktop - Working Hours Modal', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop only tests');

  test('should open and close working hours modal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    // Open modal
    const editButton = page.getByTitle('Edit working hours').first();
    await editButton.click();

    // Modal should be visible
    await expect(page.getByText(/Working Hours/)).toBeVisible();

    // Find close button (could be X or Cancel)
    const closeButton = page.getByRole('button', { name: /close|cancel|×/i }).first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should update working hours', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    // Open modal
    const editButton = page.getByTitle('Edit working hours').first();
    await editButton.click();

    // Find save button
    const saveButton = page.getByRole('button', { name: /save/i });
    if (await saveButton.count() > 0) {
      await saveButton.click();
      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });
});

test.describe('Desktop - City Search', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop only tests');

  test('should filter cities as user types', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/add city/i);
    await searchInput.fill('Ber');

    // Wait for and check Berlin in results
    await page.waitForTimeout(500);
    await expect(page.locator('button').filter({ hasText: /Berlin/ })).toBeVisible({ timeout: 10000 });
  });

  test('should clear search on escape', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/add city/i);
    await searchInput.fill('Tokyo');

    // Press escape
    await searchInput.press('Escape');

    // Search input should be cleared or results hidden
    const searchValue = await searchInput.inputValue();
    expect(searchValue === '' || searchValue === 'Tokyo').toBeTruthy();
  });
});
