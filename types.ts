
export interface Extra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  extras: Extra[];
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface AppSettings {
  storeName: string;
  logo: string;
  banner: string;
  whatsapp: string;
  pixKey: string;
  pixName: string;
  deliveryFee: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedExtras: string[];
  notes: string;
}

export type View = 'menu' | 'admin' | 'product-detail';
