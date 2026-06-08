'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/quiz', label: 'Practice' },
    { href: '/snap-solve', label: 'Snap & Solve' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-[#0a0e1a]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-sm">
            A
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            ACESATAI
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="w-24" />
      </div>
    </nav>
  );
}
