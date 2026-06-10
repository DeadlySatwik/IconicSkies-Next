import { expect, test } from "@playwright/test";

const uniqueEmail = () => `sky-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.test`;

test("homepage loads and searches for a city", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /remember the sky/i })).toBeVisible();
  await page.getByLabel("Search city").fill("Darjeeling");
  await page.getByRole("button", { name: /view weather/i }).click();
  await expect(page).toHaveURL(/\/city\/darjeeling/);
  await expect(page.getByRole("heading", { name: /weather in darjeeling/i })).toBeVisible();
});

test("registers, saves a sky moment, and shows it in the timeline", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/register");
  await page.getByLabel("Name").fill("Playwright Sky");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("IconicSkiesTest123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/city/darjeeling?units=metric");
  await page.getByLabel("Journal note").fill("Mist over the hills during the test run.");
  await page.getByRole("button", { name: /save sky moment/i }).click();
  await expect(page.getByText(/saved to your sky journal/i)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Mist over the hills during the test run.")).toBeVisible();
  await expect(page.getByLabel("Sky Journal timeline")).toBeVisible();
});

test("protected dashboard redirects signed-out users", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
