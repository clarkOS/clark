/**
 * Plugin loader - dynamic plugin loading utilities.
 * @module plugins/loader
 */

import type { Plugin, PluginLoadResult, PluginMeta } from './types.js';

/**
 * Validate a plugin object.
 */
export function validatePlugin(plugin: unknown): plugin is Plugin {
  if (!plugin || typeof plugin !== 'object') return false;

  const p = plugin as Record<string, unknown>;

  if (typeof p.name !== 'string' || !p.name) return false;
  if (typeof p.version !== 'string' || !p.version) return false;

  if (p.init !== undefined && typeof p.init !== 'function') return false;
  if (p.cleanup !== undefined && typeof p.cleanup !== 'function') return false;
  if (p.onTick !== undefined && typeof p.onTick !== 'function') return false;

  if (p.actions !== undefined) {
    if (typeof p.actions !== 'object') return false;
    for (const [, action] of Object.entries(p.actions as Record<string, unknown>)) {
      if (typeof action !== 'function') return false;
    }
  }

  return true;
}

/**
 * Load a plugin from a module path.
 */
export async function loadPlugin(modulePath: string): Promise<PluginLoadResult> {
  try {
    const module = await import(modulePath);
    const plugin = module.default ?? module.plugin ?? module;

    if (!validatePlugin(plugin)) {
      return {
        success: false,
        error: `Invalid plugin structure in "${modulePath}"`,
      };
    }

    return { success: true, plugin };
  } catch (err) {
    return {
      success: false,
      error: `Failed to load plugin from "${modulePath}": ${err}`,
    };
  }
}

/**
 * Create a simple plugin.
 */
export function definePlugin(definition: Plugin): Plugin {
  if (!validatePlugin(definition)) {
    throw new Error('Invalid plugin definition');
  }
  return definition;
}

/**
 * Get plugin metadata without loading.
 */
export function getPluginMeta(plugin: Plugin): PluginMeta {
  return {
    name: plugin.name,
    version: plugin.version,
    description: plugin.description,
    dependencies: plugin.dependencies,
  };
}

/**
 * Sort plugins by dependencies.
 */
export function sortPluginsByDependencies(plugins: Plugin[]): Plugin[] {
  const sorted: Plugin[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const pluginMap = new Map(plugins.map((p) => [p.name, p]));

  function visit(plugin: Plugin): void {
    if (visited.has(plugin.name)) return;
    if (visiting.has(plugin.name)) {
      throw new Error(`Circular dependency detected: ${plugin.name}`);
    }

    visiting.add(plugin.name);

    for (const dep of plugin.dependencies ?? []) {
      const depPlugin = pluginMap.get(dep);
      if (depPlugin) {
        visit(depPlugin);
      }
    }

    visiting.delete(plugin.name);
    visited.add(plugin.name);
    sorted.push(plugin);
  }

  for (const plugin of plugins) {
    visit(plugin);
  }

  return sorted;
}
