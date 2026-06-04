export const customerUser = {
  id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  email: "mario.rossi@example.com",
  password: "Mario123!",
  name: "Mario Rossi",
  phone: "+39 333 1234567",
  role: "customer" as const,
};

export const adminUser = {
  id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  email: "admin@trattoria.it",
  password: "Admin123!",
  name: "Chef Giuseppe",
  phone: "+39 333 7654321",
  role: "admin" as const,
};

export const restaurantOwnerUser = {
  id: "o1p2q3r4-s5t6-7u8v-9w0x-1y2z3a4b5c6d",
  email: "owner@trattoria.it",
  password: "Owner123!",
  name: "Giulia Marchetti",
  phone: "+39 333 1112233",
  role: "admin" as const,
};

export const secondCustomer = {
  id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  email: "luca.bianchi@example.com",
  password: "Luca123!",
  name: "Luca Bianchi",
  phone: "+39 333 9876543",
  role: "customer" as const,
};

export const thirdCustomer = {
  id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  email: "sofia.verdi@example.com",
  password: "Sofia123!",
  name: "Sofia Verdi",
  phone: "+39 333 5556677",
  role: "customer" as const,
};

export const invalidEmailUser = {
  email: "not-an-email",
  password: "Password1!",
  name: "Bad Email",
};

export const shortPasswordUser = {
  email: "short@example.com",
  password: "Ab1",
  name: "Short Pass",
};

export const missingNameUser = {
  email: "noname@example.com",
  password: "Password1!",
};

export const validRegisterPayload = {
  email: "new.user@example.com",
  password: "NewUser123!",
  name: "New User",
  phone: "+39 333 0000000",
};

export const validLoginPayload = {
  email: "mario.rossi@example.com",
  password: "Mario123!",
};
