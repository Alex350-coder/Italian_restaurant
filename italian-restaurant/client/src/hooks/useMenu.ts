import { useState, useEffect } from 'react';
import api from '@/services/api';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  name: string;
  count: number;
}

// Hook para obtener items destacados
export function useFeaturedItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/menu/featured');
        const rawItems = response.data.data.items || [];
        setItems(rawItems.map((item: any) => ({
          ...item,
          price: Number(item.price),
        })));
      } catch (err: any) {
        console.error('Error fetching featured items:', err);
        setError(err?.message || 'Error al cargar items destacados');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return { items, loading, error };
}

// Hook para obtener categorías
export function useMenuCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/menu/categories');
        setCategories(response.data.data.categories || []);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err?.message || 'Error al cargar categorías');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

// Hook para obtener items del menú con filtro opcional de categoría
export function useMenuItems(category?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = category ? `/menu?category=${category}` : '/menu';
        const response = await api.get(url);
        const rawItems = response.data.data.items || [];
        setItems(rawItems.map((item: any) => ({
          ...item,
          price: Number(item.price),
        })));
      } catch (err: any) {
        console.error('Error fetching menu items:', err);
        setError(err?.message || 'Error al cargar menú');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [category]);

  return { items, loading, error };
}
