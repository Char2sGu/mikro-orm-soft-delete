# Mikro ORM Soft Delete

The declarative soft-delete solution for MikroORM.

```
npm i mikro-orm-soft-delete
```

> Inspired by: https://github.com/mikro-orm/mikro-orm/issues/1492#issuecomment-785394397

## Compatibilities

| Library Version | ORM Version |
| --------------- | ----------- |
| v1.x.x          | v6.x.x      |
| v0.x.x          | v5.x.x      |

## Migrating to v1

- It is now mandatory to register `SoftDeleteHandler` as an extension for this library to work. See [Initialization](#initialization) for details.
- Base entities no longer accept any generic type parameters.

## Tutorial

### Initialization

To enable soft-delete for your `MikroORM` instance, register `SoftDeleteHandler` as an [extension](https://mikro-orm.io/docs/configuration#extensions) in the initialization config:

```ts
import { SoftDeleteHandler } from "mikro-orm-soft-delete";

await MikroORM.init({
  // ...
  extensions: [SoftDeleteHandler],
  // ...
});
```

### Basics

Put a `SoftDeletable` decorator on your entity definition to make it soft-deletable:

```ts
import { SoftDeletable } from "mikro-orm-soft-delete";

@SoftDeletable(() => User, "deletedAt", () => new Date())
@Entity()
export class User extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property({ nullable: true })
  deletedAt?: Date;
}
```

The above code snippet means that:

- A filter with conditions `{ deletedAt: null }` is applied to `User` and enabled by default, so that those soft-deleted entities will be excluded from your queries. This filter could be disabled by:
  ```ts
  import { SOFT_DELETABLE_FILTER } from "mikro-orm-soft-delete";
  repo.find({ ... }, { filters: { [SOFT_DELETABLE_FILTER]: false } });
  repo.find({ ... }, { filters: false }); // if you are sure that there are no other filters enabled
  ```
- When an deletion command is executed on a `User` entity, its `deletedAt` field will be set to a newly instantiated `Date`. You could find all `delete` statements replaced with `update` ones under MikroORM's debugging mode:
  ```ts
  repo.remove(user);
  await repo.flush();
  user.id !== undefined; // true
  user.deletedAt instanceof Date; // true
  ```
- `cascade: [Cascade.Remove]` and `orphanRemoval: true` still work with `repo.remove()`. But you would have to avoid removing items from collections when using `orphanRemoval` as it's currently not possible to intercept deletions caused by these operations.

### Config API

Aside from passing the parameters by positions, there is also an object-based API that accepts a config object instead:

```ts
@SoftDeletable({
  type: () => User,
  field: 'deletedAt',
  value: () => new Date(),
})
```

### Default Field Value

By default, a `null` value is used in the filter to exclude soft-deleted entities: `{ deletedAt: null }`. However, if the default value of the field is not `null`, the query would not work as we expected.

For example, when the field is `isDeleted` and the default value is `false`, the query `{ isDeleted: null }` would not match any entities.

In this case, an additional option `valueInitial` needs to be specified:

```ts
@SoftDeletable({
  type: () => User,
  field: 'isDeleted',
  value: () => true,
  valueInitial: false, // indicating that the default value of `isDeleted` is `false`.
})
```

...which would make the query look like `{ isDeleted: false }` to find all the entities that is not soft-deleted.

This option could also be specified through the 4th argument:

```ts
@SoftDeletable(() => User, 'isDeleted', () => true, false)
```

### Inheritance

Inheritance is supported for the `SoftDeletable` decorator, thus it is possible to create a `SoftDeletableBaseEntity` to make all the sub entity classes soft-deletable:

```ts
@SoftDeletable(() => SoftDeletableBaseEntity, "deletedAt", () => new Date())
export abstract class SoftDeletableBaseEntity extends BaseEntity {
  @Property({ nullable: true })
  deletedAt?: Date;
}
```

### Hard Deletions

Currently it's impossible to hard-delete an entity marked as soft-deletable. As a workaround, the native API could be used for hard-deletions:

```ts
em.nativeDelete(...);
```
