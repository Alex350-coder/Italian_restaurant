import { MenuItem } from "./menu";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY = "ready",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum OrderType {
  DINE_IN = "dine_in",
  TAKEOUT = "takeout",
  DELIVERY = "delivery",
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Pendiente",
  [OrderStatus.CONFIRMED]: "Confirmado",
  [OrderStatus.PREPARING]: "En preparación",
  [OrderStatus.READY]: "Listo",
  [OrderStatus.OUT_FOR_DELIVERY]: "En camino",
  [OrderStatus.DELIVERED]: "Entregado",
  [OrderStatus.COMPLETED]: "Completado",
  [OrderStatus.CANCELLED]: "Cancelado",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  [OrderType.DINE_IN]: "Para comer aquí",
  [OrderType.TAKEOUT]: "Para llevar",
  [OrderType.DELIVERY]: "A domicilio",
};

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes: string | null;
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemDTO {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}

export interface CreateOrderDTO {
  orderType: OrderType;
  items: CreateOrderItemDTO[];
  notes?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  cancellationReason?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  orderType?: OrderType;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
