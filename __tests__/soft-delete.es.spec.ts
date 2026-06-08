import { BaseEntity, EntityClass } from "@mikro-orm/core";
import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/es";
import { MikroORM } from "@mikro-orm/sqlite";

import { SoftDeletable, SoftDeleteHandler } from "../src/index.js";
import { describeSoftDelete } from "./suite.js";

// ES (TC39) decorators carry no `design:type` metadata, so property types are
// declared explicitly and no `ReflectMetadataProvider` is configured.

@SoftDeletable(() => UserDeletedAt, "deletedAt", () => new Date())
@Entity()
class UserDeletedAt extends BaseEntity {
  @PrimaryKey({ type: "number" })
  id!: number;

  @Property({ type: "datetime", nullable: true })
  deletedAt?: Date;
}

@SoftDeletable(() => SoftDeletableBaseEntity, "isDeleted", () => true, false)
@Entity()
abstract class SoftDeletableBaseEntity extends BaseEntity {
  constructor(_a: string) {
    super();
  }

  @PrimaryKey({ type: "number" })
  id!: number;

  @Property({ type: "boolean" })
  isDeleted!: boolean;
}

@Entity()
class UserIsDeleted extends SoftDeletableBaseEntity {}

@SoftDeletable({
  type: () => UserIsDeletedAlt,
  field: "isDeleted",
  value: () => true,
  valueInitial: false,
})
@Entity()
class UserIsDeletedAlt extends BaseEntity {
  @PrimaryKey({ type: "number" })
  id!: number;

  @Property({ type: "boolean" })
  isDeleted!: boolean;
}

describeSoftDelete(
  "decorator (ES / TC39)",
  (entities: EntityClass<unknown>[]) =>
    MikroORM.init({
      dbName: ":memory:",
      entities,
      subscribers: [SoftDeleteHandler],
      allowGlobalContext: true,
    }),
  { UserDeletedAt, UserIsDeleted, UserIsDeletedAlt },
);
