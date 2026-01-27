
import { AppSettings, Category, Product } from './types';

export const COLORS = {
  primary: '#e11d48', // Red
  secondary: '#fbbf24', // Yellow
  accent: '#22c55e', // Green
  dark: '#000000', // Black
};

export const ADMIN_PASSWORD = '2707';

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'Kones Gourmet',
  logo: 'https://picsum.photos/200/200?random=1',
  banner: 'https://picsum.photos/800/400?random=2',
  whatsapp: '64981324434',
  pixKey: '64993075543',
  pixName: 'Silvia Leticia Ferreira - Mercado Pago',
  deliveryFee: 5.00
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
    active: true
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
