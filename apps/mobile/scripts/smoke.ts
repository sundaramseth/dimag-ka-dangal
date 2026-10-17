import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { makeMaze } from "../src/engine/maze";
import { makeZipLevel } from "../src/engine/zip";
async function main() {
  mkdirSync("test-results",{recursive:true});
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
            : file.endsWith(".wav")
              ? "audio/wav"
              : "application/octet-stream",
      );
      res.end(readFileSync(file));
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(8082, "127.0.0.1", r));
  const b = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--single-process",
      "--disable-gpu",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => {
      Math.random = () => 0.5;
      (window as any).__audio = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        (window as any).__audio.push(this);
        return play.call(this);
      };
    });
    await p.goto("http://127.0.0.1:8082");
    await p.getByText("PUZZLE ADVENTURES", { exact: true }).waitFor();
    await p.getByLabel("0 gems", { exact: true }).waitFor();
    await p.screenshot({ path: "test-results/landing-preview.png" });
    await p.getByRole("button", { name: "♧ Friends", exact: true }).click();
    await p
      .getByRole("button", { name: "G · Continue with Google", exact: true })
      .waitFor();
    await p
      .getByRole("button", { name: "New here? Create account", exact: true })
      .click();
    await p
      .getByRole("button", { name: "Create account", exact: true })
      .waitFor();
    await p.getByRole("button", { name: "×", exact: true }).click();
    await p.getByRole("button", { name: /Play · Puzzle/ }).click();
    await p.getByText("Your journey", { exact: true }).waitFor();
    const first = await p
      .getByRole("button", { name: "Puzzle 1, play", exact: true })
      .boundingBox();
    const second = await p
      .getByRole("button", { name: "Puzzle 2, locked", exact: true })
      .boundingBox();
    assert.ok(first && second && second.y < first.y);
    await p.screenshot({ path: "test-results/journey-preview.png" });
    const solve = async (game: "zip" | "maze", index = 0, variant = 0) => {
      const level =
        game === "maze"
          ? makeMaze(index, variant)
          : makeZipLevel(index, variant);
      const box = async (c: number) => {
        const label = `Trail cell ${c + 1}${level.checkpoints[c] ? `, number ${level.checkpoints[c]}` : ""}`;
        const b = await p
          .getByRole("button", { name: label, exact: true })
          .boundingBox();
        if (!b) throw Error("Missing cell");
        return b;
      };
      const a = await box(level.solution[0]);
      await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await p.mouse.down();
      for (const c of level.solution.slice(1)) {
        const b = await box(c);
        await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 1 });
      }
      await p.mouse.up();
      await p.getByText("Puzzle cleared!", { exact: true }).waitFor();
    };
    await p
      .getByRole("button", { name: "Puzzle 1, play", exact: true })
      .click();
    await p.getByLabel("0 gems", { exact: true }).waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "Hint · 💎5", exact: true })
        .isDisabled(),
      true,
    );
    await solve("zip");
    assert.equal(
      await p
        .getByRole("button", { name: "Next puzzle →", exact: true })
        .count(),
      0,
    );
    await p.screenshot({ path: "test-results/celebration-preview.png" });
    await p
      .getByRole("button", { name: "Next puzzle →", exact: true })
      .waitFor();
    await p.getByRole("button", { name: "Journey", exact: true }).click();
    await p.getByLabel("12 gems", { exact: true }).waitFor();
    await p.getByRole("button", { name: /Maze Runner/ }).click();
    await p
      .getByRole("button", { name: "Puzzle 1, play", exact: true })
      .click();
    await p.getByLabel("12 gems", { exact: true }).waitFor();
    assert.equal(await p.getByText("◆", { exact: true }).count(), 0);
    await p.screenshot({ path: "test-results/maze-preview.png" });
    await p.getByRole("button", { name: "Hint · 💎5", exact: true }).click();
    await p.getByLabel("7 gems", { exact: true }).waitFor();
    await p.getByRole("button", { name: "‹", exact: true }).click();
    await p.reload();
    await p.getByLabel("7 gems", { exact: true }).waitFor();
    await p
      .getByRole("button", { name: "Select Maze Runner", exact: true })
      .click();
    await p.getByRole("button", { name: /Play · Puzzle/ }).click();
    await p
      .getByRole("button", { name: "Puzzle 1, play", exact: true })
      .click();
    await solve("maze");
    await p
      .getByRole("button", { name: "Next puzzle →", exact: true })
      .waitFor();
    await p.getByRole("button", { name: "Journey", exact: true }).click();
    await p.getByLabel("19 gems", { exact: true }).waitFor();
    // Family battle uses deterministic fixture random; no gem farming or free hints.
    await p.getByRole("button", { name: /Battle/ }).click();
    await p.getByRole("button", { name: "Start battle", exact: true }).click();
    await solve("maze", 1, 500000);
    await p
      .getByRole("button", { name: "Next: Player 2", exact: true })
      .waitFor();
    await p
      .getByRole("button", { name: "Next: Player 2", exact: true })
      .click();
    await solve("maze", 1, 500000);
    await p.getByText("Final standings", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Journey", exact: true }).click();
    const wallet = await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dangal-state-v1")!).wallets[
          "player-1"
        ],
    );
    assert.equal(wallet.gems, 19);
    assert.ok(
      await p.evaluate(() =>
        ((window as any).__audio as HTMLMediaElement[]).some(
          (a) => a.currentTime > 0 && a.duration > 0,
        ),
      ),
      "Audio must actually progress after interaction",
    );
    await p.setViewportSize({ width: 320, height: 568 });
    await p.getByRole("button", { name: "Home", exact: true }).click();
    const last = await p
      .getByRole("button", { name: "♛ Rankings", exact: true })
      .boundingBox();
    assert.ok(
      last && last.y + last.height <= 568,
      "Landing controls fit small phones",
    );
    await p.getByRole("button", { name: /Play · Puzzle/ }).click();
    await p.getByRole("button", { name: /Play · Puzzle/ }).click();
    const hint = await p
      .getByRole("button", { name: "Hint · 💎5", exact: true })
      .boundingBox();
    assert.ok(
      hint && hint.y + hint.height <= 568,
      "Fixed gameplay controls fit",
    );
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await p.getByRole("button", { name: "‹", exact: true }).click();
    // Isolated fixture tests later chapters and distinct companions, not production progress.
    await p.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("dangal-state-v1")!);
      const base = s.attempts.find(
        (a: any) => a.game === "maze" && !a.sessionId,
      );
      s.attempts.push(
        ...Array.from({ length: 20 }, (_, level) => ({
          ...base,
          id: "chapter-fixture-" + level,
          level,
        })),
      );
      s.wallets = {};
      localStorage.setItem("dangal-state-v1", JSON.stringify(s));
    });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.reload();
    await p
      .getByRole("button", { name: "Select Maze Runner", exact: true })
      .click();
    await p.getByRole("button", { name: /Play · Puzzle/ }).click();
    await p
      .getByRole("button", { name: "Puzzle 21, play", exact: true })
      .click();
    await p
      .getByLabel("Nila, chapter companion", { exact: true })
      .first()
      .waitFor();
    await p.screenshot({ path: "test-results/waterfall-preview.png" });
    await solve("maze", 20);
    await p
      .getByRole("button", { name: "Next puzzle →", exact: true })
      .waitFor();
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS: landing, login forms, upward map, paid/persistent hints, header gems, no maze markers, both drags, delayed rewards, family fairness, real web audio progress, small fixed screens, chapter companion.",
    );
  } finally {
    await b.close();
    server.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
