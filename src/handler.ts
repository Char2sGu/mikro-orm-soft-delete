import {
  ChangeSet,
  ChangeSetType,
  EventSubscriber,
  FlushEventArgs,
  MikroORM,
} from "@mikro-orm/core";

import { SoftDeletableConfig } from "./common.js";
import { getSoftDeletableConfig } from "./storage.js";

/**
 * Intercept deletions of soft-deletable entities and perform updates instead.
 *
 * @see SoftDeletable
 * @see https://github.com/mikro-orm/mikro-orm/issues/1492#issuecomment-785394397
 */
export class SoftDeleteHandler implements EventSubscriber {
  static register(orm: MikroORM): void {
    orm.em.getEventManager().registerSubscriber(new this());
  }

  async onFlush({ uow }: FlushEventArgs): Promise<void> {
    uow
      .getChangeSets()
      .forEach(
        <Entity extends object, Field extends keyof Entity>(
          item: ChangeSet<Entity>,
        ) => {
          const config = getSoftDeletableConfig(item.entity.constructor) as
            | SoftDeletableConfig<Entity, Field>
            | undefined;
          if (item.type === ChangeSetType.DELETE && config) {
            const { field, value } = config;

            item.type = ChangeSetType.UPDATE;
            item.entity[field] = value();
            item.payload[field] = value();

            // Don't recompute here. Otherwise ManyToOne relation fields will be
            // set to `null` and cause a `NotNullConstraintViolationException`.
            // This only appear when using `cascade: [Cascade.ALL],
            // it will be fine to recompute here when using
            // `orphanRemoval: true`.
            // But because we can't catch the deletions caused by
            // `orphanRemoval`, we still chose `cascade: [Cascade.ALL],
            // uow.recomputeSingleChangeSet(item.entity);
          }
        },
      );
  }
}
