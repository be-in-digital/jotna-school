import { test, expect } from "@playwright/test";

test.describe("Routes publiques", () => {
  test("la page /login s'affiche avec le formulaire de connexion", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Se connecter/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: /Se connecter/i })).toBeVisible();
  });

  test("la page /register s'affiche avec le formulaire d'inscription", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Créer un compte/i })).toBeVisible();
    await expect(page.getByLabel("Nom")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByLabel("Rôle")).toBeVisible();
  });

  test("le lien 'Créer un compte' sur /login redirige vers /register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /Créer un compte/i }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("le lien 'Se connecter' sur /register redirige vers /login", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: /Se connecter/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("Page d'accueil", () => {
  test("/ se charge sans crash", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Pages 404", () => {
  test("une URL inexistante affiche la page 404", async ({ page }) => {
    await page.goto("/cette-page-nexiste-pas");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText(/introuvable/i)).toBeVisible();
  });
});
