import heroImage from '../assets/images/hero_wishlist_banner_1794585021765.jpg';
import type { Translations } from '../i18n/translations';

interface HeroProps {
  totalCount: number;
  cartCount: number;
  reservedCount: number;
  language: "it" | "en" | "ro";
  favoritesCount: number;
  onSelectFavorites: () => void;
  t: Translations;
}

export function Hero({
  totalCount,
  cartCount,
  reservedCount,
  language,
  favoritesCount,
  onSelectFavorites,
  t,
}: HeroProps) {
  const labels = {it:["Nel catalogo","Prenotati","Nel carrello"],en:["In catalog","Reserved","In cart"],ro:["În catalog","Rezervate","În coș"]}[language];
  return (
    <section
      id="top"
      className="pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-rose-200/60 bg-gradient-to-b from-[#FDF2F6] to-[#FFFBFD]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-[#7A5A69] mb-4">
              <span>{t.hero.kickerPrefix}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {totalCount} {t.hero.wishlistCountUnit}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {favoritesCount} {t.hero.savedCountUnit} ♡
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#2D1B24] leading-[1.12] [text-wrap:balance]">
              Sarah's Wishlist ♡
            </h1>

            <p className="mt-3 text-lg sm:text-xl font-medium text-[#A81E58] [text-wrap:balance]">
              {t.hero.subtitle}
            </p>

            <p className="mt-4 text-base text-[#5E4451] leading-relaxed max-w-2xl">
              {t.hero.intro}
            </p>

            <div className="wishlist-hero-stats" aria-label={t.nav.catalog}>
              {[totalCount,reservedCount,cartCount].map((count,i)=><div key={i}><strong>{count}</strong><span>{labels[i]}</span></div>)}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#catalog"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] transition-colors duration-150 whitespace-nowrap shrink-0 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
              >
                {t.hero.exploreCta}
              </a>

              <button
                type="button"
                onClick={onSelectFavorites}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-white text-[#2D1B24] border border-rose-200 hover:border-[#C92A6D]/50 hover:text-[#C92A6D] transition-colors duration-150 whitespace-nowrap shrink-0 min-h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
              >
                <span>{t.hero.favoritesCta}</span>
                <span className="tabular-nums text-xs text-[#7A5A69]">
                  ({favoritesCount})
                </span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-64 sm:h-80 lg:h-full min-h-[260px] rounded-2xl overflow-hidden border border-rose-200/80 bg-[#FAE8EF] shadow-sm shadow-rose-900/5">
              <img
                src="/sarah-angel.jpg"
                onError={(e) => { if (e.currentTarget.getAttribute("src") !== heroImage) e.currentTarget.src = heroImage; }}
                alt={t.hero.imageAlt}
                className="wishlist-angel-photo w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
