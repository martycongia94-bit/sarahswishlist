import { useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { CatalogControls } from './components/CatalogControls';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { ProductCard } from './components/ProductCard';
import { ReservationModal } from './components/ReservationModal';
import { SarahAdminArea } from './components/SarahAdminArea';
import {
  cancelGiftReservation,
  declareGiftPurchased,
  DEFAULT_PUBLIC_SETTINGS,
  getInitialStaticCatalog,
  isProductAvailableToVisitors,
  lookupReservationByCode,
  normalizeReservationCode,
  reserveGiftProduct,
  subscribePublicProducts,
  subscribePublicSettings,
  type GiftReservationRecord,
  type LocalVisitorReservation,
  type PublicWishlistSettings,
  type WishlistProductRecord,
} from './firebase/wishlistService';
import {
  TRANSLATIONS,
  type CategoryId,
  type Language,
  type SortOrder,
} from './i18n/translations';

const FAVORITES_STORAGE_KEY = 'sarah_wishlist_favorites_v1';
const LANGUAGE_STORAGE_KEY = 'sarah_wishlist_lang_v1';
const LOCAL_RESERVATIONS_KEY = 'sarah_wishlist_my_reservations_v1';

function readStoredFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

function readStoredLanguage(): Language {
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === 'it' || raw === 'en' || raw === 'ro') return raw;
  } catch {
    // Ignore storage read errors in restricted contexts
  }
  return 'it';
}

