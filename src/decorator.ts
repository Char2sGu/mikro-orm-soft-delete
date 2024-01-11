import "./handler";

import { Filter, FilterQuery } from "@mikro-orm/core";

import {
  SOFT_DELETABLE,
  SOFT_DELETABLE_FILTER,
  SoftDeletableConfig,
} from "./common";

interface Type<T> {
  new (...args: any[]): T;
  prototype: T;
}

type EntityDecorator<Entity> = (type: Type<Entity>) => void;

export interface InferableSoftDeletableConfig<
  Entity,
  Field extends keyof Entity,
> extends SoftDeletableConfig<Entity, Field> {
  type: () => Type<Entity>;
}

/**
 * Mark an entity type as soft-deletable.
 * @see SoftDeletionEventSubscriber
 */
export function SoftDeletable<Entity, Field extends keyof Entity>(
  config: InferableSoftDeletableConfig<Entity, Field>,
): EntityDecorator<Entity>;
/**
 * Mark an entity type as soft-deletable.
 * @param type - Helper function for type inference.
 * @param field - Identifier field used to identify deleted entities.
 * @param value - Value to set to the identifier field in deletions.
 * @param valueInitial - Value to identify entities that is NOT soft-deleted. Defaults to `null`.
 * @see SoftDeletionEventSubscriber
 */
export function SoftDeletable<Entity, Field extends keyof Entity>(
  type: () => Type<Entity>,
  field: Field,
  value: () => Entity[Field],
  valueInitial?: Entity[Field],
): EntityDecorator<Entity>;
export function SoftDeletable<Entity, Field extends keyof Entity>(
  _configOrType:
    | InferableSoftDeletableConfig<Entity, Field>
    | (() => Type<Entity>),
  _field?: Field,
  _value?: () => Entity[Field],
  _valueInitial?: Entity[Field],
): EntityDecorator<Entity> {
  const config =
    typeof _configOrType === "function"
      ? _field && _value
        ? {
            type: _configOrType,
            field: _field,
            value: _value,
            valueInitial: _valueInitial,
          }
        : null
      : _configOrType;
  if (!config) throw new Error("Invalid arguments");

  return (type: Type<Entity>): void => {
    Reflect.defineMetadata(SOFT_DELETABLE, config, type);
    const { field, valueInitial } = config;
    Filter<Entity>({
      name: SOFT_DELETABLE_FILTER,
      cond: { [field]: valueInitial ?? null } as FilterQuery<Entity>,
      default: true,
    })(type);
  };
}
