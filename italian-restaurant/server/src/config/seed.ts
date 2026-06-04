import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import pool, { testConnection } from "./database";

const SALT_ROUNDS = 12;

const ADMIN_USER = {
  email: "admin@trattoria.it",
  password: "Admin123!",
  name: "Marco Rossi",
  phone: "+1-555-0100",
  role: "admin" as const,
};

const CUSTOMER_USER = {
  email: "customer@example.com",
  password: "Customer123!",
  name: "Giulia Bianchi",
  phone: "+1-555-0200",
  role: "customer" as const,
};

interface SeedMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

const MENU_ITEMS: SeedMenuItem[] = [
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d001", name: "Bruschetta Classica", description: "Grilled bread with fresh tomatoes, garlic, basil and olive oil", price: 8.50, category: "appetizers", image_url: "/images/bruschetta.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d002", name: "Caprese", description: "Buffalo mozzarella, tomatoes and basil with balsamic reduction", price: 11.00, category: "appetizers", image_url: "/images/caprese.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d003", name: "Carpaccio di Manzo", description: "Thinly sliced beef with arugula, parmesan and black truffle", price: 14.00, category: "appetizers", image_url: "/images/carpaccio.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d004", name: "Spaghetti Carbonara", description: "Guanciale, pecorino romano, eggs and black pepper", price: 15.00, category: "pasta", image_url: "/images/carbonara.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d005", name: "Penne all'Arrabbiata", description: "Spicy tomato sauce with garlic and red chili", price: 13.00, category: "pasta", image_url: "/images/arrabbiata.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d006", name: "Risotto ai Funghi Porcini", description: "Arborio rice with fresh porcini mushrooms and parmesan", price: 17.00, category: "risotto", image_url: "/images/risotto.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d007", name: "Lasagna della Nonna", description: "Fresh pasta layers with bolognese ragú, béchamel and mozzarella", price: 16.50, category: "pasta", image_url: "/images/lasagna.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d008", name: "Margherita DOP", description: "San Marzano tomatoes, buffalo mozzarella, fresh basil", price: 12.50, category: "pizza", image_url: "/images/margherita.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d009", name: "Quattro Stagioni", description: "Ham, mushrooms, artichokes, olives — one for each season", price: 15.00, category: "pizza", image_url: "/images/quattrostagioni.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d010", name: "Diavola", description: "Spicy salami, fresh chilies and mozzarella", price: 14.00, category: "pizza", image_url: "/images/diavola.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d011", name: "Pizza ai Quattro Formaggi", description: "Mozzarella, gorgonzola, parmesan and fontina", price: 14.50, category: "pizza", image_url: "/images/quattroformaggi.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d012", name: "Ossobuco alla Milanese", description: "Braised veal shank with gremolata and saffron risotto", price: 28.00, category: "meat", image_url: "/images/ossobuco.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d013", name: "Branzino al Forno", description: "Whole baked sea bass with potatoes, tomatoes and olives", price: 24.00, category: "seafood", image_url: "/images/branzino.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d014", name: "Pollo alla Parmigiana", description: "Breaded chicken cutlet with tomato sauce and mozzarella", price: 19.00, category: "meat", image_url: "/images/pollo.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d015", name: "Tiramisù della Casa", description: "Classic tiramisu with mascarpone and espresso coffee", price: 8.50, category: "desserts", image_url: "/images/tiramisu.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d016", name: "Panna Cotta", description: "Vanilla panna cotta with berry coulis", price: 7.50, category: "desserts", image_url: "/images/pannacotta.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d017", name: "Cannoli Siciliani", description: "Crispy pastry shells filled with sweet ricotta and pistachios", price: 9.00, category: "desserts", image_url: "/images/cannoli.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d018", name: "Chianti Classico DOCG", description: "Full-bodied Tuscan red wine — glass", price: 9.00, category: "wine", image_url: "/images/chianti.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d019", name: "Prosecco DOC", description: "Light and sparkling Italian wine — glass", price: 7.50, category: "wine", image_url: "/images/prosecco.jpg" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d020", name: "Limonata Fatta in Casa", description: "Fresh homemade lemonade with mint from the Amalfi Coast", price: 5.00, category: "beverages", image_url: "/images/limonata.jpg" },
];

const SAMPLE_ORDERS = [
  {
    items: [
      { name: "Spaghetti Carbonara", quantity: 2 },
      { name: "Tiramisù della Casa", quantity: 1 },
    ],
    status: "delivered",
  },
  {
    items: [
      { name: "Margherita DOP", quantity: 1 },
      { name: "Bruschetta Classica", quantity: 1 },
    ],
    status: "confirmed",
  },
];

