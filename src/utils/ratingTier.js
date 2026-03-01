export function getRatingTier(rating) {
  const score = Number(rating) || 0;
  if (score <= 99) return "Seedling";
  if (score <= 249) return "Sprout";
  if (score <= 499) return "Grower";
  if (score <= 799) return "Aligner";
  if (score <= 1099) return "Strategist";
  if (score <= 1499) return "Tactician";
  if (score <= 1899) return "Quad Master";
  if (score <= 2399) return "Apex";
  if (score <= 2999) return "X-Elite";
  return "The One";
}
