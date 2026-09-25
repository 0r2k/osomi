import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import './globals.css';

export const metadata: Metadata = {
  title: `${brand.name} · ${brand.tagline}`,
  description: '¿Por qué necesito descansar? La primera experiencia de Osomi.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
