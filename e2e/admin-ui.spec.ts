import { test, expect } from "@playwright/test";

test.describe("Espace Admin - Layout", () => {
  test("le dashboard admin affiche la sidebar avec les liens de navigation", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("link", { name: /Tableau de bord/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Matières/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Exercices/i }).first()).toBeVisible();
  });

  test("la page /admin/subjects se charge", async ({ page }) => {
    const response = await page.goto("/admin/subjects");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la page /admin/badges se charge", async ({ page }) => {
    const response = await page.goto("/admin/badges");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la page /admin/pdf-uploads se charge", async ({ page }) => {
    const response = await page.goto("/admin/pdf-uploads");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la page /admin/exercises/drafts se charge", async ({ page }) => {
    const response = await page.goto("/admin/exercises/drafts");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la page /admin/exercises/published se charge", async ({ page }) => {
    const response = await page.goto("/admin/exercises/published");
    expect(response?.status()).toBeLessThan(500);
  });
});
