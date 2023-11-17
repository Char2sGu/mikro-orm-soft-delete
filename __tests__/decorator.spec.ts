import {
  BaseEntity,
  Entity,
  PrimaryKey,
  Property,
  SimpleLogger,
} from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/sqlite";

import { SoftDeletable } from "../src";

@SoftDeletable(() => User, "deletedAt", () => new Date())
@Entity()
class User extends BaseEntity<User, "id"> {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  deletedAt?: Date;
}

describe("decorator", () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: "sqlite",
      dbName: ":memory:",
      entities: [User],
      loggerFactory: (options) => new SimpleLogger(options),
      // debug: true,
      allowGlobalContext: true,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  it("should not fetch soft deleted by default", async () => {
    orm.em.create(User, { id: 1, deletedAt: new Date() });
    await orm.em.flush();

    const user = await orm.em.findOne(User, 1);

    expect(user).toEqual(null);
  });

  it("should transform hard delete in soft delete", async () => {
    orm.em.create(User, { id: 2 });
    await orm.em.flush();

    const user = await orm.em.findOneOrFail(User, 2);
    orm.em.remove(user);
    await orm.em.flush();

    const userSoftDeleted = await orm.em.findOneOrFail(User, 2, {
      filters: false,
    });

    expect(userSoftDeleted.deletedAt).toBeInstanceOf(Date);
  });
});
