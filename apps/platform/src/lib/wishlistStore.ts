import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../types";

export interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  slug: string;
  brand: string;
  price: number;
  sale_price?: number;
  image_url: string;
  added_at: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: number) => boolean;
  clearAll: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const existing = get().items.find((i) => i.product_id === product.id);
        if (existing) return;

        const item: WishlistItem = {
          id: Date.now(),
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand || "",
          price: product.price,
          sale_price: product.sale_price,
          image_url: product.images?.[0]?.image_url || "",
          added_at: new Date().toISOString(),
        };

        set((state) => ({ items: [...state.items, item] }));
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }));
      },

      toggleItem: (product) => {
        const exists = get().items.find((i) => i.product_id === product.id);
        if (exists) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((i) => i.product_id === productId);
      },

      clearAll: () => set({ items: [] }),
    }),
    {
      name: "cromatic-wishlist",
    }
  )
);
