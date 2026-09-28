import { brand } from '@/lib/brand';
// Datos que aparecen en /privacidad y /terminos.
export const legal = {
  brand: brand.name,
  responsible: 'Ricardo Andramuño',
  contactEmail: 'info@donrich.dev',
  country: 'Ecuador',
  updated: '28 de septiembre de 2026',
} as const;
