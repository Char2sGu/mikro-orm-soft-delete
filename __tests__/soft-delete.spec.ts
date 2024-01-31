import {
  BaseEntity,
  Entity,
  EntityClass,
  PrimaryKey,
  Property,
  SimpleLogger,
} from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/sqlite";

import { SoftDeletable, SoftDeleteHandler } from "../src";

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
  type: () => UserIsDeleted,
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

describe("decorator", () => {
  let orm: MikroORM;

  async function init(entities: EntityClass<any>[]) {
    orm = await MikroORM.init({
      dbName: ":memory:",
      entities,
      extensions: [SoftDeleteHandler],
      loggerFactory: (options) => new SimpleLogger(options),
      // debug: true,
      allowGlobalContext: true,
    });
    await orm.schema.createSchema();
  }

  async function cleanup() {
    await orm.close(true);
  }

  test("query result should not include soft-deleted entities", async () => {
    await init([UserDeletedAt]);

    orm.em.create(UserDeletedAt, { id: 1, deletedAt: new Date() });
    await orm.em.flush();

    const user = await orm.em.findOne(UserDeletedAt, 1);

    expect(user).toEqual(null);

    await cleanup();
  });

  test("deletion operations should be intercepted and transformed", async () => {
    await init([UserDeletedAt]);

    orm.em.create(UserDeletedAt, { id: 1 });
    await orm.em.flush();

    const user = await orm.em.findOneOrFail(UserDeletedAt, 1);
    orm.em.remove(user);
    await orm.em.flush();

    const userSoftDeleted = await orm.em.findOneOrFail(UserDeletedAt, 1, {
      filters: false,
    });

    expect(userSoftDeleted.deletedAt).toBeInstanceOf(Date);

    await cleanup();
  });

  test("`valueInitial` settings should be respected", async () => {
    await init([UserIsDeleted]);

    orm.em.create(UserIsDeleted, { id: 1, isDeleted: false });
    await orm.em.flush();

    const user = await orm.em.findOneOrFail(UserIsDeleted, 1);
    orm.em.remove(user);
    await orm.em.flush();

    await expect(orm.em.findOne(UserIsDeleted, 1)).resolves.toEqual(null);

    const userSoftDeleted = await orm.em.findOneOrFail(UserIsDeleted, 1, {
      filters: false,
    });

    expect(userSoftDeleted.isDeleted).toEqual(true);

    await cleanup();
  });

  test("the object-based syntax should work", async () => {
    await init([UserIsDeletedAlt]);

    orm.em.create(UserIsDeletedAlt, { id: 1, isDeleted: false });
    await orm.em.flush();
    const user = await orm.em.findOneOrFail(UserIsDeletedAlt, 1);
    await orm.em.removeAndFlush(user);

    await expect(orm.em.findOne(UserIsDeletedAlt, 1)).resolves.toBe(null);

    await expect(
      orm.em.findOne(UserIsDeletedAlt, 1, {
        filters: false,
      }),
    ).resolves.toBeDefined();

    await cleanup();
  });
});
