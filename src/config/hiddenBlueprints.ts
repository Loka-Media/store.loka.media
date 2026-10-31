/**
 * Blueprints hidden from creators: for these "Early Access" products the Printify API only
 * returns a flat print-file template (cut panels), never real product mockups.
 */
export const HIDDEN_BLUEPRINT_IDS = new Set<number>([1485, 1486, 1700, 10722, 12670]);

export const isHiddenBlueprint = (blueprintId: number | string | null | undefined): boolean =>
  blueprintId != null && HIDDEN_BLUEPRINT_IDS.has(Number(blueprintId));
