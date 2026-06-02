export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  object_key?: string;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  category_id?: number;
  category_name?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  sale_price?: number;
  brand?: string;
  frame_type?: string;
  material?: string;
  gender?: string;
  stock: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
}

export interface ProductSnapshot {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  brand: string;
  frame_type: string;
  material: string;
  gender: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  price: number;
  product_snapshot?: ProductSnapshot;
}

export interface Order {
  id: number;
  user_id: string;
  user_name?: string;
  user_email?: string;
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  total_amount: number;
  tracking_number?: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface Prescription {
  id: number;
  order_id?: number;
  user_id: string;
  user_name?: string;
  user_email?: string;
  prescription_type: string;
  file_url: string;
  object_key: string;
  notes?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  order_id: number;
  invoice_number: string;
  invoice_url: string;
  status: "PENDING" | "PAID";
  created_at: string;
}
