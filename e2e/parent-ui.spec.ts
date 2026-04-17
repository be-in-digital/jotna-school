import { test, expect } from "@playwright/test";

test.describe("Espace Parent", () => {
  test("la page /parent/dashboard se charge", async ({ page }) => {
    const response = await page.goto("/parent/dashboard");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la page /parent/children/add contient un formulaire", async ({ page }) => {
    await page.goto("/parent/children/add");
    await expect(page.locator("form")).toBeVisible();
  });

  test("la page /parent/settings se charge", async ({ page }) => {
    const response = await page.goto("/parent/settings");
    expect(response?.status()).toBeLessThan(500);
  });
});
