import { test, expect } from "@playwright/test";

test.describe("Espace Élève", () => {
  test("la page /student/home se charge", async ({ page }) => {
    const response = await page.goto("/student/home");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la page /student/map se charge", async ({ page }) => {
    const response = await page.goto("/student/map");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
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

  // Redesign Gaming — la nav est un HUD de jeu : Camp / Carte / Trophées /
  // Carnet (desktop en haut, dock mobile en bas).
  test("la navigation contient les destinations du jeu", async ({ page }) => {
    await page.goto("/student/home");
    await expect(
      page.getByRole("link", { name: /Camp/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Carte/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Trophées/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Carnet/i }).first(),
    ).toBeVisible();
  });
});
