import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createVerifiedUser, expectNoHorizontalOverflow, resetEmulators, signIn } from "./helpers";

test.beforeEach(async () => {
  await resetEmulators();
});

const PUBLIC_ROUTES = ["/", "/about", "/settings", "/privacy", "/terms", "/sign-in"];

for (const route of PUBLIC_ROUTES) {
  test(`${route} fits a phone, also at 200% text, with no accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalOverflow(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
    await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
    await expectNoHorizontalOverflow(page);
  });
}

test("account and viewer screens fit a phone with no accessibility violations", async ({ page }) => {
  const owner = await createVerifiedUser("Olivia Owner", "olivia@example.com");
  await signIn(page, owner, "/account");
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  // Firestore keeps a live connection open, so wait for content rather than network idle.
  const screens = [
    { path: "/account", ready: page.getByText("You haven't shared any sessions yet.", { exact: false }) },
    { path: "/s/abcdefghij0123456789", ready: page.getByText(/don't have access|doesn't exist/) },
  ];
  for (const { path, ready } of screens) {
    await page.goto(path);
    await expect(ready).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
  }
});
