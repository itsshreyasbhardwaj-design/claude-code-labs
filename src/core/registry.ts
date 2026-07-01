import { agentsSource } from "../sources/agents.source.js";
import { claudeMdSource } from "../sources/claude-md.source.js";
import { commandsSource } from "../sources/commands.source.js";
import { mcpSource } from "../sources/mcp.source.js";
import { settingsSource } from "../sources/settings.source.js";
import { skillsSource } from "../sources/skills.source.js";
import type { ContextSource } from "./types.js";

export class SourceRegistry {
  private sources = new Map<string, ContextSource>();

  register(source: ContextSource): void {
    if (this.sources.has(source.id)) {
      throw new Error(`A ContextSource with id "${source.id}" is already registered`);
    }
    this.sources.set(source.id, source);
  }

  list(): ContextSource[] {
    return [...this.sources.values()];
  }

  get(id: string): ContextSource | undefined {
    return this.sources.get(id);
  }
}

export function createDefaultRegistry(): SourceRegistry {
  const registry = new SourceRegistry();
  for (const source of [
    claudeMdSource,
    skillsSource,
    agentsSource,
    commandsSource,
    mcpSource,
    settingsSource,
  ]) {
    registry.register(source);
  }
  return registry;
}
