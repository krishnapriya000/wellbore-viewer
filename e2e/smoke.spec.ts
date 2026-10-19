import { expect, test } from '@playwright/test';

test('loads sample wells, renders the 3D view and drills', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Drilling wellbore' })).toHaveValue('L1');
  await expect(page.locator('section[aria-label="3D wellbore trajectory view"] canvas')).toBeVisible();

  // The bit advances while the user can still orbit: drag, then check depth keeps increasing.
  const depth = page.locator('.hint.mono');
  const before = await depth.textContent();
  await page.mouse.move(400, 300);
  await page.mouse.down();
  await page.mouse.move(520, 340);
  await page.mouse.up();
  await expect(depth).not.toHaveText(before ?? '');

  await page.getByRole('button', { name: 'm', exact: true }).click();
  await expect(depth).toContainText(' m');
  expect(errors).toEqual([]);
});

test('switching wellbore restarts drilling on that lateral', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Drilling wellbore' }).selectOption('L2');
  await expect(page.getByText('drilling L2')).toBeVisible();
});
