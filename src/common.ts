export const SOFT_DELETABLE = Symbol("soft-deletable");

export const SOFT_DELETABLE_FILTER = "soft-deletable-filter";

export interface SoftDeletableConfig<Entity, Field extends keyof Entity> {
  /**
   * Identifier field used to identify deleted entities.
   */
  field: Field;

  /**
   * Value to set to the identifier field in deletions.
   */
  value: () => Entity[Field];

  /**
   * Value to identify entities that is NOT soft-deleted. Defaults to `null`.
   */
  valueInitial?: Entity[Field];
}
