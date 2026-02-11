
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

export interface Promotion {
  active: boolean;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface FeaturedItem {
  active: boolean;
  productId: string;
  title: string;
  description: string;
  image: string;
  price: number;
}

export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessHours {
  seg: DaySchedule;
  ter: DaySchedule;
  qua: DaySchedule;
  qui: DaySchedule;
  sex: DaySchedule;
  sab: DaySchedule;
  dom: DaySchedule;
}

export interface AppSettings {
  storeName: string;
  logo: string;
  banner: string;
  whatsapp: string;
  pixKey: string;
  pixName: string;
  deliveryFee: number;
  promotion?: Promotion;
  featuredItem?: FeaturedItem;
  businessHours?: BusinessHours;
  categoryOrder?: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedExtras: string[];
  notes: string;
}

export type View = 'menu' | 'admin';
