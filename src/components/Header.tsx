
import { ShoppingBag } from 'lucide-react';
import type { Language, Translations } from '../i18n/translations';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  favoritesCount: number;
  onSelectFavorites: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
  t: Translations;
}

const LANGUAGES: { code: Language; label: string; name: string }[] = [
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ro', label: 'RO', name: 'Română' },
];

const CART_LABELS = {
  it: 'Carrello',
  en: 'Shopping cart',
  ro: 'Coș de cumpărături',
};

export function Header({
  language,
  onLanguageChange,
  favoritesCount,
  onSelectFavorites,
  cartCount = 0,
  onOpenCart,
  t,
}: HeaderProps) {
  const cartLabel = CART_LABELS[language] || CART_LABELS.it;

  return (
    <header className="sticky top-0 z-40 bg-[#FFFBFD]/95 backdrop-blur-md border-b border-rose-200/70">

      <div className="max-w-7xl mx-auto min-h-16 px-3 sm:px-6 lg:px-8 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 py-2">

        {/* Logo */}

        <a
          href="#top"
          className="font-display text-base sm:text-xl font-semibold tracking-tight text-[#2D1B24] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] rounded-md"
        >
          Sarah's Wishlist ♡
        </a>

        {/* Navigazione desktop */}

        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#6B4E5C]"
        >
          <a
            href="#catalog"
            className="hover:text-[#C92A6D] transition-colors duration-150 whitespace-nowrap py-1 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] rounded"
          >
            {t.nav.catalog}
          </a>

          <button
            type="button"
            onClick={onSelectFavorites}
            className="hover:text-[#C92A6D] transition-colors duration-150 whitespace-nowrap py-1 underline-offset-4 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] rounded"
          >
            {t.nav.favorites}
          </button>

          <a
            href="#how-it-works"
            className="hover:text-[#C92A6D] transition-colors duration-150 whitespace-nowrap py-1 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] rounded"
          >
            {t.nav.howItWorks}
          </a>
        </nav>

        {/* Lingue, preferiti e carrello */}

        <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">

          {/* Selettore lingue */}

          <div
            role="group"
            aria-label={t.nav.languageLabel}
            className="inline-flex items-center p-0.5 rounded-lg bg-[#FDF2F6] border border-rose-200/70"
          >
            {LANGUAGES.map((lang) => {
              const active = language === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onLanguageChange(lang.code)}
                  aria-label={lang.name}
                  aria-pressed={active}
                  className={`px-1.5 sm:px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] ${
                    active
                      ? 'bg-white text-[#C92A6D] shadow-xs'
                      : 'text-[#6B4E5C] hover:text-[#2D1B24]'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>

          {/* Preferiti */}

          <button
            type="button"
            onClick={onSelectFavorites}
            aria-label={`${t.nav.favorites} (${favoritesCount})`}
            className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#FDF2F6] text-[#C92A6D] border border-rose-200 hover:bg-rose-100 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {favoritesCount > 0 ? '♥' : '♡'}
            </span>

            <span className="tabular-nums">
              {favoritesCount}
            </span>
          </button>

          {/* Carrello */}

          <button
            type="button"
            onClick={onOpenCart}
            disabled={!onOpenCart}
            aria-label={`${cartLabel} (${cartCount})`}
            aria-haspopup="dialog"
            className="relative inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-[#C92A6D] to-[#E84D91] text-white hover:shadow-md hover:shadow-pink-200 transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer min-h-11 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
          >
            <ShoppingBag
              className="w-5 h-5 shrink-0"
              aria-hidden="true"
            />

            <span className="hidden xl:inline">
              {cartLabel}
            </span>

            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-white text-[#C92A6D] text-xs font-bold tabular-nums">
              {cartCount}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}
