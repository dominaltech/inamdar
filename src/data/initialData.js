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

export const INITIAL_TABLES = {
  // AC Section (1 to 20)
  '1': {
    id: '1',
    section: 'AC',
    waiter: '1 COUNTER',
    status: 'OCCUPIED',
    kotNos: [18],
    items: [
      { code: '1', name: 'CHICKEN MANCHOW SOUP', qty: 1, rate: 130, amount: 130, category: 'SOUP', categoryOrder: 1 },
      { code: '153', name: 'MASALA PAPAD', qty: 1, rate: 30, amount: 30, category: 'STARTERS', categoryOrder: 2 },
      { code: '21', name: 'CHICKEN TANDOORI HALF', qty: 1, rate: 180, amount: 180, category: 'KABAB', categoryOrder: 4 },
      { code: '60', name: 'MUTTON DHANIYA WALA', qty: 1, rate: 380, amount: 380, category: 'MAIN COURSE', categoryOrder: 5 },
      { code: '95', name: 'ROTI', qty: 1, rate: 30, amount: 30, category: 'ROTI', categoryOrder: 9 },
      { code: '82', name: 'CHICKEN BIRYANI 3 PIS', qty: 1, rate: 160, amount: 160, category: 'BIRYANI', categoryOrder: 12 },
    ],
  },
  '2': {
    id: '2',
    section: 'AC',
    waiter: '1 COUNTER',
    status: 'OCCUPIED',
    kotNos: [4, 5, 10],
    items: [
      { code: '82', name: 'CHICKEN BIRYANI 3 PIS', qty: -1, rate: 160, amount: -160, isCancelled: true, category: 'BIRYANI', categoryOrder: 12 },
      { code: '95', name: 'ROTI', qty: -1, rate: 30, amount: -30, isCancelled: true, category: 'ROTI', categoryOrder: 9 },
      { code: '70', name: 'CHICKEN MALVANI W.B(5 PIS)', qty: -1, rate: 380, amount: -380, isCancelled: true, category: 'MAIN COURSE', categoryOrder: 5 },
      { code: '95', name: 'ROTI', qty: 1, rate: 30, amount: 30, category: 'ROTI', categoryOrder: 9 },
      { code: '95', name: 'ROTI', qty: 2, rate: 30, amount: 60, category: 'ROTI', categoryOrder: 9 },
      { code: '82', name: 'CHICKEN BIRYANI 3 PIS', qty: 5, rate: 160, amount: 800, category: 'BIRYANI', categoryOrder: 12 },
      { code: '70', name: 'CHICKEN MALVANI W.B(5 PIS)', qty: 3, rate: 380, amount: 1140, category: 'MAIN COURSE', categoryOrder: 5 },
    ],
  },
  '3': {
    id: '3',
    section: 'AC',
    waiter: '1 COUNTER',
    status: 'OCCUPIED',
    kotNos: [31],
    items: [
      { code: '2', name: 'CHICKEN HOT AND SOUR SOUP', qty: 1, rate: 130, amount: 130, category: 'SOUP', categoryOrder: 1 },
    ],
  },
  '4': {
    id: '4',
    section: 'AC',
    waiter: '1 COUNTER',
    status: 'OCCUPIED',
    kotNos: [7],
    items: [
      { code: '22', name: 'CHICKEN TANDOORI FULL', qty: 1, rate: 340, amount: 340, category: 'KABAB', categoryOrder: 4 },
      { code: '55', name: 'PANEER ACHARI TIKKA', qty: 1, rate: 290, amount: 290, category: 'STARTERS', categoryOrder: 2 },
    ],
  },
  '10': {
    id: '10',
    section: 'AC',
    waiter: '1 COUNTER',
    status: 'AVAILABLE',
    items: [],
  },
  // Family AC (21 to 40)
  '25': {
    id: '25',
    section: 'FAMILY AC',
    waiter: '2 SUSHANT',
    status: 'OCCUPIED',
    kotNos: [12],
    items: [
      { code: '5', name: 'CHICKEN CLER SOUP', qty: 2, rate: 140, amount: 280, category: 'SOUP', categoryOrder: 1 },
      { code: '82', name: 'CHICKEN BIRYANI 3 PIS', qty: 2, rate: 160, amount: 320, category: 'BIRYANI', categoryOrder: 12 },
    ],
  },
  // Parcels
  '0': {
    id: '0',
    section: 'PARCEL',
    waiter: '1 COUNTER',
    status: 'OCCUPIED',
    kotNos: [11],
    items: [
      { code: '1', name: 'CHICKEN MANCHOW SOUP', qty: 1, rate: 130, amount: 130, category: 'SOUP', categoryOrder: 1 },
    ],
  },
  '0B': {
    id: '0B',
    section: 'PARCEL',
    waiter: '1 COUNTER',
    status: 'OCCUPIED',
    kotNos: [14],
    items: [
      { code: '82', name: 'CHICKEN BIRYANI 3 PIS', qty: 1, rate: 160, amount: 160, category: 'BIRYANI', categoryOrder: 12 },
    ],
  },
  '0C': {
    id: '0C',
    section: 'PARCEL',
    waiter: '1 COUNTER',
    status: 'OCCUPIED',
    kotNos: [15],
    items: [
      { code: '21', name: 'CHICKEN TANDOORI HALF', qty: 1, rate: 180, amount: 180, category: 'KABAB', categoryOrder: 4 },
    ],
  },
  '0E': {
    id: '0E',
    section: 'PARCEL',
    waiter: '1 COUNTER',
    status: 'OCCUPIED',
    kotNos: [16],
    items: [
      { code: '95', name: 'ROTI', qty: 4, rate: 30, amount: 120, category: 'ROTI', categoryOrder: 9 },
    ],
  },
  // Home Delivery
  '00 - MOOSA (22)': {
    id: '00 - MOOSA (22)',
    section: 'HOME DELIVERY',
    waiter: '1 COUNTER',
    status: 'OCCUPIED',
    kotNos: [22],
    items: [
      { code: '82', name: 'CHICKEN BIRYANI 3 PIS', qty: 2, rate: 160, amount: 320, category: 'BIRYANI', categoryOrder: 12 },
      { code: '22', name: 'CHICKEN TANDOORI FULL', qty: 1, rate: 340, amount: 340, category: 'KABAB', categoryOrder: 4 },
    ],
  },
};

