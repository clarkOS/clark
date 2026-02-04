/**
 * Template Engine
 *
 * Simple but powerful template system for prompt generation.
 * Uses {{variable}} syntax with support for nested objects and conditionals.
 */

/**
 * Compiled template function
 */
export type CompiledTemplate = (context: Record<string, unknown>) => string;

/**
 * Template options
 */
export interface TemplateOptions {
  /** Prefix for variables (default: '{{') */
  prefix?: string;
  /** Suffix for variables (default: '}}') */
  suffix?: string;
  /** Throw on missing variables (default: false) */
  strict?: boolean;
  /** Default value for missing variables */
  defaultValue?: string;
}

const DEFAULT_OPTIONS: TemplateOptions = {
  prefix: '{{',
  suffix: '}}',
  strict: false,
  defaultValue: '',
};

/**
 * Template Engine class
 */
export class TemplateEngine {
  private templates = new Map<string, string>();
  private compiled = new Map<string, CompiledTemplate>();
  private options: TemplateOptions;

  constructor(options: TemplateOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Register a template by name
   */
  register(name: string, template: string): void {
    this.templates.set(name, template);
    // Clear compiled cache for this template
    this.compiled.delete(name);
  }

  /**
   * Check if a template exists
   */
  has(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * Get raw template string
   */
  getRaw(name: string): string | undefined {
    return this.templates.get(name);
  }

  /**
   * Compile a template string into a function
   */
  compile(template: string): CompiledTemplate {
    const { prefix, suffix, strict, defaultValue } = this.options;

    // Escape special regex characters in prefix/suffix
    const escapedPrefix = prefix!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedSuffix = suffix!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match {{variable}} or {{object.property}}
    const variableRegex = new RegExp(
      `${escapedPrefix}\\s*([\\w.]+)\\s*${escapedSuffix}`,
      'g'
    );

    // Match {{#if condition}}...{{/if}}
    const conditionalRegex = new RegExp(
      `${escapedPrefix}#if\\s+([\\w.]+)${escapedSuffix}([\\s\\S]*?)${escapedPrefix}/if${escapedSuffix}`,
      'g'
    );

    // Match {{#each array}}...{{/each}}
    const eachRegex = new RegExp(
      `${escapedPrefix}#each\\s+([\\w.]+)${escapedSuffix}([\\s\\S]*?)${escapedPrefix}/each${escapedSuffix}`,
      'g'
    );

    return (context: Record<string, unknown>): string => {
      let result = template;

      // Process conditionals first
      result = result.replace(conditionalRegex, (_, condition, content) => {
        const value = getNestedValue(context, condition);
        return value ? content : '';
      });

      // Process each loops
      result = result.replace(eachRegex, (_, arrayPath, itemTemplate) => {
        const array = getNestedValue(context, arrayPath);
        if (!Array.isArray(array)) return '';

        return array
          .map((item, index) => {
            // Create item context with special variables
            const itemContext = {
              ...context,
              item,
              index,
              isFirst: index === 0,
              isLast: index === array.length - 1,
            };

            // Replace {{item}} and {{item.property}} in the template
            return itemTemplate.replace(variableRegex, (_: string, path: string) => {
              if (path === 'item') return String(item);
              if (path.startsWith('item.')) {
                const itemPath = path.slice(5);
                return String(getNestedValue(item as Record<string, unknown>, itemPath) ?? defaultValue);
              }
              return String(getNestedValue(itemContext, path) ?? defaultValue);
            });
          })
          .join('');
      });

      // Process simple variables
      result = result.replace(variableRegex, (_, path) => {
        const value = getNestedValue(context, path);

        if (value === undefined || value === null) {
          if (strict) {
            throw new Error(`Template variable "${path}" is undefined`);
          }
          return defaultValue!;
        }

        return String(value);
      });

      return result;
    };
  }

  /**
   * Render a registered template with context
   */
  render(name: string, context: Record<string, unknown>): string {
    // Check if template exists
    if (!this.templates.has(name)) {
      throw new Error(`Template "${name}" not found`);
    }

    // Get or compile template
    let compiled = this.compiled.get(name);
    if (!compiled) {
      compiled = this.compile(this.templates.get(name)!);
      this.compiled.set(name, compiled);
    }

    return compiled(context);
  }

  /**
   * Render a template string directly (without registration)
   */
  renderString(template: string, context: Record<string, unknown>): string {
    return this.compile(template)(context);
  }

  /**
   * Clear all registered templates
   */
  clear(): void {
    this.templates.clear();
    this.compiled.clear();
  }

  /**
   * Get all registered template names
   */
  getNames(): string[] {
    return [...this.templates.keys()];
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Default global template engine instance
 */
export const templateEngine = new TemplateEngine();

/**
 * Helper to register multiple templates at once
 */
export function registerTemplates(
  templates: Record<string, string>,
  engine: TemplateEngine = templateEngine
): void {
  for (const [name, template] of Object.entries(templates)) {
    engine.register(name, template);
  }
}
