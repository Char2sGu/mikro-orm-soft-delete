import { EntityClass, MikroORM } from "@mikro-orm/core";

/**
 * The set of decorated entities a flavor-specific spec must provide. The same
 * suite runs against both legacy (reflect-metadata) and ES (TC39) decorators.
 */
export interface SuiteEntities {
  /** Soft-deletable via a nullable `deletedAt` field (default `valueInitial`). */
  UserDeletedAt: EntityClass<{ id: number; deletedAt?: Date }>;
  /** Soft-deletable via `isDeleted` with `valueInitial: false`, defined on an abstract base. */
  UserIsDeleted: EntityClass<{ id: number; isDeleted: boolean }>;
  /** Same as above, but configured through the object-based `SoftDeletable` syntax. */
  UserIsDeletedAlt: EntityClass<{ id: number; isDeleted: boolean }>;
}

/**
 * Shared behavioral suite, parameterized over the decorator flavor used to
 * define the entities and to build the ORM instance.
 */
export function describeSoftDelete(
  label: string,
  createOrm: (entities: EntityClass<unknown>[]) => Promise<MikroORM>,
  entities: SuiteEntities,
): void {
  const { UserDeletedAt, UserIsDeleted, UserIsDeletedAlt } = entities;

  describe(label, () => {
    let orm: MikroORM;

    async function init(es: EntityClass<unknown>[]) {
      orm = await createOrm(es);
      await orm.schema.create();
    }

    async function cleanup() {
      await orm.close(true);
    }

    test("query result should not include soft-deleted entities", async () => {
      await init([UserDeletedAt]);

      orm.em.create(UserDeletedAt, { id: 1, deletedAt: new Date() });
      await orm.em.flush();
      orm.em.clear();

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
      orm.em.clear();

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
      orm.em.remove(user);
      await orm.em.flush();
      orm.em.clear();

      await expect(orm.em.findOne(UserIsDeletedAlt, 1)).resolves.toBe(null);

      await expect(
        orm.em.findOne(UserIsDeletedAlt, 1, {
          filters: false,
        }),
      ).resolves.toBeDefined();

      await cleanup();
    });
  });
}