export const INITIAL_UNSETTLED_BILLS = [
  { table: '2', billNo: '10', amount: 1460 },
  { table: '0', billNo: '11', amount: 130 },
];

export const INITIAL_ALL_BILLS = [
  {
    billNo: 10,
    date: '27-10-26',
    time: '01:45 PM',
    tableNo: '2',
    section: 'AC',
    employeeNo: '1',
    pax: 2,
    totalAmount: 1460,
    isSettled: false,
    paymentMode: null,
    items: [
      { code: '95', name: 'ROTI', qty: 3, rate: 30, amount: 90 },
      { code: '82', name: 'CHICKEN BIRYANI 3 PIS', qty: 5, rate: 160, amount: 800 },
      { code: '70', name: 'CHICKEN MALVANI W.B(5 PIS)', qty: 3, rate: 380, amount: 1140 },
    ],
  },
  {
    billNo: 11,
    date: '27-10-26',
    time: '02:10 PM',
    tableNo: '0',
    section: 'PARCEL',
    employeeNo: '1',
    pax: 1,
    totalAmount: 130,
    isSettled: false,
    paymentMode: null,
    items: [
      { code: '1', name: 'CHICKEN MANCHOW SOUP', qty: 1, rate: 130, amount: 130 },
    ],
  },
  {
    billNo: 8,
    date: '27-10-26',
    time: '12:30 PM',
    tableNo: '4',
    section: 'AC',
    employeeNo: '1',
    pax: 2,
    totalAmount: 630,
    isSettled: true,
    paymentMode: 'Cash',
    items: [
      { code: '22', name: 'CHICKEN TANDOORI FULL', qty: 1, rate: 340, amount: 340 },
      { code: '55', name: 'PANEER ACHARI TIKKA', qty: 1, rate: 290, amount: 290 },
    ],
  },
  {
    billNo: 9,
    date: '27-10-26',
    time: '01:15 PM',
    tableNo: '25',
    section: 'FAMILY AC',
    employeeNo: '2',
    pax: 4,
    totalAmount: 600,
    isSettled: true,
    paymentMode: 'UPI',
    items: [
      { code: '5', name: 'CHICKEN CLER SOUP', qty: 2, rate: 140, amount: 280 },
      { code: '82', name: 'CHICKEN BIRYANI 3 PIS', qty: 2, rate: 160, amount: 320 },
    ],
  },
];

