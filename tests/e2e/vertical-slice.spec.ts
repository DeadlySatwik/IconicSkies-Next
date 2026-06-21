import { expect, test } from "@playwright/test";

const uniqueEmail = () => `sky-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.test`;

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
  await expect(page.getByText(/darjeeling, in/i)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("weather-background")).toBeVisible();
});

test("desktop landing video toggle appears and persists", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "desktop background video toggle only");

  await page.goto("/");
  await expect(page.getByTestId("landing-background")).toBeVisible();
  await expect(page.getByRole("button", { name: "Image background" })).toBeVisible();

  await page.getByRole("button", { name: "Video background" }).click();
  await expect(page.getByRole("button", { name: "Video background" })).toHaveAttribute(
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

test("registers, saves a sky moment, and shows it in the timeline", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/register");
  await page.getByLabel("Name").fill("Playwright Sky");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("IconicSkiesTest123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /saved skies/i })).toBeVisible();

  await page.goto("/city/darjeeling?units=metric");
  await expect(page.getByRole("button", { name: /enhance note with ai/i })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: /add title & mood tags/i })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: /enhance note with ai/i }).click();
  await expect(page.getByLabel("Writing style")).toBeVisible();
  await page.getByRole("button", { name: /add title & mood tags/i }).click();
  await expect(page.getByLabel("Title")).toBeVisible();
  await page.getByLabel("Journal note").fill("Mist over the hills during the test run.");
  await page.getByLabel("Title").fill("Rain Before the Grind");
  await page.getByLabel("Mood tags").fill("focused, rainy, calm, growth");
  await page.getByRole("button", { name: /save sky moment/i }).click();
  await expect(page.getByText(/saved to your sky journal/i)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: /monthly sky recap/i })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: /favorite skies/i })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: /monthly sky recap/i }).click();
  await expect(page.getByRole("button", { name: /generate monthly recap/i })).toBeVisible();
  const timeline = page.getByLabel("Sky Journal timeline");
  await expect(timeline).toBeVisible();
  await expect(timeline.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
  await expect(timeline.getByText("Rain Before the Grind")).toBeVisible();
  await expect(timeline.getByText("Mist over the hills during the test run.")).toBeVisible();
});

test("protected dashboard redirects signed-out users", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
