export const pendingOrder = {
  id: "ord-001-pending",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  status: "pending" as const,
  total: 26.50,
  notes: "Extra napkins please",
  created_at: new Date("2026-06-01T10:30:00Z"),
  updated_at: new Date("2026-06-01T10:30:00Z"),
};

export const confirmedOrder = {
  id: "ord-002-confirmed",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  status: "confirmed" as const,
  total: 38.00,
  notes: null,
  created_at: new Date("2026-06-01T11:00:00Z"),
  updated_at: new Date("2026-06-01T11:05:00Z"),
};

export const preparingOrder = {
  id: "ord-003-preparing",
  user_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  status: "preparing" as const,
  total: 19.50,
  notes: "Gluten-free pasta",
  created_at: new Date("2026-06-01T12:00:00Z"),
  updated_at: new Date("2026-06-01T12:15:00Z"),
};

export const readyOrder = {
  id: "ord-004-ready",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  status: "ready" as const,
  total: 45.00,
  notes: "Birthday celebration - add candle",
  created_at: new Date("2026-06-01T18:00:00Z"),
  updated_at: new Date("2026-06-01T18:45:00Z"),
};

export const deliveredOrder = {
  id: "ord-005-delivered",
  user_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  status: "delivered" as const,
  total: 32.00,
  notes: null,
  created_at: new Date("2026-05-31T19:00:00Z"),
  updated_at: new Date("2026-05-31T19:45:00Z"),
};

export const cancelledOrder = {
  id: "ord-006-cancelled",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  status: "cancelled" as const,
  total: 14.00,
  notes: "Changed mind",
  created_at: new Date("2026-06-01T09:00:00Z"),
  updated_at: new Date("2026-06-01T09:10:00Z"),
};

export const largeOrder = {
  id: "ord-007-large",
  user_id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  status: "confirmed" as const,
  total: 156.50,
  notes: "Corporate event order - 15 guests",
  created_at: new Date("2026-06-02T08:00:00Z"),
  updated_at: new Date("2026-06-02T08:15:00Z"),
};

export const singleItemOrder = {
  id: "ord-008-single",
  user_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  status: "delivered" as const,
  total: 3.00,
  notes: null,
  created_at: new Date("2026-05-30T14:00:00Z"),
  updated_at: new Date("2026-05-30T14:30:00Z"),
};

export const zeroNotesOrder = {
  id: "ord-009-nonotes",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  status: "pending" as const,
  total: 28.00,
  notes: "",
  created_at: new Date("2026-06-02T12:00:00Z"),
  updated_at: new Date("2026-06-02T12:00:00Z"),
};

export const specialDietaryOrder = {
  id: "ord-010-dietary",
  user_id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  status: "preparing" as const,
  total: 35.00,
  notes: "Gluten-free pasta, no dairy, nut allergy - use sunflower oil",
  created_at: new Date("2026-06-02T13:00:00Z"),
  updated_at: new Date("2026-06-02T13:20:00Z"),
};

export const morningOrder = {
  id: "ord-011-morning",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  status: "confirmed" as const,
  total: 8.00,
  notes: "Early breakfast order",
  created_at: new Date("2026-06-02T07:00:00Z"),
  updated_at: new Date("2026-06-02T07:05:00Z"),
};

export const lateNightOrder = {
  id: "ord-012-latenight",
  user_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  status: "delivered" as const,
  total: 42.00,
  notes: "Late dinner delivery",
  created_at: new Date("2026-06-01T23:30:00Z"),
  updated_at: new Date("2026-06-02T00:15:00Z"),
};

export const pendingOrderItems = [
  {
    id: "oi-001-a",
    order_id: "ord-001-pending",
    menu_item_id: "m1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    quantity: 1,
    unit_price: 12.50,
    subtotal: 12.50,
  },
  {
    id: "oi-001-b",
    order_id: "ord-001-pending",
    menu_item_id: "m3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e",
    quantity: 1,
    unit_price: 14.00,
    subtotal: 14.00,
  },
];

export const confirmedOrderItems = [
  {
    id: "oi-002-a",
    order_id: "ord-002-confirmed",
    menu_item_id: "m1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    quantity: 2,
    unit_price: 12.50,
    subtotal: 25.00,
  },
  {
    id: "oi-002-b",
    order_id: "ord-002-confirmed",
    menu_item_id: "m5e6f7a8-b9c0-1d2e-3f4a-5b6c7d8e9f0a",
    quantity: 1,
    unit_price: 8.00,
    subtotal: 8.00,
  },
  {
    id: "oi-002-c",
    order_id: "ord-002-confirmed",
    menu_item_id: "m7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c",
    quantity: 1,
    unit_price: 22.00,
    subtotal: 22.00,
  },
];

export const largeOrderItems = [
  {
    id: "oi-007-a",
    order_id: "ord-007-large",
    menu_item_id: "m1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    quantity: 4,
    unit_price: 12.50,
    subtotal: 50.00,
  },
  {
    id: "oi-007-b",
    order_id: "ord-007-large",
    menu_item_id: "m3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e",
    quantity: 3,
    unit_price: 13.50,
    subtotal: 40.50,
  },
  {
    id: "oi-007-c",
    order_id: "ord-007-large",
    menu_item_id: "m5e6f7a8-b9c0-1d2e-3f4a-5b6c7d8e9f0a",
    quantity: 4,
    unit_price: 8.00,
    subtotal: 32.00,
  },
  {
    id: "oi-007-d",
    order_id: "ord-007-large",
    menu_item_id: "m7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c",
    quantity: 2,
    unit_price: 17.00,
    subtotal: 34.00,
  },
];

export const singleItemOrderItems = [
  {
    id: "oi-008-a",
    order_id: "ord-008-single",
    menu_item_id: "m18c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e",
    quantity: 1,
    unit_price: 3.00,
    subtotal: 3.00,
  },
];

export const allOrders = [
  pendingOrder,
  confirmedOrder,
  preparingOrder,
  readyOrder,
  deliveredOrder,
  cancelledOrder,
  largeOrder,
  singleItemOrder,
  zeroNotesOrder,
  specialDietaryOrder,
  morningOrder,
  lateNightOrder,
];

export function makeOrderWithItems(orderOverrides: any = {}, itemsOverrides: any[] = []) {
  const order = { ...pendingOrder, ...orderOverrides };
  const items = itemsOverrides.length > 0
    ? itemsOverrides
    : pendingOrderItems.map((item) => ({ ...item, order_id: order.id }));
  return { ...order, items };
}