function readStoredLocalReservations(): LocalVisitorReservation[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_RESERVATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (item): item is LocalVisitorReservation =>
        Boolean(item) &&
        typeof item.code === 'string' &&
        typeof item.productId === 'string' &&
        typeof item.productName === 'string' &&
        typeof item.expiresAtMs === 'number' &&
        item.expiresAtMs > now
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [language, setLanguage] = useState<Language>(readStoredLanguage);
  const [favorites, setFavorites] = useState<string[]>(readStoredFavorites);
  const [localReservations, setLocalReservations] = useState<
    LocalVisitorReservation[]
  >(readStoredLocalReservations);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [catalogProducts, setCatalogProducts] = useState<WishlistProductRecord[]>(
    getInitialStaticCatalog
  );
  const [isFromFirestore, setIsFromFirestore] = useState(false);
  const [publicSettings, setPublicSettings] = useState<PublicWishlistSettings>(
    DEFAULT_PUBLIC_SETTINGS
  );
  const [adminOpen, setAdminOpen] = useState(false);

  // Gift reservation modal & workflow state
  const [reservingProductId, setReservingProductId] = useState<string | null>(null);
  const [catalogActionError, setCatalogActionError] = useState('');
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [reservationBusy, setReservationBusy] = useState(false);
  const [reservationError, setReservationError] = useState('');
  const [reservationInfo, setReservationInfo] = useState('');
  const [activeReservation, setActiveReservation] =
    useState<GiftReservationRecord | null>(null);
  const [activeCode, setActiveCode] = useState('');

  const catalogRef = useRef<HTMLElement | null>(null);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubProducts = subscribePublicProducts((items, fromDb) => {
      setCatalogProducts(items);
      setIsFromFirestore(fromDb);
    });
    const unsubSettings = subscribePublicSettings((settings) => {
      setPublicSettings(settings);
    });
    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.meta.title;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage write errors
    }
  }, [language, t.meta.title]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favorites)
      );
    } catch {
      // Ignore storage write errors
    }
  }, [favorites]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LOCAL_RESERVATIONS_KEY,
        JSON.stringify(localReservations)
      );
    } catch {
      // Ignore storage write errors
    }
  }, [localReservations]);

  const activeLocalReservations = useMemo(() => {
    const byId = new Map(catalogProducts.map((p) => [p.id, p]));
    return localReservations.filter((res) => {
      if (res.expiresAtMs <= nowMs) return false;
      if (!isFromFirestore) return true;
      const product = byId.get(res.productId);
      if (!product) return false;
      return product.status === 'reserved';
    });
  }, [catalogProducts, isFromFirestore, localReservations, nowMs]);

  const visibleCatalog = useMemo(() => {
    return catalogProducts.filter((item) =>
      isProductAvailableToVisitors(item, nowMs)
    );
  }, [catalogProducts, nowMs]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const categoryCounts = useMemo<Record<CategoryId, number>>(() => {
    const counts: Record<CategoryId, number> = {
      all: visibleCatalog.length,
      funko: 0,
      plush: 0,
      gaming: 0,
      streaming: 0,
      accessories: 0,
      favorites: visibleCatalog.filter((item) => favoriteSet.has(item.id)).length,
    };
    for (const item of visibleCatalog) {
      counts[item.category] += 1;
    }
    return counts;
  }, [favoriteSet, visibleCatalog]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase(language);

    const matching = visibleCatalog.filter((product) => {
      if (activeCategory === 'favorites' && !favoriteSet.has(product.id)) {
        return false;
      }
      if (
        activeCategory !== 'all' &&
        activeCategory !== 'favorites' &&
        product.category !== activeCategory
      ) {
        return false;
      }

      if (!normalizedQuery) return true;

      const haystack = [
        product.name,
        product.brand,
        product.store ?? '',
        t.categories[product.category],
        product.description[language],
      ]
        .join(' ')
        .toLocaleLowerCase(language);

      return haystack.includes(normalizedQuery);
    });

    if (sortOrder === 'az') {
      return [...matching].sort((a, b) =>
        a.name.localeCompare(b.name, language, { sensitivity: 'base' })
      );
    }
    if (sortOrder === 'za') {
      return [...matching].sort((a, b) =>
        b.name.localeCompare(a.name, language, { sensitivity: 'base' })
      );
    }
    return matching;
  }, [
    activeCategory,
    favoriteSet,
    language,
    searchQuery,
    sortOrder,
    t.categories,
    visibleCatalog,
  ]);

  const mapReservationError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'ALREADY_RESERVED') return t.reservation.errorAlreadyReserved;
    if (msg === 'RESERVATION_LIMIT_REACHED') return t.reservation.errorLimitReached;
    if (msg === 'CATALOG_NOT_SYNCED') return t.reservation.errorNotSynced;
    if (msg === 'RESERVATION_EXPIRED') return t.reservation.errorExpired;
    if (msg === 'RESERVATION_NOT_FOUND' || msg === 'INVALID_RESERVATION_STATE') {
      return t.reservation.lookupNotFound;
    }
    return msg;
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectFavorites = () => {
    setActiveCategory('favorites');
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setSortOrder('default');
  };

  const handleClearFavorites = () => {
    setFavorites([]);
  };

  const handleCopyFavorites = async (): Promise<boolean> => {
    const favItems = visibleCatalog.filter((p) => favoriteSet.has(p.id));
    if (favItems.length === 0) return false;
    const text = favItems
      .map((item) =>
        item.url ? `- ${item.name}: ${item.url}` : `- ${item.name}`
      )
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleReserveProduct = async (product: WishlistProductRecord) => {
    setReservingProductId(product.id);
    setCatalogActionError('');
    setReservationError('');
    setReservationInfo('');

    try {
      const { code, reservationDocId, expiresAtMs } = await reserveGiftProduct(
        product,
        activeLocalReservations.length
      );

      const localEntry: LocalVisitorReservation = {
        code,
        productId: product.id,
        productName: product.name,
        productStore: product.store,
        productUrl: product.url,
        expiresAtMs,
      };
      setLocalReservations((prev) => [
        localEntry,
        ...prev.filter((item) => item.productId !== product.id),
      ]);

      setActiveCode(code);
      setActiveReservation({
        reservationDocId,
        productId: product.id,
        productName: product.name,
        productStore: product.store ?? '',
        productUrl: product.url ?? '',
        status: 'reserved',
        buyerNote: '',
        reservedAtMs: Date.now(),
        expiresAtMs,
        declaredAtMs: null,
      });
      setReservationModalOpen(true);
    } catch (err) {
      const mapped = mapReservationError(err);
      if (err instanceof Error && err.message === 'RESERVATION_LIMIT_REACHED') {
        setActiveReservation(null);
        setActiveCode('');
        setReservationError(mapped);
        setReservationModalOpen(true);
      } else {
        setCatalogActionError(mapped);
      }
    } finally {
      setReservingProductId(null);
    }
  };

  const handleOpenReservationManager = () => {
    setActiveReservation(null);
    setActiveCode('');
    setReservationError('');
    setReservationInfo('');
    setReservationModalOpen(true);
  };

  const handleLookupCode = async (rawCode: string) => {
    const normalized = normalizeReservationCode(rawCode);
    setReservationBusy(true);
    setReservationError('');
    setReservationInfo('');
    try {
      const found = await lookupReservationByCode(normalized);
      if (!found) {
        setReservationError(t.reservation.lookupNotFound);
        return;
      }
      if (found.status === 'reserved' && found.expiresAtMs <= Date.now()) {
        setReservationError(t.reservation.errorExpired);
        setLocalReservations((prev) =>
          prev.filter((item) => item.code !== normalized)
        );
        return;
      }
      setActiveCode(normalized);
      setActiveReservation(found);
    } catch (err) {
      setReservationError(mapReservationError(err));
    } finally {
      setReservationBusy(false);
    }
  };

  const handleSelectLocalReservation = async (
    item: LocalVisitorReservation
  ) => {
    await handleLookupCode(item.code);
  };

  const handleDeclarePurchased = async (code: string, buyerNote: string) => {
    const normalized = normalizeReservationCode(code);
    setReservationBusy(true);
    setReservationError('');
    setReservationInfo('');
    try {
      await declareGiftPurchased(normalized, buyerNote);
      setActiveReservation((prev) =>
        prev
          ? {
              ...prev,
              status: 'purchase_declared',
              buyerNote: buyerNote.trim(),
              declaredAtMs: Date.now(),
            }
          : prev
      );
      setLocalReservations((prev) =>
        prev.filter((item) => item.code !== normalized)
      );
      setReservationInfo(t.reservation.declaredSuccessBody);
    } catch (err) {
      setReservationError(mapReservationError(err));
    } finally {
      setReservationBusy(false);
    }
  };

  const handleCancelReservation = async (code: string) => {
    const normalized = normalizeReservationCode(code);
    setReservationBusy(true);
    setReservationError('');
    setReservationInfo('');
    try {
      await cancelGiftReservation(normalized);
      setLocalReservations((prev) =>
        prev.filter((item) => item.code !== normalized)
      );
      setActiveReservation(null);
      setActiveCode('');
      setReservationInfo(t.reservation.cancelledSuccess);
    } catch (err) {
      setReservationError(mapReservationError(err));
    } finally {
      setReservationBusy(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#FFFBFD] text-[#2D1B24]">
        <Header
          language={language}
          onLanguageChange={setLanguage}
          favoritesCount={categoryCounts.favorites}
          onSelectFavorites={handleSelectFavorites}
          t={t}
        />

        <main className="flex-1">
          <Hero
            totalCount={visibleCatalog.length}
            favoritesCount={categoryCounts.favorites}
            onSelectFavorites={handleSelectFavorites}
            t={t}
          />

          <section
            id="catalog"
            ref={catalogRef}
            className="py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-16"
          >
            <CatalogControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              categoryCounts={categoryCounts}
              visibleCount={filteredProducts.length}
              totalCount={visibleCatalog.length}
              favoritesCount={categoryCounts.favorites}
              activeReservationCount={activeLocalReservations.length}
              onOpenReservationManager={handleOpenReservationManager}
              onResetFilters={handleResetFilters}
              onClearFavorites={handleClearFavorites}
              onCopyFavorites={handleCopyFavorites}
              t={t}
            />

            {catalogActionError && (
              <div
                role="alert"
                className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-sm text-[#9B1C4E] flex items-center justify-between gap-4"
              >
                <span>{catalogActionError}</span>
                <button
                  type="button"
                  onClick={() => setCatalogActionError('')}
                  className="text-xs font-semibold underline cursor-pointer shrink-0"
                >
                  {t.reservation.close}
                </button>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    isFavorite={favoriteSet.has(product.id)}
                    isReserving={reservingProductId === product.id}
                    onToggleFavorite={handleToggleFavorite}
                    onReserve={handleReserveProduct}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl bg-[#FDF2F6] border border-rose-200/80 px-6 py-12 text-center max-w-xl mx-auto">
                <p className="text-2xl text-[#C92A6D]" aria-hidden="true">
                  ♡
                </p>
                <h2 className="mt-3 font-display text-xl font-semibold text-[#2D1B24]">
                  {activeCategory === 'favorites' &&
                  categoryCounts.favorites === 0
                    ? t.empty.favoritesTitle
                    : t.empty.searchTitle}
                </h2>
                <p className="mt-2 text-sm text-[#6B4E5C] leading-relaxed">
                  {activeCategory === 'favorites' &&
                  categoryCounts.favorites === 0
                    ? t.empty.favoritesBody
                    : t.empty.searchBody}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] transition-colors min-h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
                >
                  {t.empty.backToAll}
                </button>
              </div>
            )}
          </section>

          <HowItWorks publicSettings={publicSettings} t={t} />
        </main>

        <Footer onOpenAdmin={() => setAdminOpen(true)} t={t} />

        <ReservationModal
          isOpen={reservationModalOpen}
          onClose={() => setReservationModalOpen(false)}
          language={language}
          activeReservation={activeReservation}
          activeCode={activeCode}
          localReservations={activeLocalReservations}
          onLookupCode={handleLookupCode}
          onSelectLocalReservation={handleSelectLocalReservation}
          onDeclarePurchased={handleDeclarePurchased}
          onCancelReservation={handleCancelReservation}
          busy={reservationBusy}
          errorMsg={reservationError}
          infoMsg={reservationInfo}
          t={t}
        />

        <SarahAdminArea
          isOpen={adminOpen}
          onClose={() => setAdminOpen(false)}
          products={catalogProducts}
          isFromFirestore={isFromFirestore}
          publicSettings={publicSettings}
          t={t}
        />
      </div>
    </MotionConfig>
  );
}
