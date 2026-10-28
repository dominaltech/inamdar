export const DEFAULT_USERS = [
  { id: '1', name: '1. Operator', role: 'OPERATOR', pin: '1' },
  { id: '2', name: 'Manager', role: 'MANAGER', pin: '1234' },
  { id: '3', name: 'Admin / Owner', role: 'OWNER', pin: '9999' },
];

export const EMPLOYEES = [
  { id: '1', name: '1 COUNTER' },
  { id: '2', name: '2 SUSHANT' },
  { id: '3', name: '3 AMIT' },
  { id: '4', name: '4 RAHUL' },
];

export const CANCEL_REASONS = [
  'CANCELLED BY GUEST',
  'ITEM NOT AVAILABLE',
  'ITEM SPOILT',
  'NOT MADE AS PER GUEST',
  'ORDERED IN WRONG TABLE',
  'TOO SALTY',
  'TOO SPICY',
  'WRONG ITEM ENTERED',
];

// Generate clean default tables for all sections (Zero hardcoded mock orders)
function generateCleanTables() {
  const tbls = {};

  // AC Section: Tables 1 to 20
  for (let i = 1; i <= 20; i++) {
    const id = String(i);
    tbls[id] = {
      id,
      section: 'AC',
      waiter: '1 COUNTER',
      status: 'AVAILABLE',
      pax: 2,
      kotNos: [],
      items: [],
    };
  }

  // Family AC Section: Tables 21 to 40
  for (let i = 21; i <= 40; i++) {
    const id = String(i);
    tbls[id] = {
      id,
      section: 'FAMILY AC',
      waiter: '1 COUNTER',
      status: 'AVAILABLE',
      pax: 4,
      kotNos: [],
      items: [],
    };
  }

  // Parcel / Takeaway Section: 0, 0B, 0C, 0D, 0E
  ['0', '0B', '0C', '0D', '0E'].forEach(id => {
    tbls[id] = {
      id,
      section: 'PARCEL',
      waiter: '1 COUNTER',
      status: 'AVAILABLE',
      pax: 1,
      kotNos: [],
      items: [],
    };
  });

  // Home Delivery: 00 - GUEST
  tbls['00 - GUEST'] = {
    id: '00 - GUEST',
    section: 'HOME DELIVERY',
    waiter: '1 COUNTER',
    status: 'AVAILABLE',
    pax: 1,
    kotNos: [],
    items: [],
  };

  return tbls;
}

export const INITIAL_TABLES = generateCleanTables();

// Zero dummy bills - Starts 100% clean from scratch
export const INITIAL_UNSETTLED_BILLS = [];
export const INITIAL_ALL_BILLS = [];

