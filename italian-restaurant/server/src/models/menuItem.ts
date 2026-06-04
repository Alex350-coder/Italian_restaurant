import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMenuItemInput {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_available?: boolean;
}

export interface UpdateMenuItemInput extends Partial<CreateMenuItemInput> {}

export interface MenuItemFilters {
  category?: string;
  is_available?: boolean;
  is_featured?: boolean;
}

export const MenuItemModel = {
  async findById(id: string): Promise<MenuItem | null> {
    const result = await query<MenuItem>(
      "SELECT * FROM menu_items WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  },

  async findAll(filters: MenuItemFilters = {}): Promise<MenuItem[]> {
    let sql = "SELECT * FROM menu_items WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.is_available !== undefined) {
      sql += ` AND is_available = $${paramIndex}`;
      params.push(filters.is_available);
      paramIndex++;
    }

    if (filters.is_featured !== undefined) {
      sql += ` AND is_featured = $${paramIndex}`;
      params.push(filters.is_featured);
      paramIndex++;
    }

    sql += " ORDER BY category, name";

    const result = await query<MenuItem>(sql, params);
    return result.rows;
  },

  async create(input: CreateMenuItemInput): Promise<MenuItem> {
    const id = uuidv4();
    const now = new Date();

    const result = await query<MenuItem>(
      `INSERT INTO menu_items (id, name, description, price, category, image_url, is_available, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        input.name,
        input.description,
        input.price,
        input.category,
        input.image_url || null,
        input.is_available ?? true,
        now,
        now,
      ]
    );

    return result.rows[0];
  },

  async update(id: string, input: UpdateMenuItemInput): Promise<MenuItem | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(input.name);
      paramIndex++;
    }
    if (input.description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      values.push(input.description);
      paramIndex++;
    }
    if (input.price !== undefined) {
      fields.push(`price = $${paramIndex}`);
      values.push(input.price);
      paramIndex++;
    }
    if (input.category !== undefined) {
      fields.push(`category = $${paramIndex}`);
      values.push(input.category);
      paramIndex++;
    }
    if (input.image_url !== undefined) {
      fields.push(`image_url = $${paramIndex}`);
      values.push(input.image_url);
      paramIndex++;
    }
    if (input.is_available !== undefined) {
      fields.push(`is_available = $${paramIndex}`);
      values.push(input.is_available);
      paramIndex++;
    }

    fields.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;

    values.push(id);

    const result = await query<MenuItem>(
      `UPDATE menu_items SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query(
      "DELETE FROM menu_items WHERE id = $1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },
};
