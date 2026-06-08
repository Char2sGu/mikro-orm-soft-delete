import { SoftDeletableConfig } from "./common.js";

/**
 * Soft-delete configs keyed by entity class.
 *
 * We deliberately avoid `reflect-metadata` here so that `SoftDeletable` works
 * regardless of whether the consumer compiles with legacy (`experimentalDecorators`)
 * or ES (TC39) decorators.
 */
const configs = new WeakMap<object, SoftDeletableConfig<any, any>>();

export function setSoftDeletableConfig(
  type: object,
  config: SoftDeletableConfig<any, any>,
): void {
  configs.set(type, config);
}

/**
 * Look up the soft-delete config for an entity class, walking up the prototype
 * chain so that subclasses inherit the config of a decorated (abstract) base.
 */
export function getSoftDeletableConfig(
  type: object,
): SoftDeletableConfig<any, any> | undefined {
  for (
    let current: object | null = type;
    current;
    current = Object.getPrototypeOf(current)
  ) {
    const config = configs.get(current);
    if (config) {
      return config;
    }
  }
  return undefined;
}
