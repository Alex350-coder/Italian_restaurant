import pool from "./database";

async function markFeatured() {
  const client = await pool.connect();
  try {
    console.log("🌟 Marking featured items...\n");

    const featuredItems = [
      'Spaghetti Carbonara',
      'Margherita DOP',
      'Ossobuco alla Milanese',
      'Tiramisù della Casa',
      'Risotto ai Funghi Porcini'
    ];

    for (const itemName of featuredItems) {
      await client.query(
        `UPDATE menu_items SET is_featured = true, updated_at = NOW() WHERE name = $1`,
        [itemName]
      );
      console.log(`✅ ${itemName} marked as featured`);
    }

    const result = await client.query(
      `SELECT COUNT(*) as count FROM menu_items WHERE is_featured = true`
    );

    console.log(`\n🎉 Total featured items: ${result.rows[0].count}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

markFeatured().catch(console.error);
