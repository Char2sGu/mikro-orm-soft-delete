import {
  BaseEntity,
  Entity,
  PrimaryKey,
  Property,
  SimpleLogger,
} from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/sqlite";

import { SoftDeletable } from "../src";

@SoftDeletable(() => UserDeletedAt, "deletedAt", () => new Date())
@Entity()
class UserDeletedAt extends BaseEntity<UserDeletedAt, "id"> {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  deletedAt?: Date;
}

@SoftDeletable(() => UserIsDeleted, "isDeleted", () => true, false)
@Entity()
class UserIsDeleted extends BaseEntity<UserDeletedAt, "id"> {
  @PrimaryKey()
  id!: number;

  @Property()
  isDeleted!: boolean;
}

describe("decorator", () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: "sqlite",
      dbName: ":memory:",
      entities: [UserDeletedAt, UserIsDeleted],
      loggerFactory: (options) => new SimpleLogger(options),
      // debug: true,
      allowGlobalContext: true,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test("query result should not include soft-deleted entities", async () => {
    orm.em.create(UserDeletedAt, { id: 1, deletedAt: new Date() });
    await orm.em.flush();

    const user = await orm.em.findOne(UserDeletedAt, 1);

    expect(user).toEqual(null);
  });

  test("deletion operations should be intercepted and transformed", async () => {
    orm.em.create(UserDeletedAt, { id: 2 });
    await orm.em.flush();

    const user = await orm.em.findOneOrFail(UserDeletedAt, 2);
    orm.em.remove(user);
    await orm.em.flush();

    const userSoftDeleted = await orm.em.findOneOrFail(UserDeletedAt, 2, {
      filters: false,
    });

    expect(userSoftDeleted.deletedAt).toBeInstanceOf(Date);
  });

  test("`valueInitial` settings should be respected", async () => {
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
  });
});
