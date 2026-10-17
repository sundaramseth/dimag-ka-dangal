// UI fixtures only. Hosted SQL policy tests are separate; this does NOT prove live Google/Auth.
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
async function main() {
  const server = createServer((req, res) => {
    let f = path.join(path.resolve("dist"), (req.url || "/").split("?")[0]);
    if (!path.extname(f)) f = path.resolve("dist/index.html");
    try {
      res.setHeader(
        "Content-Type",
        f.endsWith(".js")
          ? "application/javascript"
          : f.endsWith(".html")
            ? "text/html"
            : "application/octet-stream",
      );
      res.end(readFileSync(f));
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(8084, "127.0.0.1", r));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    headless: true,
    args: [
      "--no-sandbox",
      "--single-process",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const me = "10000000-0000-4000-8000-000000000001",
      peer = "10000000-0000-4000-8000-000000000002";
    const calls: string[] = [];
    let friends = [
      {
        peer_id: peer,
        handle: "test_friend",
        display_name: "Fixture Friend",
        status: "pending",
        incoming: true,
        online: true,
      },
    ];
    let inbox: any[] = [];
    await p.addInitScript(
      ({ me }) => {
        const jwt =
          btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })) +
          "." +
          btoa(
            JSON.stringify({ sub: me, exp: 2147483647, role: "authenticated" }),
          ) +
          ".fixture";
        sessionStorage.setItem(
          "sb-qwpkqfnxbghwjztnytqh-auth-token",
          JSON.stringify({
            access_token: jwt,
            refresh_token: "fixture-refresh",
            token_type: "bearer",
            expires_at: 2147483647,
            expires_in: 3600,
            user: {
              id: me,
              aud: "authenticated",
              role: "authenticated",
              app_metadata: { provider: "email" },
              user_metadata: {},
              email: "fixture@example.invalid",
              created_at: "2026-10-17T00:00:00Z",
            },
          }),
        );
      },
      { me },
    );
    await p.route(
      "https://qwpkqfnxbghwjztnytqh.supabase.co/**",
      async (route) => {
        const req = route.request(),
          url = new URL(req.url());
        const body = req.postDataJSON() || {};
        let data: any = null;
        if (url.pathname.includes("/rest/v1/dangal_profiles"))
          data = [{ id: me, handle: "fixture_me", display_name: "Fixture Me" }];
        else if (url.pathname.includes("/auth/v1/user")) data = { id: me };
        else {
          const name = url.pathname.split("/").at(-1)!;
          calls.push(name);
          if (name === "dangal_friend_page")
            data = body.p_offset ? [] : friends;
          if (name === "dangal_accept_friend")
            friends = friends.map((f) => ({ ...f, status: "accepted" }));
          if (name === "dangal_request_friend") data = null;
          if (name === "dangal_match_inbox") data = inbox;
          if (name === "dangal_accept_match") {
            inbox = inbox.map((m) => ({
              ...m,
              state: "active",
              starts_at: new Date(Date.now() + 120000).toISOString(),
            }));
            data = inbox[0];
          }
          if (name === "dangal_match_state") data = inbox[0];
          if (name === "dangal_leave_match") {
            inbox = [];
            data = null;
          }
          if (name === "dangal_rankings") {
            data = body.p_friends
              ? body.p_offset
                ? []
                : Array.from({ length: 65 }, (_, i) => ({
                    position: i + 1,
                    id: i === 2 ? me : "friend" + i,
                    name: i === 2 ? "Fixture Me" : "Friend " + i,
                    handle: "friend_" + i,
                    wins: 65 - i,
                    is_self: i === 2,
                  }))
              : [
                  ...Array.from({ length: 50 }, (_, i) => ({
                    position: i + 1,
                    id: "rank" + i,
                    name: "Ranker " + i,
                    handle: "ranker_" + i,
                    wins: 100 - i,
                    is_self: false,
                  })),
                  {
                    position: 81,
                    id: me,
                    name: "Fixture Me",
                    handle: "fixture_me",
                    wins: 1,
                    is_self: true,
                  },
                ];
          }
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(data),
        });
      },
    );
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:8084");
    await p.getByRole("button", { name: "♧ Friends", exact: true }).click();
    await p
      .getByRole("button", { name: "Accept friend", exact: true })
      .waitFor();
    await p.getByRole("button", { name: "Accept friend", exact: true }).click();
    await p
      .getByRole("button", { name: "Invite to play", exact: true })
      .waitFor();
    await p.getByText("● Online", { exact: true }).waitFor();
    assert.ok(calls.includes("dangal_accept_friend"));
    await p.getByLabel("Friend handle", { exact: true }).fill("new_friend");
    await p.getByRole("button", { name: "Add", exact: true }).click();
    await p.getByText("Friend request sent", { exact: true }).waitFor();
    assert.ok(calls.includes("dangal_request_friend"));
    await p.getByRole("button", { name: "×", exact: true }).click();
    await p.getByRole("button", { name: "♛ Rankings", exact: true }).click();
    await p
      .getByRole("button", { name: "Public · Top 50", exact: true })
      .waitFor();
    await p.getByText("YOUR POSITION", { exact: true }).waitFor();
    assert.equal(await p.getByLabel(/Rank 81, Fixture Me/).count(), 1);
    await p.getByRole("button", { name: "Friends · All", exact: true }).click();
    await p.getByLabel("Rank 65, Friend 64, 1 wins", { exact: true }).waitFor();
    assert.equal(
      await p.getByText("YOUR POSITION", { exact: true }).count(),
      0,
    );
    await p.getByRole("button", { name: "×", exact: true }).click();
    inbox = [
      {
        id: "20000000-0000-4000-8000-000000000001",
        game: "maze",
        puzzle: 0,
        seed: 99,
        user_a: peer,
        user_b: me,
        state: "invited",
        starts_at: null,
        expires_at: new Date(Date.now() + 150000).toISOString(),
        server_now: new Date().toISOString(),
        winner: null,
        players: [
          {
            id: me,
            name: "Fixture Me",
            handle: "fixture_me",
            elapsed_ms: null,
          },
          {
            id: peer,
            name: "Fixture Friend",
            handle: "test_friend",
            elapsed_ms: null,
          },
        ],
      },
    ];
    await p.getByRole("button", { name: "⚔ Play online", exact: true }).click();
    await p
      .getByRole("button", { name: "Accept game", exact: true })
      .waitFor({ timeout: 12000 });
    await p.getByRole("button", { name: "Accept game", exact: true }).click();
    await p.getByText("Match found · starting…", { exact: true }).waitFor();
    assert.ok(calls.includes("dangal_accept_match"));
    await p
      .getByRole("button", { name: "Cancel / leave", exact: true })
      .click();
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS UI fixtures: incoming accept, live status label, friend send, top50+own below50, 65 friends with no 50-person cap, incoming game accept/cancel. No real users or Auth sessions created.",
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
