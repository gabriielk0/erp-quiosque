'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/insumos', label: 'Insumos' },
  { href: '/produtos', label: 'Cardápio' },
  { href: '/pdv', label: 'PDV' },
  { href: '/vendas', label: 'Vendas' },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-stone-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-6">
        <span className="font-display text-xl text-stone-900 dark:text-stone-100 shrink-0">
          Kiosk<span className="text-blue-600">ERP</span>
        </span>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                pathname === l.href
                  ? 'bg-blue-600 text-white'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          onClick={toggle}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-700 transition-colors text-lg"
          title="Alternar tema"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
