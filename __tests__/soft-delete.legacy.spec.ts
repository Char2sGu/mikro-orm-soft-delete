import "reflect-metadata";

import { BaseEntity, EntityClass } from "@mikro-orm/core";
import {
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from "@mikro-orm/decorators/legacy";
import { MikroORM } from "@mikro-orm/sqlite";

import { SoftDeletable, SoftDeleteHandler } from "../src/index.js";
import { describeSoftDelete } from "./suite.js";

@SoftDeletable(() => UserDeletedAt, "deletedAt", () => new Date())
@Entity()
class UserDeletedAt extends BaseEntity {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  deletedAt?: Date;
}

@SoftDeletable(() => SoftDeletableBaseEntity, "isDeleted", () => true, false)
@Entity()
abstract class SoftDeletableBaseEntity extends BaseEntity {
  constructor(_a: string) {
    super();
  }

  @PrimaryKey()
  id!: number;

  @Property()
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
  @PrimaryKey()
  id!: number;

  @Property()
  isDeleted!: boolean;
}

describeSoftDelete(
  "decorator (legacy / reflect-metadata)",
  (entities: EntityClass<unknown>[]) =>
    MikroORM.init({
      dbName: ":memory:",
      entities,
      metadataProvider: ReflectMetadataProvider,
      subscribers: [SoftDeleteHandler],
      allowGlobalContext: true,
    }),
  { UserDeletedAt, UserIsDeleted, UserIsDeletedAlt },
);
