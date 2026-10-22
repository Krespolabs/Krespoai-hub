import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
for (const key of ["window", "document", "navigator", "HTMLElement", "Node", "MutationObserver", "getComputedStyle", "localStorage"]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === "getComputedStyle" ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key],
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.React = React;

const [{ cleanup, render, screen }, { default: userEvent }, { default: App }] = await Promise.all([
  import("@testing-library/react"),
  import("@testing-library/user-event"),
  import("../App.jsx"),
]);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("KrespoAI Hub app flows", () => {
  it("shows validation feedback instead of submitting an empty sign-in form", async () => {
    const user = userEvent.setup();
    render(<App />);

    const signInButtons = await screen.findAllByRole("button", { name: "Sign In" }, { timeout: 5000 });
    await user.click(signInButtons.at(-1));

    assert.ok(screen.getByText("Enter email and password."));
  });

  it("opens demo mode and filters marketplace packs by category", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Continue as Demo" }, { timeout: 5000 }));
    assert.ok(await screen.findByText("Hey, Demo 👋"));
    assert.ok(screen.getByText("Demo Mode"));

    await user.click(screen.getByRole("button", { name: "Browse", exact: true }));
    assert.ok(screen.getByPlaceholderText("Search packs or creators..."));

    await user.click(screen.getByRole("button", { name: /Image Gen/ }));
    assert.ok(screen.getByText("Ultimate MidJourney Cinematic Pack"));
    assert.equal(screen.queryByText("TikTok Viral Hook Pack — 30 Hooks"), null);
  });
});
