import "./soft-deletable-handler.subscriber";

import { Filter, FilterQuery } from "@mikro-orm/core";
import { OperatorMap } from "@mikro-orm/core/dist/typings";

import { SOFT_DELETABLE } from "./soft-deletable.symbol";
import { SOFT_DELETABLE_FILTER } from "./soft-deletable-filter.constant";
import { SoftDeletableFilterArgs } from "./soft-deletable-filter-args.interface";
import { SoftDeletableHandlerSubscriber } from "./soft-deletable-handler.subscriber";
import { SoftDeletableMetadata } from "./soft-deletable-metadata.interface";

/**
 * Mark an entity type as soft-deletable.
 * @param type - Helper function for type inference.
 * @param field - Identifier field used to identify deleted entities.
 * @param value - Value to set to the identifier field in deletions.
 * @returns
 * @see SoftDeletableHandlerSubscriber
 */
export const SoftDeletable =
  <Entity, Field extends keyof Entity>(
    type: () => Type<Entity>,
    field: Field,
    value: () => Entity[Field],
  ) =>
  (type: Type<Entity>): void => {
    const metadata: SoftDeletableMetadata<Entity, Field> = { field, value };
    Reflect.defineMetadata(SOFT_DELETABLE, metadata, type);

    Filter<Entity>({
      name: SOFT_DELETABLE_FILTER,
      cond: ({ includeDeleted = false }: SoftDeletableFilterArgs = {}) =>
        ({
          [field]: includeDeleted
            ? ({ $ne: null } as OperatorMap<Entity[Field]>)
            : null,
        } as FilterQuery<Entity>),
      default: true,
    })(type);
  };

interface Type<T> {
  new (...args: any[]): T;
  prototype: T;
}

SoftDeletableHandlerSubscriber;
