
import { AppSettings, Category, Product, BusinessHours } from './types';

export const ADMIN_PASSWORD = '2707';

const INITIAL_HOURS: BusinessHours[] = [
  { day: 'Segunda', open: '18:00', close: '23:00', isOpen: true },
  { day: 'Terça', open: '18:00', close: '23:00', isOpen: true },
  { day: 'Quarta', open: '18:00', close: '23:00', isOpen: true },
  { day: 'Quinta', open: '18:00', close: '23:00', isOpen: true },
  { day: 'Sexta', open: '18:00', close: '00:00', isOpen: true },
  { day: 'Sábado', open: '18:00', close: '00:00', isOpen: true },
  { day: 'Domingo', open: '18:00', close: '23:00', isOpen: true },
];

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'Kones Gourmet',
  logo: 'https://images.unsplash.com/photo-1613564834361-9436948817d1?w=200',
  banner: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
  whatsapp: '64981324434',
  pixKey: '64993075543',
  pixName: 'Silvia Leticia Ferreira',
  deliveryFee: 5.00,
  businessHours: INITIAL_HOURS
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Kones Salgados' },
  { id: '2', name: 'Kones Doces' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Kone de Frango',
    description: 'Frango desfiado com catupiry.',
    price: 18.50,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    categoryId: '1',
    extras: [],
    active: true
  }
];
