import { useState } from 'react';
import { ArrowDownUp, Check, Copy, Gift, Search, Trash2, X, Gamepad2, Heart, Monitor, Package, PawPrint, Sparkles } from 'lucide-react';
import type { CategoryId, SortOrder, Translations } from '../i18n/translations';

interface CatalogControlsProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: CategoryId;
  onCategoryChange: (cat: CategoryId) => void;
  sortOrder: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  categoryCounts: Record<CategoryId, number>;
  visibleCount: number;
  totalCount: number;
  favoritesCount: number;
  activeReservationCount: number;
  onOpenReservationManager: () => void;
  onResetFilters: () => void;
  onClearFavorites: () => void;
  onCopyFavorites: () => Promise<boolean>;
  t: Translations;
}

const categoryIcons = {all:Gift,funko:Package,plush:PawPrint,gaming:Gamepad2,streaming:Monitor,accessories:Sparkles,favorites:Heart};
const CATEGORY_ORDER: CategoryId[] = [
  'all',
  'funko',
  'plush',
  'gaming',
  'streaming',
  'accessories',
  'favorites',
];

export function CatalogControls({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  sortOrder,
  onSortChange,
  categoryCounts,
  visibleCount,
  totalCount,
  favoritesCount,
  activeReservationCount,
  onOpenReservationManager,
  onResetFilters,
  onClearFavorites,
  onCopyFavorites,
  t,
}: CatalogControlsProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasActiveFilter =
    searchQuery.trim().length > 0 ||
    activeCategory !== 'all' ||
    sortOrder !== 'default';

  const handleCopy = async () => {
    const ok = await onCopyFavorites();
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search + Sort + Manage Reservation Row */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <label htmlFor="wishlist-search" className="sr-only">
            {t.controls.searchLabel}
          </label>
          <Search
            className="w-4 h-4 text-[#8C6878] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="wishlist-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.controls.searchPlaceholder}
            className="w-full h-11 pl-11 pr-10 rounded-xl bg-white border border-rose-200 text-sm text-[#2D1B24] placeholder:text-[#967382] focus:outline-none focus:border-[#C92A6D] focus:ring-2 focus:ring-[#C92A6D]/20 transition-colors"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t.controls.clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[#7A5A69] hover:text-[#2D1B24] hover:bg-[#FDF2F6] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="relative md:w-56 shrink-0">
          <label htmlFor="wishlist-sort" className="sr-only">
            {t.controls.sortLabel}
          </label>
          <ArrowDownUp
            className="w-4 h-4 text-[#8C6878] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <select
            id="wishlist-sort"
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
            className="w-full h-11 pl-10 pr-8 rounded-xl bg-white border border-rose-200 text-sm font-medium text-[#2D1B24] focus:outline-none focus:border-[#C92A6D] focus:ring-2 focus:ring-[#C92A6D]/20 cursor-pointer"
          >
            <option value="default">{t.controls.sortDefault}</option>
            <option value="az">{t.controls.sortAz}</option>
            <option value="za">{t.controls.sortZa}</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenReservationManager}
          className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-[#FDF2F6] text-[#2D1B24] border border-rose-200 hover:border-[#C92A6D]/50 hover:text-[#C92A6D] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D]"
        >
          <Gift className="w-4 h-4 text-[#C92A6D]" aria-hidden="true" />
          <span>{t.controls.myReservationsButton}</span>
          {activeReservationCount > 0 && (
            <span className="tabular-nums text-xs text-[#C92A6D]">
              ({activeReservationCount})
            </span>
          )}
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label={t.nav.catalog}
        className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#FDF2F6] border border-rose-200/70"
      >
        {CATEGORY_ORDER.map((catId) => {
          const CategoryIcon = categoryIcons[catId];
          const active = activeCategory === catId;
          const count = categoryCounts[catId] ?? 0;
          return (
            <button
              key={catId}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setConfirmingClear(false);
                onCategoryChange(catId);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 min-h-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] ${
                active
                  ? 'bg-white text-[#C92A6D] font-semibold shadow-xs border border-rose-200/70'
                  : 'text-[#5E4451] hover:text-[#2D1B24] hover:bg-white/60 border border-transparent'
              }`}
            >
              <CategoryIcon className="w-4 h-4 shrink-0" aria-hidden="true"/><span className="flex-1 text-left">{t.categories[catId]}</span>
              <span
                className={`tabular-nums text-xs ${
                  active ? 'text-[#C92A6D]/80' : 'text-[#8C6878]'
                }`}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Summary & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#6B4E5C]">
        <p className="tabular-nums">
          {t.controls.showingPrefix}{' '}
          <span className="font-semibold text-[#2D1B24]">{visibleCount}</span>{' '}
          {t.controls.showingMiddle}{' '}
          <span className="font-semibold text-[#2D1B24]">{totalCount}</span>{' '}
          {t.controls.showingSuffix}
        </p>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setConfirmingClear(false);
              onResetFilters();
            }}
            className="text-xs sm:text-sm font-medium text-[#C92A6D] hover:text-[#A81E58] underline underline-offset-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] rounded"
          >
            {t.controls.resetFilters}
          </button>
        )}
      </div>

      {/* Favorites Management Bar */}
      {activeCategory === 'favorites' && favoritesCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-[#FDF2F6] border border-rose-200/80">
          <p className="text-sm font-medium text-[#2D1B24]">
            {t.favoritesBar.title}{' '}
            <span className="tabular-nums text-[#C92A6D] font-semibold">
              ({favoritesCount})
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white text-[#2D1B24] border border-rose-200 hover:border-[#C92A6D]/50 hover:text-[#C92A6D] transition-colors min-h-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D]"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#C92A6D]" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{copied ? t.favoritesBar.copied : t.favoritesBar.copyList}</span>
            </button>

            {!confirmingClear ? (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-white text-[#6B4E5C] border border-rose-200 hover:text-[#C92A6D] hover:border-[#C92A6D]/50 transition-colors min-h-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D]"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>{t.favoritesBar.clearAll}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearFavorites();
                    setConfirmingClear(false);
                  }}
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] transition-colors min-h-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D]"
                >
                  {t.favoritesBar.confirmClear}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-white text-[#6B4E5C] border border-rose-200 hover:text-[#2D1B24] transition-colors min-h-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D]"
                >
                  {t.favoritesBar.cancelClear}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
