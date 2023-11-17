# Mikro ORM Soft Delete

Generic soft delete solution for MikroORM.

```
npm i mikro-orm-soft-delete
```

> Inspired by: https://github.com/mikro-orm/mikro-orm/issues/1492#issuecomment-785394397

## Tutorial

### Basic

It is so simple to enable soft delete with this package that you only need one example to understand what's going on:

```ts
@SoftDeletable(() => User, "deletedAt", () => new Date())
@Entity()
export class User extends BaseEntity<User, "id"> {
  @PrimaryKey()
  id: number;

  @Property({ nullable: true })
  deletedAt?: Date;
}
```

This means that:

- A filter with conditions `{ deletedAt: null }` has been defined on `User` and enabled by default, so that those deleted entities will be filtered out by default. The filter can be disabled by:
  ```ts
  repo.find({ ... }, { filters: { [SOFT_DELETABLE_FILTER]: false } });
  repo.find({ ... }, { filters: false }); // if you are sure that there are no other filters enabled
  ```
- When you try to delete a `User` entity, it will not be actually deleted from the database, and its `deletedAt` property will be set to a newly instantiated `Date`. You can find that `delete` statements are replaced with `update` ones with MikroORM's debug mode on.
  ```ts
  repo.remove(user);
  await repo.flush();
  user.id !== undefined; // true
  user.deletedAt === true; // true
  ```
- `cascade: [Cascade.Remove]` and `orphanRemoval: true` still work fine with `repo.remove()`. But you must avoid removing items from collections when using `orphanRemoval` because we cannot catch the deletions caused by it.

### Inheritance

If you want all your entities to be soft deletable, you can create a `SoftDeletableBaseEntity` and make all your other entity classes extend it:

```ts
@SoftDeletable(() => SoftDeletableBaseEntity, "deletedAt", () => new Date())
export abstract class SoftDeletableBaseEntity<
  T,
  PK extends keyof T,
> extends BaseEntity<T, PK> {
  @Property({ nullable: true })
  deletedAt?: Date;
}
```

### Hard Deleting

Currently it's impossible to perform perfect hard deletes. As a workaround, we can hard delete entities using the native API:

```ts
em.nativeDelete(...);
```
