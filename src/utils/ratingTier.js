export const RATING_TIERS = [
  { name: "Seedling", min: 0, max: 99 },
  { name: "Sprout", min: 100, max: 249 },
  { name: "Grower", min: 250, max: 499 },
  { name: "Aligner", min: 500, max: 799 },
  { name: "Strategist", min: 800, max: 1099 },
  { name: "Tactician", min: 1100, max: 1499 },
  { name: "Quad Master", min: 1500, max: 1899 },
  { name: "Apex", min: 1900, max: 2399 },
  { name: "X-Elite", min: 2400, max: 2999 },
  { name: "The One", min: 3000, max: Number.POSITIVE_INFINITY }
];

export function getRatingTier(rating) {
  const score = Number(rating) || 0;
  const tier = RATING_TIERS.find((t) => score >= t.min && score <= t.max);
  return tier ? tier.name : "Seedling";
}
