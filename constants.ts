
import { AppSettings, Category, Product } from './types';

export const ADMIN_PASSWORD = '2707';

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'Kones Gourmet',
  logo: 'https://images.unsplash.com/photo-1613564834361-9436948817d1?w=200',
  banner: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
  whatsapp: '64981324434',
  pixKey: '64993075543',
  pixName: 'Silvia Leticia Ferreira',
  deliveryFee: 5.00,
  promotion: {
    active: false,
    name: 'Promoção do Dia',
    description: 'Aproveite nosso desconto especial!',
    price: 0,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'
  },
  businessHours: {
    seg: { open: '18:00', close: '23:00', closed: false },
    ter: { open: '18:00', close: '23:00', closed: false },
    qua: { open: '18:00', close: '23:00', closed: false },
    qui: { open: '18:00', close: '23:00', closed: false },
    sex: { open: '18:00', close: '23:59', closed: false },
    sab: { open: '18:00', close: '23:59', closed: false },
    dom: { open: '18:00', close: '23:00', closed: false },
  }
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Kones Salgados' },
  { id: '2', name: 'Kones Doces' }
];

export const INITIAL_PRODUCTS: Product[] = [];
