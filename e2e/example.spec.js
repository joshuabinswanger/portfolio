// @ts-check
import { test, expect } from '@playwright/test';

test('open localhost', async ({ page }) => {
  await page.goto('http://localhost:4321/');

});

