import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { makeMaze } from "../src/engine/maze";
import { makeLevel } from "../src/engine";
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
    await page.getByText("Your journey", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: /Rang Raasta|Jod Jamao|Yaadon/ })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Puzzle 2, locked", exact: true })
        .isDisabled(),
      true,
    );
    await page.screenshot({ path: "journey-preview.png" });
    const solve = async (game: "zip" | "maze", index = 0) => {
      const level = game === "zip" ? makeLevel("zip", index) : makeMaze(index);
      if (level.kind !== "zip" && level.kind !== "maze") throw Error();
      const cellBox = async (cell: number) => {
        const label = `Trail cell ${cell + 1}${level.checkpoints[cell] ? `, number ${level.checkpoints[cell]}` : ""}`;
        const box = await page
          .getByRole("button", { name: label, exact: true })
          .boundingBox();
        if (!box) throw Error("No cell");
        return box;
      };
      const first = await cellBox(level.solution[0]);
      await page.mouse.move(
        first.x + first.width / 2,
        first.y + first.height / 2,
      );
      await page.mouse.down();
      for (const cell of level.solution.slice(1)) {
        const b = await cellBox(cell);
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, {
          steps: 1,
        });
      }
      await page.mouse.up();
      await page.getByText("Puzzle cleared", { exact: true }).waitFor();
    };
    await page
      .getByRole("button", { name: "Puzzle 1, play", exact: true })
      .click();
    await solve("zip");
    await page.getByRole("button", { name: "Journey", exact: true }).click();
    await page
      .getByRole("button", { name: "Puzzle 2, play", exact: true })
      .waitFor();
    await page.reload();
    await page
      .getByRole("button", { name: "Puzzle 2, play", exact: true })
      .waitFor();
    await page.getByRole("button", { name: /Maze Runner/ }).click();
    await page
      .getByRole("button", { name: "Puzzle 1, play", exact: true })
      .click();
    await page.screenshot({ path: "maze-preview.png" });
    await solve("maze");
    await page.getByRole("button", { name: "Journey", exact: true }).click();
    await page.getByRole("button", { name: /Battle/ }).click();
    await page
      .getByRole("button", { name: "Start battle", exact: true })
      .click();
    for (
      let i = 0;
      i < 100 &&
      !(await page.getByText("Puzzle cleared", { exact: true }).count());
      i++
    )
      await page.getByRole("button", { name: "Hint ✦", exact: true }).click();
    await page
      .getByRole("button", { name: "Next: Player 2", exact: true })
      .click();
    for (
      let i = 0;
      i < 100 &&
      !(await page.getByText("Puzzle cleared", { exact: true }).count());
      i++
    )
      await page.getByRole("button", { name: "Hint ✦", exact: true }).click();
    await page.getByText("Final standings", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Journey", exact: true }).click();
    await page.setViewportSize({ width: 320, height: 568 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.getByRole("button", { name: /Play · Puzzle/ }).click();
    const undo = await page
      .getByRole("button", { name: "Undo", exact: true })
      .boundingBox();
    assert.ok(undo && undo.y + undo.height <= 568);
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS: continuous drag solves both games; sequential unlock/reload; same-phone battle; 320px layout; no JS errors.",
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
