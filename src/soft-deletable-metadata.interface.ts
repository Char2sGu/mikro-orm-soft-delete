export interface SoftDeletableMetadata<Entity, Field extends keyof Entity> {
  field: Field;
  value: () => Entity[Field];
}
