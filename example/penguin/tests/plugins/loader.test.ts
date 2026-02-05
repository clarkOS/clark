/**
 * Tests for plugin loader.
 * @module tests/plugins/loader
 */

import {
  validatePlugin,
  definePlugin,
  getPluginMeta,
  sortPluginsByDependencies,
} from '../../src/plugins/loader.js';
import type { Plugin } from '../../src/plugins/types.js';

describe('validatePlugin', () => {
  it('validates a minimal valid plugin', () => {
    const plugin = {
      name: 'test-plugin',
      version: '1.0.0',
    };

    expect(validatePlugin(plugin)).toBe(true);
  });

  it('validates a full-featured plugin', () => {
    const plugin: Plugin = {
      name: 'full-plugin',
      version: '2.0.0',
      description: 'A fully featured plugin',
      dependencies: ['other-plugin'],
      init: () => {},
      cleanup: () => {},
      onTick: () => {},
      actions: {
        doSomething: async () => ({ success: true }),
      },
    };

    expect(validatePlugin(plugin)).toBe(true);
  });

  it('rejects null', () => {
    expect(validatePlugin(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validatePlugin(undefined)).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(validatePlugin('string')).toBe(false);
    expect(validatePlugin(123)).toBe(false);
    expect(validatePlugin([])).toBe(false);
  });

  it('rejects plugin without name', () => {
    const plugin = { version: '1.0.0' };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects plugin with empty name', () => {
    const plugin = { name: '', version: '1.0.0' };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects plugin with non-string name', () => {
    const plugin = { name: 123, version: '1.0.0' };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects plugin without version', () => {
    const plugin = { name: 'test' };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects plugin with empty version', () => {
    const plugin = { name: 'test', version: '' };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects plugin with non-function init', () => {
    const plugin = {
      name: 'test',
      version: '1.0.0',
      init: 'not a function',
    };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects plugin with non-function cleanup', () => {
    const plugin = {
      name: 'test',
      version: '1.0.0',
      cleanup: {},
    };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects plugin with non-function onTick', () => {
    const plugin = {
      name: 'test',
      version: '1.0.0',
      onTick: 'handler',
    };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects plugin with non-object actions', () => {
    const plugin = {
      name: 'test',
      version: '1.0.0',
      actions: 'not an object',
    };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects plugin with non-function action handlers', () => {
    const plugin = {
      name: 'test',
      version: '1.0.0',
      actions: {
        goodAction: async () => {},
        badAction: 'not a function',
      },
    };
    expect(validatePlugin(plugin)).toBe(false);
  });
});

describe('definePlugin', () => {
  it('returns a valid plugin unchanged', () => {
    const definition: Plugin = {
      name: 'my-plugin',
      version: '1.0.0',
      description: 'My plugin',
    };

    const plugin = definePlugin(definition);

    expect(plugin.name).toBe('my-plugin');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.description).toBe('My plugin');
  });

  it('throws for invalid plugin definition', () => {
    expect(() =>
      definePlugin({ version: '1.0.0' } as Plugin)
    ).toThrow('Invalid plugin definition');
  });
});

describe('getPluginMeta', () => {
  it('extracts metadata from plugin', () => {
    const plugin: Plugin = {
      name: 'test-plugin',
      version: '1.2.3',
      description: 'A test plugin',
      dependencies: ['dep1', 'dep2'],
      onTick: () => {},
    };

    const meta = getPluginMeta(plugin);

    expect(meta.name).toBe('test-plugin');
    expect(meta.version).toBe('1.2.3');
    expect(meta.description).toBe('A test plugin');
    expect(meta.dependencies).toEqual(['dep1', 'dep2']);
  });

  it('handles plugin without optional fields', () => {
    const plugin: Plugin = {
      name: 'minimal',
      version: '0.1.0',
    };

    const meta = getPluginMeta(plugin);

    expect(meta.name).toBe('minimal');
    expect(meta.version).toBe('0.1.0');
    expect(meta.description).toBeUndefined();
    expect(meta.dependencies).toBeUndefined();
  });
});

describe('sortPluginsByDependencies', () => {
  it('returns plugins in dependency order', () => {
    const plugins: Plugin[] = [
      { name: 'c', version: '1.0.0', dependencies: ['b'] },
      { name: 'a', version: '1.0.0' },
      { name: 'b', version: '1.0.0', dependencies: ['a'] },
    ];

    const sorted = sortPluginsByDependencies(plugins);

    // a should come before b, b should come before c
    const aIndex = sorted.findIndex((p) => p.name === 'a');
    const bIndex = sorted.findIndex((p) => p.name === 'b');
    const cIndex = sorted.findIndex((p) => p.name === 'c');

    expect(aIndex).toBeLessThan(bIndex);
    expect(bIndex).toBeLessThan(cIndex);
  });

  it('handles plugins with no dependencies', () => {
    const plugins: Plugin[] = [
      { name: 'a', version: '1.0.0' },
      { name: 'b', version: '1.0.0' },
      { name: 'c', version: '1.0.0' },
    ];

    const sorted = sortPluginsByDependencies(plugins);

    expect(sorted.length).toBe(3);
    expect(sorted.map((p) => p.name)).toContain('a');
    expect(sorted.map((p) => p.name)).toContain('b');
    expect(sorted.map((p) => p.name)).toContain('c');
  });

  it('handles diamond dependencies', () => {
    const plugins: Plugin[] = [
      { name: 'd', version: '1.0.0', dependencies: ['b', 'c'] },
      { name: 'c', version: '1.0.0', dependencies: ['a'] },
      { name: 'b', version: '1.0.0', dependencies: ['a'] },
      { name: 'a', version: '1.0.0' },
    ];

    const sorted = sortPluginsByDependencies(plugins);

    const aIndex = sorted.findIndex((p) => p.name === 'a');
    const bIndex = sorted.findIndex((p) => p.name === 'b');
    const cIndex = sorted.findIndex((p) => p.name === 'c');
    const dIndex = sorted.findIndex((p) => p.name === 'd');

    // a must come before b and c
    expect(aIndex).toBeLessThan(bIndex);
    expect(aIndex).toBeLessThan(cIndex);

    // b and c must come before d
    expect(bIndex).toBeLessThan(dIndex);
    expect(cIndex).toBeLessThan(dIndex);
  });

  it('throws on circular dependency', () => {
    const plugins: Plugin[] = [
      { name: 'a', version: '1.0.0', dependencies: ['b'] },
      { name: 'b', version: '1.0.0', dependencies: ['a'] },
    ];

    expect(() => sortPluginsByDependencies(plugins)).toThrow('Circular dependency');
  });

  it('throws on self-dependency', () => {
    const plugins: Plugin[] = [
      { name: 'a', version: '1.0.0', dependencies: ['a'] },
    ];

    expect(() => sortPluginsByDependencies(plugins)).toThrow('Circular dependency');
  });

  it('handles missing dependencies gracefully', () => {
    const plugins: Plugin[] = [
      { name: 'a', version: '1.0.0', dependencies: ['missing'] },
    ];

    // Should not throw - missing dependencies are ignored
    const sorted = sortPluginsByDependencies(plugins);
    expect(sorted.length).toBe(1);
    expect(sorted[0].name).toBe('a');
  });

  it('returns empty array for empty input', () => {
    const sorted = sortPluginsByDependencies([]);
    expect(sorted).toEqual([]);
  });
});
