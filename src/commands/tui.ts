import { resolveTarget } from "./shared.js";

export interface TuiOptions {
  home?: string;
}

/**
 * Ink/React are only imported here, lazily — the scan/doctor/diff/init code paths stay
 * ink-free so their startup time and bundle weight are unaffected by the TUI dependency.
 */
export async function runTuiCommand(dir: string | undefined, options: TuiOptions): Promise<void> {
  const [{ render }, React, { App }] = await Promise.all([
    import("ink"),
    import("react"),
    import("../tui/App.js"),
  ]);

  const target = await resolveTarget(dir, options.home);
  const instance = render(
    React.createElement(App, {
      homeDir: target.homeDir,
      projectDir: target.projectDir,
      config: target.config,
    }),
  );

  await instance.waitUntilExit();
}