const SAMPLE_RESERVATIONS = [
  {
    date: "2026-06-15",
    time: "19:00",
    partySize: 4,
    name: "Giulia Bianchi",
    phone: "+1-555-0200",
    email: "customer@example.com",
    status: "confirmed",
  },
  {
    date: "2026-06-20",
    time: "20:00",
    partySize: 2,
    name: "Luca Verdi",
    phone: "+1-555-0300",
    email: "luca@example.com",
    status: "pending",
  },
];

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const connected = await testConnection();
  if (!connected) {
    console.error("❌ Failed to connect to database");
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create admin user
    const adminId = uuidv4();
    const adminHash = await bcrypt.hash(ADMIN_USER.password, SALT_ROUNDS);
    await client.query(
      `INSERT INTO users (id, email, password_hash, name, phone, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [adminId, ADMIN_USER.email, adminHash, ADMIN_USER.name, ADMIN_USER.phone, ADMIN_USER.role]
    );
    console.log(`✅ Admin user created: ${ADMIN_USER.email}`);

    // Create customer user
    const customerId = uuidv4();
    const customerHash = await bcrypt.hash(CUSTOMER_USER.password, SALT_ROUNDS);
    await client.query(
      `INSERT INTO users (id, email, password_hash, name, phone, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [customerId, CUSTOMER_USER.email, customerHash, CUSTOMER_USER.name, CUSTOMER_USER.phone, CUSTOMER_USER.role]
    );
    console.log(`✅ Customer user created: ${CUSTOMER_USER.email}`);

    // Create menu items
    const featuredIds = new Set([
      "f47ac10b-58cc-4372-a567-0e02b2c3d001", // Bruschetta Classica
      "f47ac10b-58cc-4372-a567-0e02b2c3d004", // Spaghetti Carbonara
      "f47ac10b-58cc-4372-a567-0e02b2c3d008", // Margherita DOP
      "f47ac10b-58cc-4372-a567-0e02b2c3d012", // Ossobuco alla Milanese
      "f47ac10b-58cc-4372-a567-0e02b2c3d015", // Tiramisù della Casa
    ]);
    const menuItemIds: string[] = [];
    for (const item of MENU_ITEMS) {
      menuItemIds.push(item.id);
      const isFeatured = featuredIds.has(item.id);
      await client.query(
        `INSERT INTO menu_items (id, name, description, price, category, image_url, is_available, is_featured, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, description = EXCLUDED.description, category = EXCLUDED.category, is_featured = EXCLUDED.is_featured`,
        [item.id, item.name, item.description, item.price, item.category, item.image_url, isFeatured]
      );
    }
    console.log(`✅ ${MENU_ITEMS.length} menu items created`);
    console.log(`⭐ ${featuredIds.size} items marked as featured`);

    // Create sample orders
    for (const orderData of SAMPLE_ORDERS) {
      const orderId = uuidv4();
      let total = 0;

      const orderItems: { id: string; menu_item_id: string; quantity: number; unit_price: number; subtotal: number }[] = [];

      for (const item of orderData.items) {
        const menuItem = MENU_ITEMS.find((m) => m.name === item.name);
        if (menuItem) {
          const price = menuItem.price;
          const subtotal = price * item.quantity;
          total += subtotal;
          orderItems.push({
            id: uuidv4(),
            menu_item_id: menuItemIds[MENU_ITEMS.indexOf(menuItem)],
            quantity: item.quantity,
            unit_price: price,
            subtotal,
          });
        }
      }

      await client.query(
        `INSERT INTO orders (id, user_id, status, subtotal, total, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [orderId, customerId, orderData.status, total, total, null]
      );

      for (const oi of orderItems) {
        await client.query(
          `INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [oi.id, orderId, oi.menu_item_id, oi.quantity, oi.unit_price, oi.subtotal]
        );
      }
    }
    console.log(`✅ ${SAMPLE_ORDERS.length} sample orders created`);

    // Create sample reservations
    for (const res of SAMPLE_RESERVATIONS) {
      const confirmCode = Math.random().toString(36).slice(2, 10).toUpperCase();
      await client.query(
        `INSERT INTO reservations (id, user_id, reservation_date, reservation_time, party_size, confirmation_code, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          uuidv4(),
          customerId,
          res.date,
          res.time,
          res.partySize,
          confirmCode,
          res.status,
        ]
      );
    }
    console.log(`✅ ${SAMPLE_RESERVATIONS.length} sample reservations created`);

    // Create sample reviews
    const reviewData = [
      { menuItemIndex: 4, rating: 5, comment: "Best carbonara in town!" },
      { menuItemIndex: 9, rating: 4, comment: "Classic Margherita, perfect." },
      { menuItemIndex: 15, rating: 5, comment: "Tiramisu is divine!" },
    ];

    for (const r of reviewData) {
      await client.query(
        `INSERT INTO reviews (id, user_id, menu_item_id, rating, comment, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [uuidv4(), customerId, menuItemIds[r.menuItemIndex], r.rating, r.comment]
      );
    }
    console.log(`✅ ${reviewData.length} sample reviews created`);

    await client.query("COMMIT");

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📋 Login credentials:");
    console.log(`   Admin:    ${ADMIN_USER.email} / [see .env or seed config]`);
    console.log(`   Customer: ${CUSTOMER_USER.email} / [see .env or seed config]`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
