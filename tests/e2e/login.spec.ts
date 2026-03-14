import { test, expect } from "@playwright/test";

test("login happy path", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@clientops.dev");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
