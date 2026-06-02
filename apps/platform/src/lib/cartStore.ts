import { create } from "zustand";
import { apiRequest } from "./api";

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  slug: string;
  brand: string;
  image_url: string;
  quantity: number;
  stock: number;
  subtotal: string;
}

export interface CartResponse {
  id: number;
  user_id: string;
  total_amount: string;
  total_count: number;
  items: CartItem[];
}

interface CartState {
  items: CartItem[];
  totalAmount: string;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: "0",
  totalCount: 0,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<CartResponse>("/cart");
      set({
        items: res.items || [],
        totalAmount: res.total_amount || "0",
        totalCount: res.total_count || 0,
        isLoading: false,
      });
    } catch (err: any) {
      // If user is not authenticated, fall back to empty cart silently
      set({ items: [], totalAmount: "0", totalCount: 0, isLoading: false });
    }
  },

  addItem: async (productId: number, quantity = 1) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<CartResponse>("/cart/items", "POST", {
        product_id: productId,
        quantity,
      });
      set({
        items: res.items || [],
        totalAmount: res.total_amount || "0",
        totalCount: res.total_count || 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<CartResponse>(`/cart/items/${itemId}`, "PUT", {
        quantity,
      });
      set({
        items: res.items || [],
        totalAmount: res.total_amount || "0",
        totalCount: res.total_count || 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  removeItem: async (itemId: number) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<CartResponse>(`/cart/items/${itemId}`, "DELETE");
      set({
        items: res.items || [],
        totalAmount: res.total_amount || "0",
        totalCount: res.total_count || 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  clearCart: () => {
    set({ items: [], totalAmount: "0", totalCount: 0 });
  },

  getTotalItems: () => {
    return get().totalCount;
  },

  getTotalPrice: () => {
    return parseFloat(get().totalAmount) || 0;
  },
}));
