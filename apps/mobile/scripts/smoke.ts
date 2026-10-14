import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { makeLevel, rotate } from "../src/engine";
async function main() {
  const root = path.resolve("dist");
  const server = createServer((req, res) => {
    let file = path.join(root, (req.url || "/").split("?")[0]);
    if (!path.extname(file)) file = path.join(root, "index.html");
    try {
      res.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "application/javascript"
          : file.endsWith(".html")
            ? "text/html"
            : "application/octet-stream",
      );
      res.end(readFileSync(file));
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) =>
    server.listen(8082, "127.0.0.1", resolve),
  );
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--single-process",
      "--disable-gpu",
    ],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:8082");
    await page.getByText("Pick your challenge").waitFor();
    await page.getByRole("button", { name: "Let’s play →" }).click();
    await page.getByRole("button", { name: "Start puzzle" }).click();
    const pathLevel = makeLevel("path", 0);
    if (pathLevel.kind !== "path") throw Error();
    for (let i = 0; i < pathLevel.tiles.length; i++) {
      let mask = pathLevel.tiles[i];
      while (mask !== pathLevel.solution[i]) {
        await page
          .getByRole("button", { name: `Rotate tile ${i + 1}`, exact: true })
          .click();
        mask = rotate(mask);
      }
    }
    await page.getByRole("button", { name: "Check solution" }).click();
    await page.getByText("Nicely done!").waitFor();
    await page.getByText("CLEAN SOLVE").waitFor();
    await page.getByRole("button", { name: "Back home" }).click();
    await page.getByRole("button", { name: /Jod Jamao/ }).click();
    await page.getByRole("button", { name: "Let’s play →" }).click();
    await page.getByRole("button", { name: "Start puzzle" }).click();
    const sum = makeLevel("sum", 0);
    if (sum.kind !== "sum") throw Error();
    for (let i = 0; i < sum.values.length; i++)
      if (sum.solution[i])
        await page
          .getByRole("checkbox", {
            name: `Number ${sum.values[i]}, row ${Math.floor(i / sum.size) + 1}, column ${(i % sum.size) + 1}`,
          })
          .click();
    await page.getByRole("button", { name: "Check solution" }).click();
    await page.getByText("Nicely done!").waitFor();
    await page.getByRole("button", { name: "Back home" }).click();
    await page.getByRole("button", { name: /Yaadon Ki Baazi/ }).click();
    await page.getByRole("button", { name: "Let’s play →" }).click();
    await page.getByRole("button", { name: "Start puzzle" }).click();
    const memory = makeLevel("memory", 0);
    if (memory.kind !== "memory") throw Error();
    await page
      .getByText(`0 / ${memory.sequence.length}`, { exact: true })
      .waitFor();
    for (const tile of memory.sequence)
      await page
        .getByRole("button", { name: `Memory tile ${tile + 1}`, exact: true })
        .click();
    await page.getByText("Nicely done!").waitFor();
    await page.getByRole("button", { name: "Back home" }).click();
    await page.getByRole("tab", { name: "You", exact: true }).click();
    await page.getByLabel("New profile name").fill("Sundaram");
    await page
      .getByRole("button", { name: "Add profile", exact: true })
      .click();
    await page
      .getByLabel("Feedback", { exact: true })
      .fill("Fun alpha; test family next.");
    await page
      .getByRole("button", { name: "Save feedback", exact: true })
      .click();
    await page.getByText("Saved ✓").waitFor();
    await page.reload();
    await page
      .getByText("Hey Sundaram. Your next challenge is waiting.")
      .waitFor();
    await page.getByRole("tab", { name: "Family", exact: true }).click();
    await page.getByLabel("Player 1 name").fill("Sundaram");
    await page.getByLabel("Player 2 name").fill("Madhu");
    await page.getByRole("button", { name: /Rang Raasta/ }).click();
    await page.getByRole("button", { name: "Start Family Battle →" }).click();
    await page.getByRole("button", { name: "Start puzzle" }).click();
    for (let i = 0; i < 16; i++)
      await page.getByRole("button", { name: "Use hint", exact: true }).click();
    await page.getByRole("button", { name: "Check solution" }).click();
    await page.getByRole("button", { name: "Pass phone to Madhu →" }).click();
    await page.getByRole("button", { name: "Start puzzle" }).click();
    for (let i = 0; i < 16; i++)
      await page.getByRole("button", { name: "Use hint", exact: true }).click();
    await page.getByRole("button", { name: "Check solution" }).click();
    await page.getByText("Family standings").waitFor();
    assert.equal(
      await page.getByRole("button", { name: /Pass phone/ }).count(),
      0,
    );
    await page.getByRole("button", { name: "Back home" }).click();
    await page.getByRole("tab", { name: "You", exact: true }).click();
    await page
      .getByRole("button", { name: "Language: English → हिन्दी" })
      .click();
    await page.getByText("अपना अंदाज।").waitFor();
    await page.reload();
    await page.getByRole("tab", { name: "खेलें", exact: true }).waitFor();
    await page.setViewportSize({ width: 320, height: 740 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("dangal-state-v1")!),
    );
    assert.equal(stored.attempts.length, 5);
    assert.equal(stored.feedback.length, 1);
    assert.equal(stored.settings.language, "hi");
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "Browser smoke passed: three clean solves, persisted profile/results/feedback/settings, two-player family rotation, Hindi reload, 320px layout, no page errors.",
    );
  } finally {
    await browser.close();
    server.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
