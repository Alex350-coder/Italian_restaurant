export enum Category {
  APPETIZERS = "appetizers",
  PASTA = "pasta",
  PIZZA = "pizza",
  RISOTTO = "risotto",
  MEAT = "meat",
  SEAFOOD = "seafood",
  SALADS = "salads",
  DESSERTS = "desserts",
  BEVERAGES = "beverages",
  WINE = "wine",
}

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.APPETIZERS]: "Antipasti",
  [Category.PASTA]: "Pasta",
  [Category.PIZZA]: "Pizza",
  [Category.RISOTTO]: "Risotto",
  [Category.MEAT]: "Carne",
  [Category.SEAFOOD]: "Pesce",
  [Category.SALADS]: "Insalate",
  [Category.DESSERTS]: "Dolci",
  [Category.BEVERAGES]: "Bevande",
  [Category.WINE]: "Vino",
};

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: Category;
  imageUrl: string | null;
  ingredients: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTimeMinutes: number | null;
  calories: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemDTO {
  name: string;
  description?: string;
  price: number;
  category: Category;
  imageUrl?: string;
  ingredients?: string[];
  isAvailable?: boolean;
  isFeatured?: boolean;
  preparationTimeMinutes?: number;
  calories?: number;
  sortOrder?: number;
}

export interface UpdateMenuItemDTO extends Partial<CreateMenuItemDTO> {}

export interface MenuItemFilters {
  category?: Category;
  isAvailable?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface PaginatedMenuItems {
  items: MenuItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
