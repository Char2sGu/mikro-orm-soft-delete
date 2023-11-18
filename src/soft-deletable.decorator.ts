import "./soft-deletable-handler.subscriber";

import { Filter, FilterQuery } from "@mikro-orm/core";

import { SOFT_DELETABLE } from "./soft-deletable.symbol";
import { SOFT_DELETABLE_FILTER } from "./soft-deletable-filter.constant";
import { SoftDeletableHandlerSubscriber } from "./soft-deletable-handler.subscriber";
import { SoftDeletableMetadata } from "./soft-deletable-metadata.interface";

/**
 * Mark an entity type as soft-deletable.
 * @param type - Helper function for type inference.
 * @param field - Identifier field used to identify deleted entities.
 * @param value - Value to set to the identifier field in deletions.
 * @param valueInitial - Value to identify entities that is not soft-deleted. Defaults to `null`.
 * @returns
 * @see SoftDeletableHandlerSubscriber
 */
export function SoftDeletable<Entity, Field extends keyof Entity>(
  config: SoftDeletableConfig<Entity, Field>,
): EntityDecorator<Entity>;
export function SoftDeletable<Entity, Field extends keyof Entity>(
  type: () => Type<Entity>,
  field: Field,
  value: () => Entity[Field],
  valueInitial?: Entity[Field],
): EntityDecorator<Entity>;
export function SoftDeletable<Entity, Field extends keyof Entity>(
  _configOrType: SoftDeletableConfig<Entity, Field> | (() => Type<Entity>),
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

  const { field, value, valueInitial } = config;

  return (type: Type<Entity>): void => {
    const metadata: SoftDeletableMetadata<Entity, Field> = { field, value };
    Reflect.defineMetadata(SOFT_DELETABLE, metadata, type);
    Filter<Entity>({
      name: SOFT_DELETABLE_FILTER,
      cond: { [field]: valueInitial ?? null } as FilterQuery<Entity>,
      default: true,
    })(type);
  };
}

export interface SoftDeletableConfig<Entity, Field extends keyof Entity> {
  type: () => Type<Entity>;
  field: Field;
  value: () => Entity[Field];
  valueInitial?: Entity[Field];
}

interface Type<T> {
  new (...args: any[]): T;
  prototype: T;
}

interface EntityDecorator<Entity> {
  (type: Type<Entity>): void;
}

SoftDeletableHandlerSubscriber;
