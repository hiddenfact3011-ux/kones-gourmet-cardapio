
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
  logo: 'https://picsum.photos/200/200?random=1',
  banner: 'https://picsum.photos/800/400?random=2',
  whatsapp: '64981324434',
  pixKey: '64993075543',
  pixName: 'Silvia Leticia Ferreira - Mercado Pago',
  deliveryFee: 5.00,
  businessHours: INITIAL_HOURS
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Kones Salgados' },
  { id: '2', name: 'Kones Doces' },
  { id: '3', name: 'Bebidas' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Kone de Frango com Catupiry',
    description: 'Massa crocante recheada com frango desfiado temperado e o legítimo catupiry.',
    price: 18.50,
    image: 'https://picsum.photos/400/400?random=10',
    categoryId: '1',
    extras: [
      { id: 'e1', name: 'Bacon extra', price: 3.50 },
      { id: 'e2', name: 'Dobro de Catupiry', price: 4.00 }
    ],
    active: true,
    isDailySuggestion: true
  },
  {
    id: 'p2',
    name: 'Kone de Nutella com Morango',
    description: 'A combinação perfeita de creme de avelã e morangos frescos.',
    price: 22.00,
    image: 'https://picsum.photos/400/400?random=11',
    categoryId: '2',
    extras: [],
    active: true
  },
  {
    id: 'p3',
    name: 'Coca-Cola 350ml',
    description: 'Geladinha para acompanhar.',
    price: 6.00,
    image: 'https://picsum.photos/400/400?random=12',
    categoryId: '3',
    extras: [],
    active: true
  }
];
