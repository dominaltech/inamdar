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

// Dynamic in-memory category order and categories list
export let DYNAMIC_CATEGORY_ORDER = { ...CATEGORY_ORDER };
export let LIVE_CATEGORIES = Object.keys(CATEGORY_ORDER).map((name, idx) => ({
  name,
  categoryOrder: idx + 1,
  department: (name.includes('DESSERT') || name.includes('MOCKTAL') || name.includes('SOFT DRINK')) ? 'PANTRY' : 'KITCHEN',
  isActive: true,
}));

export function updateDynamicCategories(categories) {
  if (!categories || !Array.isArray(categories)) return;
  LIVE_CATEGORIES = categories;
  const newMap = {};
  categories.forEach((cat, idx) => {
    const name = (cat.name || '').toUpperCase().trim();
    const order = Number(cat.categoryOrder) || (idx + 1);
    if (name) newMap[name] = order;
  });
  DYNAMIC_CATEGORY_ORDER = { ...CATEGORY_ORDER, ...newMap };

  // Also update categoryOrder on existing in-memory items
  if (Array.isArray(MENU_ITEMS)) {
    MENU_ITEMS.forEach(it => {
      if (it.category && DYNAMIC_CATEGORY_ORDER[it.category] !== undefined) {
        it.categoryOrder = DYNAMIC_CATEGORY_ORDER[it.category];
      }
    });
  }
}

// Generate common acronyms for dishes
export function generateAcronyms(name) {
  if (!name) return [];
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

// Initial item parsing helper
function parseItem(item) {
  const acronyms = generateAcronyms(item.name || '');
  const cat = item.category || 'UNCATEGORIZED';
  const catOrder = item.categoryOrder ?? item.category_order ?? (DYNAMIC_CATEGORY_ORDER[cat] || 99);
  return {
    code: String(item.code),
    name: (item.name || '').toUpperCase(),
    category: cat,
    categoryOrder: Number(catOrder) || 99,
    acRate: Number(item.acRate ?? item.ac_rate) || 0,
    hallRate: Number(item.hallRate ?? item.hall_rate ?? item.acRate ?? item.ac_rate) || 0,
    isKitchen: item.isKitchen ?? item.is_kitchen ?? isKitchenItem(item),
    isAvailable: item.isAvailable ?? item.is_available ?? true,
    acronyms,
  };
}

// In-Memory Live Menu Store (Instant 0ms numpad search)
function getInitialMenu() {
  try {
    const cached = localStorage.getItem('inamdar_cached_menu');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(parseItem);
      }
    }
  } catch (e) {
    console.warn('Cached menu parse error:', e);
  }
  return (rawMenuData.items || []).map(parseItem);
}

export let MENU_ITEMS = getInitialMenu();
export let MENU_BY_CODE = new Map(MENU_ITEMS.map(item => [item.code, item]));

// Dynamic updater called when Supabase menu loads or updates
export function loadDynamicMenuItems(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return MENU_ITEMS;

  MENU_ITEMS = items.map(parseItem);
  MENU_BY_CODE = new Map(MENU_ITEMS.map(item => [item.code, item]));

  try {
    localStorage.setItem('inamdar_cached_menu', JSON.stringify(MENU_ITEMS));
  } catch (e) {
    console.warn('Failed to cache dynamic menu:', e);
  }

  return MENU_ITEMS;
}

export function getAllMenuItems() {
  return MENU_ITEMS;
}

export function getMenuItemByCode(code) {
  return MENU_BY_CODE.get(String(code));
}

export function searchMenuItems(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toUpperCase();

  const matches = MENU_ITEMS.filter(item => {
    if (!item.isAvailable) return false;
    if (item.code === q || item.code.startsWith(q)) return true;
    if (item.acronyms.some(acr => acr === q || acr.startsWith(q))) return true;
    if (item.name.includes(q)) return true;
    return false;
  });

  return matches.sort((a, b) => {
    if (a.code === q) return -1;
    if (b.code === q) return 1;
    if (a.code.startsWith(q) && !b.code.startsWith(q)) return -1;
    if (!a.code.startsWith(q) && b.code.startsWith(q)) return 1;
    return (Number(a.code) || 0) - (Number(b.code) || 0);
  }).slice(0, 30);
}

export function sortItemsByCourse(items) {
  return [...items].sort((a, b) => {
    const orderA = a.categoryOrder ?? (DYNAMIC_CATEGORY_ORDER[a.category] || 99);
    const orderB = b.categoryOrder ?? (DYNAMIC_CATEGORY_ORDER[b.category] || 99);
    if (orderA !== orderB) return orderA - orderB;
    return (Number(a.code) || 0) - (Number(b.code) || 0);
  });
}

// Determines if an item goes to the Cook/Kitchen KDS or to the Pantry/Counter/Bar
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
