// Agent names, shared so the bridge (and the agents it briefs) call everyone what the office shows.

/** FNV-1a: a small, stable string hash. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const NAMES = [
  "Pip", "Mochi", "Bix", "Nori", "Taro", "Juno", "Pebble", "Dot", "Fizz", "Boba", "Toast", "Waffle",
  "Biscuit", "Gizmo", "Sprout", "Pixel", "Byte", "Chip", "Noodle", "Bean", "Puddle", "Ziggy", "Momo",
  "Tofu", "Kiwi", "Miso", "Dumpling", "Scout", "Nugget", "Sushi", "Pickle", "Olive", "Muffin", "Peanut",
  "Clover", "Bloop", "Wobble", "Zuzu", "Turnip", "Mango",
];

/** An agent's first name, derived from its thread id. */
export function bloopName(id: string) {
  return NAMES[hashString(id + "name") % NAMES.length];
}
