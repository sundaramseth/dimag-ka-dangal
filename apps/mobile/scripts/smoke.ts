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
      "--autoplay-policy=no-user-gesture-required",
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
    const firstNode = await page
      .getByRole("button", { name: "Puzzle 1, play", exact: true })
      .boundingBox();
    const secondNode = await page
      .getByRole("button", { name: "Puzzle 2, locked", exact: true })
      .boundingBox();
    assert.ok(
      firstNode && secondNode && secondNode.y < firstNode.y,
      "Journey must climb upward",
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
      await page.getByText("Puzzle cleared!", { exact: true }).waitFor();
    };
    await page
      .getByRole("button", { name: "Puzzle 1, play", exact: true })
      .click();
    await solve("zip");
    await page.getByText("Collecting rewards…", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Next puzzle →", exact: true })
        .count(),
      0,
    );
    await page.screenshot({ path: "celebration-preview.png" });
    await page
      .getByRole("button", { name: "Next puzzle →", exact: true })
      .waitFor();
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
    await page
      .getByRole("button", { name: "Next puzzle →", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Journey", exact: true }).click();
    await page.getByRole("button", { name: /Battle/ }).click();
    await page
      .getByRole("button", { name: "Start battle", exact: true })
      .click();
    for (
      let i = 0;
      i < 100 &&
      !(await page.getByText("Puzzle cleared!", { exact: true }).count());
      i++
    )
      await page.getByRole("button", { name: "Hint ✦", exact: true }).click();
    await page
      .getByRole("button", { name: "Next: Player 2", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Next: Player 2", exact: true })
      .click();
    for (
      let i = 0;
      i < 100 &&
      !(await page.getByText("Puzzle cleared!", { exact: true }).count());
      i++
    )
      await page.getByRole("button", { name: "Hint ✦", exact: true }).click();
    await page.getByText("Final standings", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Journey", exact: true }).click();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("dangal-state-v1")!),
    );
    assert.equal(stored.wallets["player-1"].gems, 24);
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("dangal-state-v1")!);
      const base = s.attempts.find(
        (a: any) => a.game === "zip" && !a.sessionId,
      );
      s.attempts = [
        ...s.attempts,
        ...[1, 2, 3, 4].map((level) => ({
          ...base,
          id: "fixture-" + level,
          level,
        })),
      ];
      s.wallets = {};
      localStorage.setItem("dangal-state-v1", JSON.stringify(s));
    });
    await page.reload();
    await page.getByRole("button", { name: "Themes", exact: true }).click();
    await page
      .getByRole("button", { name: "Unlock · ◆ 60 · 5 wins", exact: true })
      .click();
    await page
      .getByRole("button", { name: "✓ Equipped", exact: true })
      .waitFor();
    await page.screenshot({ path: "themes-preview.png" });
    await page.getByRole("button", { name: "×", exact: true }).click();
    await page.reload();
    const wallet = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dangal-state-v1")!).wallets[
          "player-1"
        ],
    );
    assert.equal(wallet.selected, "twilight");
    assert.equal(wallet.gems, 12);
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
    await page.getByRole('button',{name:'‹',exact:true}).click();
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('dangal-state-v1')!);const base=s.attempts.find((a:any)=>a.game==='maze'&&!a.sessionId);s.attempts=[...s.attempts,...Array.from({length:20},(_,level)=>({...base,id:'chapter-fixture-'+level,level}))];s.wallets={};localStorage.setItem('dangal-state-v1',JSON.stringify(s));});
    await page.reload();await page.getByRole('button',{name:/Maze Runner/}).click();
    await page.getByRole('button',{name:'Puzzle 11, completed',exact:true}).click();
    await page.screenshot({path:'mountain-preview.png'});
    await page.getByRole('button',{name:'‹',exact:true}).click();
    await page.getByRole('button',{name:'Puzzle 21, play',exact:true}).click();
    await page.screenshot({path:'waterfall-preview.png'});
    await solve('maze',20);
    await page.getByRole('button',{name:'Next puzzle →',exact:true}).waitFor();
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS: continuous drag, upward journey, delayed celebration, gems, theme purchase/reload, same-phone battle, compact layout, no JS errors.",
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
