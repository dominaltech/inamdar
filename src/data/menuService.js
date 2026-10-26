import rawMenuData from './menuData.json';

// Category sequence map for KOT culinary course ordering
export const CATEGORY_ORDER = {
  'SOUP': 1,
  'STARTERS': 2,
  'SEA FOOD': 3,
  'KABAB': 4,
  'MAIN COURSE': 5,
  'ANDE KA FUNDA': 6,
  'RICE AND NOODLES': 7,
  'BIRYANI AND PULAO': 8,
  'ROTI': 9,
  'SALAD': 10,
  'DESSERTS /MOCKTAL': 11,
  'BIRYANI': 12,
  'SOFT DRINKS': 13,
};

// Generate common acronyms for dishes
function generateAcronyms(name) {
  const clean = name.trim().toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const acronyms = [];

  if (words.length >= 2) {
    const simple = words.map(w => w[0]).join('');
    acronyms.push(simple);

    if (words.length >= 3) {
      acronyms.push(words[0][0] + words[1][0] + words[2][0]);
    }
  }

  if (clean.includes('CHICKEN')) {
    acronyms.push('CH');
    if (clean.includes('TIKKA') && clean.includes('MASALA')) acronyms.push('CTM');
    if (clean.includes('BIRYANI')) acronyms.push('CB');
    if (clean.includes('MANCHOW')) acronyms.push('CMS');
    if (clean.includes('TANDOORI')) acronyms.push('CT');
    if (clean.includes('CRISPY')) acronyms.push('CC');
    if (clean.includes('LOLLIPOP')) acronyms.push('CL');
    if (clean.includes('MALVANI')) acronyms.push('CM');
  }
  if (clean.includes('PANEER')) {
    acronyms.push('PAN');
    if (clean.includes('TIKKA')) acronyms.push('PT');
    if (clean.includes('ACHARI')) acronyms.push('PAT');
    if (clean.includes('BUTTER')) acronyms.push('PBM');
    if (clean.includes('KUNG PAO')) acronyms.push('PKP');
  }
  if (clean.includes('MASALA PAPAD')) acronyms.push('MP');
  if (clean.includes('ROASTED PAPAD')) acronyms.push('RP');
  if (clean.includes('MINERAL WATER')) acronyms.push('MW');
  if (clean.includes('FRENCH FRIES')) acronyms.push('FF');
  if (clean.includes('ROTI')) acronyms.push('R');
  if (clean.includes('BUTTER ROTI')) acronyms.push('BR');

  return Array.from(new Set(acronyms));
}

export const MENU_ITEMS = (rawMenuData.items || []).map(item => {
  const acronyms = generateAcronyms(item.name);
  return {
    code: String(item.code),
    name: item.name.toUpperCase(),
    category: item.category || 'UNCATEGORIZED',
    categoryOrder: CATEGORY_ORDER[item.category] || 99,
    acRate: Number(item.acRate) || 0,
    hallRate: Number(item.hallRate) || Number(item.acRate) || 0,
    acronyms,
  };
});

export const MENU_BY_CODE = new Map(MENU_ITEMS.map(item => [item.code, item]));

export function searchMenuItems(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toUpperCase();

  return MENU_ITEMS.filter(item => {
    if (item.code === q || item.code.startsWith(q)) return true;
    if (item.acronyms.some(acr => acr === q || acr.startsWith(q))) return true;
    if (item.name.includes(q)) return true;
    return false;
  }).slice(0, 30);
}

export function sortItemsByCourse(items) {
  return [...items].sort((a, b) => {
    const orderA = a.categoryOrder ?? 99;
    const orderB = b.categoryOrder ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return (Number(a.code) || 0) - (Number(b.code) || 0);
  });
}

// Determines if an item goes to the Cook/Kitchen KDS or to the Pantry/Counter/Bar
// Sweets/Desserts, Mineral Water, Soft Drinks are NOT cook work!
export function isKitchenItem(item) {
  if (!item) return true;
  const cat = (item.category || '').toUpperCase();
  const name = (item.name || '').toUpperCase();

  if (
    cat.includes('DESSERT') ||
    cat.includes('MOCKTAL') ||
    cat.includes('SOFT DRINK') ||
    name.includes('MINERAL WATER') ||
    name.includes('COLD DRINK') ||
    name.includes('SODA')
  ) {
    return false;
  }
  return true;
}
