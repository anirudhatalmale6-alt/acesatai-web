'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Espanol' },
  { code: 'pt', label: 'PT', name: 'Portugues' },
  { code: 'fr', label: 'FR', name: 'Francais' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'ja', label: 'JA', name: 'Japanese' },
  { code: 'zh', label: 'ZH', name: 'Chinese' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('EN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/quiz', label: 'Practice' },
    { href: '/snap-solve', label: 'Snap & Solve' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-[#0a0e1a]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-xs">
            A
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            ACESATAI
          </span>
        </Link>

        {/* Desktop Nav */}
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

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              {currentLang}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-gray-700 bg-[#1e293b] p-2 shadow-xl z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setCurrentLang(lang.label); setLangOpen(false); }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-xs text-gray-300 hover:bg-blue-600/10 hover:text-blue-300 transition-colors"
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-1.5 text-xs font-medium text-gray-400 hover:bg-red-600/10 hover:text-red-400 hover:border-red-600/50 transition-all"
          >
            Log Out
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-5 bg-gray-300 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-5 bg-gray-300 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-gray-300 transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-[#0a0e1a] px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-gray-800 pt-3 mt-3 flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-xs font-medium text-gray-300"
              >
                {currentLang}
              </button>
              {langOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-36 rounded-xl border border-gray-700 bg-[#1e293b] p-2 shadow-xl z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setCurrentLang(lang.label); setLangOpen(false); }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-xs text-gray-300 hover:bg-blue-600/10 hover:text-blue-300 transition-colors"
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setMobileMenuOpen(false); logout(); }}
              className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-xs font-medium text-gray-400 hover:bg-red-600/10 hover:text-red-400 transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
