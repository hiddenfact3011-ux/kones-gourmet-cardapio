
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
  isDailySuggestion?: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  customerName: string;
  stars: number;
  comment: string;
  date: string;
}

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

export interface AppSettings {
  storeName: string;
  storeUrl?: string; // Novo campo para o link oficial
  logo: string;
  banner: string;
  whatsapp: string;
  pixKey: string;
  pixName: string;
  deliveryFee: number;
  businessHours?: BusinessHours[];
  dailySuggestionId?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedExtras: string[];
  notes: string;
}

export type View = 'menu' | 'admin';
export type CartStep = 'items' | 'checkout' | 'confirm';