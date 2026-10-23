import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  createVerifiedUser,
  readDoc,
  resetEmulators,
  signIn,
  useFakeSpeech,
} from "./helpers";

test.beforeEach(async () => {
  await resetEmulators();
});

async function startSharing(page: Page, viewerEmail: string): Promise<string> {
  await page.getByRole("button", { name: "Share live" }).click();
  await page.getByLabel("Their email addresses").fill(viewerEmail);
  await page.getByRole("button", { name: "Start sharing" }).click();
  const link = page.getByLabel("Share link");
  await expect(link).toHaveValue(/\/s\/[A-Za-z0-9]{10,}$/);
  const url = await link.inputValue();
  await page.getByRole("button", { name: "Close" }).click();
  return new URL(url).pathname;
}

test("captions work signed out without downloading Firestore", async ({ page }) => {
  const firestoreChunks: string[] = [];
  page.on("response", async (response) => {
    if (!response.url().endsWith(".js")) return;
    const body = await response.text().catch(() => "");
    if (body.includes("firestore.googleapis.com")) firestoreChunks.push(response.url());
  });
  await useFakeSpeech(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Start listening", exact: true }).click();
  await page.evaluate(() => window.__speak("hello from a guest", true));
  await expect(page.getByText("Hello from a guest.")).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(firestoreChunks).toEqual([]);
});

test("owner streams words and sentences; viewer can stop, resume, and leave", async ({ browser }) => {
  const owner = await createVerifiedUser("Olivia Owner", "olivia@example.com");
  const viewer = await createVerifiedUser("Victor Viewer", "victor@example.com");

  const ownerPage = await (await browser.newContext()).newPage();
  await useFakeSpeech(ownerPage);
  await signIn(ownerPage, owner);
  const sessionPath = await startSharing(ownerPage, "Victor@Example.com");
  await ownerPage.getByRole("button", { name: "Start listening", exact: true }).click();
  await expect(ownerPage.getByRole("button", { name: /Live · 1 invited/ })).toBeVisible();

  const viewerPage = await (await browser.newContext()).newPage();
  await signIn(viewerPage, viewer, sessionPath);
  await expect(viewerPage.getByRole("heading", { name: "Olivia Owner" })).toBeVisible();

  // Words appear while they are still being spoken, then as a finished sentence.
  await ownerPage.evaluate(() => window.__speak("can you see", false));
  await expect(viewerPage.getByText("can you see", { exact: true })).toBeVisible();
  await ownerPage.evaluate(() => window.__speak("can you see these words", true));
  await expect(viewerPage.getByText("Can you see these words.")).toBeVisible();
  await expect(viewerPage.getByText("can you see", { exact: true })).toHaveCount(0);

  // Stopping disconnects the stream; resuming catches up.
  await viewerPage.getByRole("button", { name: "Stop listening" }).click();
  await expect(viewerPage.getByRole("heading", { name: "You stopped listening" })).toBeVisible();
  await ownerPage.evaluate(() => window.__speak("said while you were away", true));
  await expect(ownerPage.getByText("Said while you were away.")).toBeVisible();
  await viewerPage.waitForTimeout(1500);
  await expect(viewerPage.getByText("Said while you were away.")).toHaveCount(0);
  await viewerPage.getByRole("button", { name: "Resume listening" }).click();
  await expect(viewerPage.getByText("Said while you were away.")).toBeVisible();

  // Leaving removes access for good.
  await viewerPage.getByRole("button", { name: "Stop listening" }).click();
  await viewerPage.getByRole("button", { name: "Remove me from this session" }).click();
  await expect(viewerPage.getByText("You left this session.")).toBeVisible();
  await viewerPage.goto(sessionPath);
  await expect(viewerPage.getByText(/don't have access/)).toBeVisible();

  // The owner's invite list drops the viewer who left.
  await ownerPage.getByRole("button", { name: /Live · 0 invited/ }).click();
  await expect(ownerPage.getByText("Invited (0/10)")).toBeVisible();
});

test("invitee emails stay off the session, and deleting the account removes everything", async ({ page }) => {
  const owner = await createVerifiedUser("Olivia Owner", "olivia@example.com");
  await signIn(page, owner);
  const sessionPath = await startSharing(page, "victor@example.com");
  const sessionId = sessionPath.split("/").pop() ?? "";
  const stored = await readDoc(`sessions/${sessionId}`);
  expect(JSON.stringify(stored)).not.toContain("victor@example.com");
  expect(await readDoc(`sessions/${sessionId}/private/invites`)).not.toBeNull();

  await page.goto("/account");
  await page.getByRole("button", { name: "Delete account…" }).click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Permanently delete account" }).click();
  await expect(page.getByText("Your account and all of its data were deleted.")).toBeVisible();
  await expect(page).toHaveURL("/");

  expect(await readDoc(`sessions/${sessionId}`)).toBeNull();
  expect(await readDoc(`sessions/${sessionId}/private/invites`)).toBeNull();
});

test("sign-in is usable by keyboard and has no automated accessibility violations", async ({ page }) => {
  await page.goto("/sign-in");
  const names: string[] = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    names.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.getAttribute("aria-label") || el?.textContent?.trim() || el?.getAttribute("name") || "";
      })
    );
  }
  for (const expected of ["Continue with Google", "email", "password", "Show password", "Sign in"]) {
    expect(names).toContain(expected);
  }
  await page.getByLabel("Password", { exact: true }).fill("secret");
  await page.getByRole("button", { name: "Show password" }).press("Enter");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("Space toggles listening from the keyboard", async ({ page }) => {
  await useFakeSpeech(page);
  await page.goto("/");
  await page.locator("body").press("Space");
  await expect(page.getByRole("button", { name: /Stop listening \(Space shortcut\)/ })).toBeVisible();
  await page.locator("body").press("Space");
  await expect(page.getByRole("button", { name: /Start listening \(Space shortcut\)/ })).toBeVisible();
});
