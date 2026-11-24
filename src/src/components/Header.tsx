import type { Language, Translations } from '../i18n/translations';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  favoritesCount: number;
  onSelectFavorites: () => void;
  t: Translations;
}

const LANGUAGES: { code: Language; label: string; name: string }[] = [
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ro', label: 'RO', name: 'Română' },
];

export function Header({
  language,
  onLanguageChange,
  favoritesCount,
  onSelectFavorites,
  t,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 bg-[#FFFBFD]/92 backdrop-blur-md border-b border-rose-200/70">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <a
          href="#top"
          className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#2D1B24] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2 rounded-md"
        >
          Sarah's Wishlist ♡
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6B4E5C]"
        >
          <a
            href="#catalog"
            className="hover:text-[#C92A6D] transition-colors duration-150 whitespace-nowrap shrink-0 py-1 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] rounded"
          >
            {t.nav.catalog}
          </a>
          <button
            type="button"
            onClick={onSelectFavorites}
            className="hover:text-[#C92A6D] transition-colors duration-150 whitespace-nowrap shrink-0 py-1 underline-offset-4 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] rounded"
          >
            {t.nav.favorites}
          </button>
          <a
            href="#how-it-works"
            className="hover:text-[#C92A6D] transition-colors duration-150 whitespace-nowrap shrink-0 py-1 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] rounded"
          >
            {t.nav.howItWorks}
          </a>
        </nav>

        {/* Zone 3: Language selector & Favorites quick action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                  className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] ${
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

          <button
            type="button"
            onClick={onSelectFavorites}
            aria-label={`${t.nav.favorites} (${favoritesCount})`}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">{favoritesCount > 0 ? '♥' : '♡'}</span>
            <span className="tabular-nums">{favoritesCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
