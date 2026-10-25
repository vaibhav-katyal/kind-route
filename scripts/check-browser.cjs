const { chromium } = require("playwright");
const fs = require("node:fs/promises");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  const page = await browser.newPage({
    viewport: { width: 1536, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await fs.mkdir("artifacts", { recursive: true });
  await page.getByRole("button", { name: "Clothing", exact: true }).click();
  await page.getByAltText("A warm jacket", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await page.getByRole("tab", { name: /02 We connect/ }).click();
  await page
    .getByText("Matched with a nearby community kitchen", { exact: true })
    .waitFor();
  await page.getByRole("tab", { name: /03 Good arrives/ }).click();
  await page
    .getByText("+120 kindness points · a little good comes back", {
      exact: true,
    })
    .waitFor();
  for (const section of await page.locator(".reveal-on-scroll").all()) {
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "artifacts/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/landing-mobile.png",
    fullPage: true,
  });
  if (
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
  ) {
    throw new Error("Landing page overflows on mobile");
  }
  await page
    .getByRole("button", { name: "I’m with an NGO", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  if (!(await page.locator('input[name="role"][value="ngo"]').isChecked())) {
    throw new Error("NGO registration did not select the NGO workspace");
  }
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Back to KindRoute home" }).click();
  await page.getByRole("button", { name: "I have something to give" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 1536, height: 1100 });
  await page.getByRole("heading", { name: "Your recent donations" }).waitFor();
  if (
    await page
      .locator(
        ".hero-panel, .reward-mini, .impact-strip, .pickup-panel, .need-card",
      )
      .count()
  ) {
    throw new Error("Donor overview still contains removed clutter");
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(450);
  await page.screenshot({
    path: "artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Make a donation", exact: true })
    .click();
  await page
    .getByLabel("What would you like to share?")
    .fill("School supplies for a fresh start");
  await page.getByRole("combobox").selectOption("Essentials");
  await page.getByLabel("Quantity", { exact: true }).fill("30 school kits");
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
  await page
    .getByLabel("Available for pickup")
    .fill(tomorrow.toISOString().slice(0, 16));
  await page
    .getByLabel("A little more about it")
    .fill(
      "Unused notebooks, pencils and school bags. Clean and ready for pickup.",
    );
  await page.getByRole("button", { name: "Make it available" }).click();
  await page
    .getByRole("heading", { name: "School supplies for a fresh start" })
    .waitFor();
  await page.reload();
  await page
    .getByRole("button", { name: "My donations", exact: false })
    .click();
  await page
    .getByRole("heading", { name: "School supplies for a fresh start" })
    .waitFor();
  await page.getByRole("button", { name: "Switch to NGO workspace" }).click();
  await page.getByRole("button", { name: "Try the NGO demo instead" }).click();
  if (
    await page
      .getByText(
        /Rewards & impact|Kindness points|My requirements|Post a requirement/,
      )
      .count()
  ) {
    throw new Error("NGO workspace contains donor-only or removed features");
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: "artifacts/ngo-desktop.png", fullPage: true });
  await page
    .getByRole("button", { name: "Explore donations", exact: true })
    .click();
  const donation = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "School supplies for a fresh start",
    }),
  });
  await donation.getByRole("button", { name: "Reserve", exact: true }).click();
  await page.getByRole("button", { name: "Reserve & schedule pickup" }).click();
  await page
    .getByRole("navigation", { name: "NGO workspace navigation" })
    .getByRole("button", { name: "Reserved pickups" })
    .click();
  await donation.getByRole("button", { name: "Track pickup" }).click();
  await page.getByRole("button", { name: "Simulate live pickup" }).click();
  await page.getByRole("button", { name: "Verify delivered" }).waitFor();
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some(
        (button) =>
          button.textContent.includes("Verify delivered") && !button.disabled,
      ),
    undefined,
    { timeout: 75000 },
  );
  await page.getByRole("button", { name: "Verify delivered" }).click();
  await page
    .getByRole("button", { name: "Collection history", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "School supplies for a fresh start" })
    .waitFor();
  if (
    await page
      .getByRole("heading", { name: "Stories with a new chapter" })
      .count()
  ) {
    throw new Error(
      "NGO collection history includes another organisation's donation",
    );
  }
  await page
    .getByRole("navigation", { name: "NGO workspace navigation" })
    .getByRole("button", { name: "Reserved pickups" })
    .click();
  await page.getByRole("button", { name: "Release reservation" }).click();
  await page
    .getByRole("heading", { name: "No reserved pickups yet." })
    .waitFor();
  await page
    .getByRole("button", { name: "Explore donations", exact: true })
    .first()
    .click();
  await page
    .getByRole("heading", { name: "Fresh meals, ready to share" })
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.screenshot({ path: "artifacts/ngo-mobile.png", fullPage: true });
  if (
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
  ) {
    throw new Error("NGO mobile workspace overflows horizontally");
  }
  await page.getByRole("button", { name: "Switch to donor workspace" }).click();
  await page
    .getByRole("button", { name: "Try the donor demo instead" })
    .click();
  await page.setViewportSize({ width: 1536, height: 1100 });
  await page
    .getByRole("button", { name: "Rewards & impact", exact: true })
    .click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download certificate" }).click();
  const download = await downloadEvent;
  await download.saveAs("artifacts/test-certificate.svg");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.screenshot({
    path: "artifacts/dashboard-mobile.png",
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflow) throw new Error("Mobile layout overflows horizontally");
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "PASS: landing page, role-specific onboarding, distinct NGO workspace, reservations, own-organisation collection history, reservation release, mobile layouts, donor donation creation, tracking, delivery verification, donor certificates, and no runtime errors.",
  );
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
