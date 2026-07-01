import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { App } from "../../src/tui/App.js";
import { DEFAULT_TEST_CONFIG, fixture } from "../helpers.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Writes a key and gives ink's stdin listener a tick to actually receive it before polling. */
async function pressKey(stdin: { write: (data: string) => void }, key: string): Promise<void> {
  stdin.write(key);
  await sleep(30);
}

async function waitForFrame(
  lastFrame: () => string | undefined,
  predicate: (frame: string) => boolean,
  timeoutMs = 4000,
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const frame = lastFrame();
    if (frame && predicate(frame)) return frame;
    await sleep(20);
  }
  throw new Error(`Timed out waiting for expected frame. Last frame:\n${lastFrame() ?? "(empty)"}`);
}

describe("App", () => {
  const home = fixture("kitchen-sink", "home");
  const project = fixture("kitchen-sink", "project");

  it("renders the dashboard with all 6 categories after loading", async () => {
    const { lastFrame, unmount } = render(
      <App homeDir={home} projectDir={project} config={DEFAULT_TEST_CONFIG} />,
    );

    const frame = await waitForFrame(lastFrame, (f) => f.includes("Aperture"));
    for (const category of ["claude-md", "skills", "agents", "commands", "mcp", "settings"]) {
      expect(frame).toContain(category);
    }

    unmount();
  });

  it("navigates dashboard -> drilldown -> back -> trim suggestions", async () => {
    const { lastFrame, stdin, unmount } = render(
      <App homeDir={home} projectDir={project} config={DEFAULT_TEST_CONFIG} />,
    );

    await waitForFrame(lastFrame, (f) => f.includes("Aperture"));

    await pressKey(stdin, "\r");
    const drilldownFrame = await waitForFrame(lastFrame, (f) => f.includes("Dashboard ›"));
    expect(drilldownFrame).toContain("Esc/← back");

    // Use the global 'd' shortcut rather than Escape — more reliable to simulate over a raw
    // stdin pipe than a bare ESC byte, and it exercises a distinct code path (App-level keymap).
    await pressKey(stdin, "d");
    await waitForFrame(lastFrame, (f) => f.includes("Enter/→ drill in"));

    await pressKey(stdin, "t");
    await waitForFrame(lastFrame, (f) => f.includes("Trim suggestions"));

    unmount();
  });

  it("quits without throwing when 'q' is pressed", async () => {
    const { lastFrame, stdin, unmount } = render(
      <App homeDir={home} projectDir={project} config={DEFAULT_TEST_CONFIG} />,
    );

    await waitForFrame(lastFrame, (f) => f.includes("Aperture"));
    expect(() => stdin.write("q")).not.toThrow();

    unmount();
  });
});
