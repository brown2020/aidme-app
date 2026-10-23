import { expect, test } from "@playwright/test";
import { createVerifiedUser, latestEmail, resetEmulators } from "./helpers";

test.beforeEach(async () => {
  await resetEmulators();
});

test("create account, verify email from the emailed link, and see the verified state", async ({ page }) => {
  await page.goto("/sign-in?mode=signup&redirect=%2Faccount");
  await page.getByLabel("Your name").fill("Nina New");
  await page.getByLabel("Email").fill("nina@example.com");
  await page.getByLabel("Password", { exact: true }).fill("correct-horse-battery");
  await page.getByLabel("Confirm password", { exact: true }).fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/account");
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();

  const { oobLink } = await latestEmail("nina@example.com", "VERIFY_EMAIL");
  expect((await fetch(oobLink)).ok).toBe(true);
  await page.getByRole("button", { name: "I've verified" }).click();
  await expect(page.getByRole("heading", { name: "Verify your email" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Your shared sessions" })).toBeVisible();
});

test("password mismatch and short passwords are caught before submitting", async ({ page }) => {
  await page.goto("/sign-in?mode=signup");
  await page.getByLabel("Email").fill("nina@example.com");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("Use a password with at least 8 characters.");
  await page.getByLabel("Password", { exact: true }).fill("correct-horse-battery");
  await page.getByLabel("Confirm password", { exact: true }).fill("correct-horse-batterz");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("Passwords don't match.");
});

test("forgot password sends a reset email that sets a new password", async ({ page }) => {
  const user = await createVerifiedUser("Rita Reset", "rita@example.com");
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/a password reset link is on its way/)).toBeVisible();

  const { oobLink } = await latestEmail(user.email, "PASSWORD_RESET");
  const reset = new URL(oobLink);
  reset.searchParams.set("newPassword", "brand-new-password");
  expect((await fetch(reset)).ok).toBe(true);

  await page.getByRole("button", { name: "Back to sign in" }).click();
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("form [role=alert]")).toContainText("don't match");
  await page.getByLabel("Password", { exact: true }).fill("brand-new-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
});

test("email-link sign-in finishes from the emailed link", async ({ page }) => {
  await createVerifiedUser("Lena Link", "lena@example.com");
  await page.goto("/sign-in?redirect=%2Faccount");
  await page.getByRole("button", { name: "Email me a sign-in link instead" }).click();
  await page.getByLabel("Email").fill("lena@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByText(/Check your inbox at lena@example.com/)).toBeVisible();

  const { oobLink } = await latestEmail("lena@example.com", "EMAIL_SIGNIN");
  const continueUrl = new URL(new URL(oobLink).searchParams.get("continueUrl") ?? "");
  const link = new URL(continueUrl.pathname + continueUrl.search, page.url());
  for (const [key, value] of new URL(oobLink).searchParams) link.searchParams.set(key, value);
  await page.goto(link.toString());
  await page.waitForURL("**/account");
  await expect(page.getByText("lena@example.com")).toBeVisible();
});

test("Google sign-in completes through the provider window", async ({ page }) => {
  await page.goto("/sign-in?redirect=%2Faccount");
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  await popup.getByText("Add new account").click();
  await expect(popup.locator("#email-input")).toBeVisible({ timeout: 15_000 });
  await popup.locator("#email-input").fill("gina@example.com");
  await popup.locator("#display-name-input").fill("Gina Google");
  await popup.getByText("Sign in with Google.com").click();
  await page.waitForURL("**/account");
  await expect(page.getByRole("heading", { name: "Gina Google" })).toBeVisible();
});

test("inside the iOS app, sign-in offers only email and password", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { ReactNativeWebView: { postMessage: () => undefined } });
  });
  const user = await createVerifiedUser("Ada App", "ada@example.com");
  await page.goto("/sign-in?redirect=%2Faccount");
  await expect(page.getByRole("button", { name: "Forgot your password?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Email me a sign-in link instead" })).toHaveCount(0);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/account");
});

test("a signed-in user who wasn't invited sees a clear no-access state", async ({ page }) => {
  const stranger = await createVerifiedUser("Sam Stranger", "sam@example.com");
  await page.goto("/sign-in?redirect=%2Fs%2Fabcdefghij0123456789");
  await page.getByLabel("Email").fill(stranger.email);
  await page.getByLabel("Password", { exact: true }).fill(stranger.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText(/don't have access/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with a different email" })).toBeVisible();
});
