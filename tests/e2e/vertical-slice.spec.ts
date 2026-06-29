import { expect, test } from "@playwright/test";

const uniqueEmail = () => `sky-${Date.now()}-${Math.floor(Math.random() * 1000)}@gmail.com`;

test("homepage loads and searches for a city", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /remember the sky/i })).toBeVisible();
  await expect(page.getByTestId("landing-background")).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await expect(page.getByTestId("landing-background")).toHaveAttribute("data-background-mode", "image");
    await expect(page.getByTestId("landing-poster-mobile")).toBeVisible();
    await expect(page.getByTestId("landing-poster-desktop")).toBeHidden();
  } else {
    await expect(page.getByTestId("landing-poster-desktop")).toBeVisible();
  }
  await page.getByLabel("Search city").fill("Darjeeling");
  await page.getByRole("button", { name: /view weather/i }).click();
  await expect(page).toHaveURL(/\/city\/darjeeling/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("weather-background")).toBeVisible();
});

test("desktop landing video toggle appears and persists", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "desktop background video toggle only");

  await page.goto("/");
  await expect(page.getByTestId("landing-background")).toBeVisible();
  await expect(page.getByRole("button", { name: "Image background" })).toBeVisible();
  const reducedMotion = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (reducedMotion) {
    test.skip(true, "video background toggle is disabled when reduced motion is preferred");
  }

  const videoToggle = page.getByRole("button", { name: "Video background" });
  if (await videoToggle.isDisabled()) {
    test.skip(true, "video background toggle is disabled in this environment");
  }

  await videoToggle.click();
  await expect(videoToggle).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("landing-background")).toHaveAttribute("data-background-mode", "video");

  await page.reload();
  await expect(page.getByRole("button", { name: "Video background" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("registers and is gated to verify email before app access", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/register");
  await page.getByLabel("Name").fill("Playwright Sky");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("IconicSkiesTest123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/verify-email/);
  await expect(page.getByRole("heading", { name: /verify your email/i })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/verify-email/);
});

test("register blocks obvious fake email domains before OTP", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("Blocked Domain");
  await page.getByLabel("Email").fill("blocked@example.com");
  await page.getByLabel("Password").fill("IconicSkiesTest123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/register/);
  await expect(page.getByText(/please use a real email address you can access/i)).toBeVisible();
});

test("protected dashboard redirects signed-out users", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("settings page shows email OTP security controls", async ({ page }) => {
  const email = uniqueEmail();

  const registerResponse = await page.request.post("/api/auth/register", {
    data: {
      name: "Security Sky",
      email,
      password: "IconicSkiesTest123!",
    },
  });
  expect(registerResponse.ok()).toBeTruthy();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: /account security/i })).toBeVisible();
  await expect(page.getByText(/manage email verification and sign-in protection/i)).toBeVisible();
  await expect(page.getByText(/email verification is required once after registration/i)).toBeVisible();
  await expect(page.getByText("Email verification", { exact: true })).toBeVisible();
  await expect(page.getByText("OTP sign-in protection", { exact: true })).toBeVisible();
  await expect(page.getByText(/when otp sign-in is enabled for your account, iconicskies asks for an email code after your password/i)).toBeVisible();
});

test("dashboard settings redirects to settings", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/register");
  await page.getByLabel("Name").fill("Redirect Sky");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("IconicSkiesTest123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/verify-email/);

  await page.goto("/dashboard/settings");
  await expect(page).toHaveURL(/\/settings/);
});
