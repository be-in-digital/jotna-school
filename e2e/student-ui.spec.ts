import { test, expect } from "@playwright/test";

test.describe("Espace Élève", () => {
  test("la page /student/home se charge", async ({ page }) => {
    const response = await page.goto("/student/home");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la page /student/badges se charge", async ({ page }) => {
    const response = await page.goto("/student/badges");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("la page /student/profil se charge", async ({ page }) => {
    const response = await page.goto("/student/profil");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la navigation supérieure contient les liens principaux", async ({ page }) => {
    await page.goto("/student/home");
    await expect(page.getByRole("link", { name: /Accueil/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Coffre/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Profil/i }).first()).toBeVisible();
  });
});
