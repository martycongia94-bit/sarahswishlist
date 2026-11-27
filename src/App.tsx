
import { useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import Cart from './components/Cart';
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
const CART_STORAGE_KEY = 'sarah_wishlist_cart_v1';

function readStoredIds(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(
        parsed.filter(
          (id): id is string => typeof id === 'string'
        )
      )
    );
  } catch {
    return [];
  }
}

function readStoredFavorites(): string[] {
  return readStoredIds(FAVORITES_STORAGE_KEY);
}

function readStoredCart(): string[] {
  return readStoredIds(CART_STORAGE_KEY);
}

function readStoredLanguage(): Language {
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (raw === 'it' || raw === 'en' || raw === 'ro') {
      return raw;
    }
  } catch {
    // Ignore storage errors
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
  const [language, setLanguage] =
    useState<Language>(readStoredLanguage);

  const [favorites, setFavorites] =
    useState<string[]>(readStoredFavorites);

  const [cartIds, setCartIds] =
    useState<string[]>(readStoredCart);

  const [cartOpen, setCartOpen] = useState(false);

  const [localReservations, setLocalReservations] =
    useState<LocalVisitorReservation[]>(
      readStoredLocalReservations
    );

  const [activeCategory, setActiveCategory] =
    useState<CategoryId>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [availability, setAvailability] = useState<'available'|'reserved'|'received'>('available');

  const [sortOrder, setSortOrder] =
    useState<SortOrder>('default');

  const [nowMs, setNowMs] =
    useState<number>(() => Date.now());

  const [catalogProducts, setCatalogProducts] =
    useState<WishlistProductRecord[]>(getInitialStaticCatalog);

  const [isFromFirestore, setIsFromFirestore] =
    useState(false);

  const [publicSettings, setPublicSettings] =
    useState<PublicWishlistSettings>(
      DEFAULT_PUBLIC_SETTINGS
    );

  const [adminOpen, setAdminOpen] = useState(false);

  const [paidIds, setPaidIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [statusReady, setStatusReady] = useState(false);

  const [stripeReturn] = useState(
    () =>
      new URLSearchParams(window.location.search)
        .get('stripe_test')
  );

  const [showStripeNotice, setShowStripeNotice] =
    useState(true);

  const [reservingProductId, setReservingProductId] =
    useState<string | null>(null);

  const [catalogActionError, setCatalogActionError] =
    useState('');

  const [reservationModalOpen, setReservationModalOpen] =
    useState(false);

  const [reservationBusy, setReservationBusy] =
    useState(false);

  const [reservationError, setReservationError] =
    useState('');

  const [reservationInfo, setReservationInfo] =
    useState('');

  const [activeReservation, setActiveReservation] =
    useState<GiftReservationRecord | null>(null);

  const [activeCode, setActiveCode] = useState('');

  const catalogRef = useRef<HTMLElement | null>(null);

  const t = TRANSLATIONS[language];

  const checkoutMessages = {
    it: {
      success:
        'Grazie! Sei tornato dal pagamento di prova. La conferma viene verificata dal sistema. Nessuna spedizione reale.',
      cancel:
        'Pagamento interrotto. Il carrello conserva i tuoi regali. I prodotti in attesa torneranno disponibili dopo il rilascio della sessione.',
      unavailable:
        'Alcuni regali nel carrello non sono temporaneamente disponibili.',
      checking:
        'Verifica della disponibilità dei regali...',
    },
    en: {
      success:
        'Thank you! You returned from test checkout. The system is verifying confirmation. No real shipment.',
      cancel:
        'Checkout interrupted. Your gifts remain in your cart. Pending products will become available when the session is released.',
      unavailable:
        'Some gifts in your cart are temporarily unavailable.',
      checking:
        'Checking gift availability...',
    },
    ro: {
      success:
        'Mulțumim! Ai revenit de la plata de test. Sistemul verifică confirmarea. Nu există o livrare reală.',
      cancel:
        'Plata a fost întreruptă. Cadourile rămân în coș. Produsele în așteptare vor redeveni disponibile după eliberarea sesiunii.',
      unavailable:
        'Unele cadouri din coș sunt temporar indisponibile.',
      checking:
        'Se verifică disponibilitatea cadourilor...',
    },
  }[language];

  // Aggiornamento dello stato degli ordini Stripe

  useEffect(() => {
    let active = true;
    let busy = false;

    const refresh = async () => {
      if (busy) return;

      busy = true;

      try {
        const response = await fetch('/api/test/status', {
          cache: 'no-store',
        });

        if (!response.ok) {
          if (active) setStatusReady(false);
          return;
        }

        const data = await response.json();

        if (
          active &&
          Array.isArray(data.paid) &&
          Array.isArray(data.pending)
        ) {
          const paid = data.paid.map(String);
          const pending = data.pending.map(String);

          setPaidIds(paid);
          setPendingIds(pending);

          // Elimina dal carrello solo i prodotti pagati
          setCartIds((previous) =>
            previous.filter((id) => !paid.includes(id))
          );

          setStatusReady(true);
        } else if (active) {
          setStatusReady(false);
        }
      } catch {
        if (active) setStatusReady(false);
      } finally {
        busy = false;
      }
    };

    void refresh();

    const timer = window.setInterval(refresh, 5000);

    window.addEventListener('focus', refresh);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Salvataggio del carrello nel browser

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cartIds)
      );
    } catch {
      // Ignore storage errors
    }
  }, [cartIds]);

  // Aggiornamento delle prenotazioni

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  // Sincronizzazione Firebase

  useEffect(() => {
    const unsubProducts = subscribePublicProducts(
      (items, fromDb) => {
        setCatalogProducts(items);
        setIsFromFirestore(fromDb);
      }
    );

    const unsubSettings = subscribePublicSettings(
      (settings) => {
        setPublicSettings(settings);
      }
    );

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // Salvataggio lingua

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.meta.title;

    try {
      window.localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        language
      );
    } catch {
      // Ignore storage errors
    }
  }, [language, t.meta.title]);

  // Salvataggio preferiti

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favorites)
      );
    } catch {
      // Ignore storage errors
    }
  }, [favorites]);

  // Salvataggio prenotazioni

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LOCAL_RESERVATIONS_KEY,
        JSON.stringify(localReservations)
      );
    } catch {
      // Ignore storage errors
    }
  }, [localReservations]);

  const activeLocalReservations = useMemo(() => {
    const byId = new Map(
      catalogProducts.map((p) => [p.id, p])
    );

    return localReservations.filter((res) => {
      if (res.expiresAtMs <= nowMs) return false;

      if (!isFromFirestore) return true;

      const product = byId.get(res.productId);

      if (!product) return false;

      return product.status === 'reserved';
    });
  }, [
    catalogProducts,
    isFromFirestore,
    localReservations,
    nowMs,
  ]);

  const paidSet = useMemo(
    () => new Set(paidIds),
    [paidIds]
  );

  const pendingSet = useMemo(
    () => new Set(pendingIds),
    [pendingIds]
  );

  const cartSet = useMemo(
    () => new Set(cartIds),
    [cartIds]
  );

  const favoriteSet = useMemo(
    () => new Set(favorites),
    [favorites]
  );

  // Catalogo pubblico

  const visibleCatalog = useMemo(() => {
    return catalogProducts.filter(
      (item) =>
        isProductAvailableToVisitors(item, nowMs) &&
        !paidSet.has(String(item.id))
    );
  }, [catalogProducts, nowMs, paidSet]);

  // Prodotti attualmente acquistabili nel carrello

  const cartProducts = useMemo(() => {
    return visibleCatalog.filter(
      (product) =>
        cartSet.has(String(product.id)) &&
        !pendingSet.has(String(product.id))
    );
  }, [visibleCatalog, cartSet, pendingSet]);

  const cartUnavailableCount =
    cartIds.filter((id) => !paidSet.has(id)).length -
    cartProducts.length;

  // Contatori delle categorie

  const categoryCounts = useMemo<
    Record<CategoryId, number>
  >(() => {
    const counts: Record<CategoryId, number> = {
      all: visibleCatalog.length,
      funko: 0,
      plush: 0,
      gaming: 0,
      streaming: 0,
      accessories: 0,
      favorites: visibleCatalog.filter(
        (item) => favoriteSet.has(item.id)
      ).length,
    };

    for (const item of visibleCatalog) {
      counts[item.category] += 1;
    }

    return counts;
  }, [favoriteSet, visibleCatalog]);

  // Ricerca e filtri

  const filteredProducts = useMemo(() => {
    const normalizedQuery =
      searchQuery.trim().toLocaleLowerCase(language);

    const source = availability === 'available' ? visibleCatalog : catalogProducts.filter(p => availability === 'received' ? p.status === 'received' : p.status === 'reserved' && !isProductAvailableToVisitors(p, nowMs));
    const matching = source.filter((product) => {
      if (brand && product.brand !== brand) return false;
      if (
        activeCategory === 'favorites' &&
        !favoriteSet.has(product.id)
      ) {
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
        a.name.localeCompare(b.name, language, {
          sensitivity: 'base',
        })
      );
    }

    if (sortOrder === 'za') {
      return [...matching].sort((a, b) =>
        b.name.localeCompare(a.name, language, {
          sensitivity: 'base',
        })
      );
    }

    return matching;
  }, [
    activeCategory,
    availability, brand, catalogProducts, nowMs,
    favoriteSet,
    language,
    searchQuery,
    sortOrder,
    t.categories,
    visibleCatalog,
  ]);

  // Gestione carrello

  const handleAddToCart = (
    product: WishlistProductRecord
  ) => {
    const id = String(product.id);

    if (
      !statusReady ||
      paidSet.has(id) ||
      pendingSet.has(id) ||
      !isProductAvailableToVisitors(product, Date.now())
    ) {
      return;
    }

    setCartIds((previous) =>
      previous.includes(id)
        ? previous
        : [...previous, id]
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartIds((previous) =>
      previous.filter((item) => item !== id)
    );
  };

  const handleOpenCart = () => {
    setCartOpen(true);
  };

  // Gestione errori prenotazioni

  const mapReservationError = (err: unknown): string => {
    const msg =
      err instanceof Error ? err.message : String(err);

    if (msg === 'ALREADY_RESERVED') {
      return t.reservation.errorAlreadyReserved;
    }

    if (msg === 'RESERVATION_LIMIT_REACHED') {
      return t.reservation.errorLimitReached;
    }

    if (msg === 'CATALOG_NOT_SYNCED') {
      return t.reservation.errorNotSynced;
    }

    if (msg === 'RESERVATION_EXPIRED') {
      return t.reservation.errorExpired;
    }

    if (
      msg === 'RESERVATION_NOT_FOUND' ||
      msg === 'INVALID_RESERVATION_STATE'
    ) {
      return t.reservation.lookupNotFound;
    }

    return msg;
  };

  // Gestione preferiti

  const handleToggleFavorite = (id: string) => {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const handleSelectFavorites = () => {
    setAvailability('available');
    setActiveCategory('favorites');

    catalogRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setBrand(''); setAvailability('available');
    setActiveCategory('all');
    setSortOrder('default');
  };

  const handleClearFavorites = () => {
    setFavorites([]);
  };

  const handleCopyFavorites =
    async (): Promise<boolean> => {
      const favItems = visibleCatalog.filter(
        (p) => favoriteSet.has(p.id)
      );

      if (favItems.length === 0) return false;

      const text = favItems
        .map((item) =>
          item.url
            ? `- ${item.name}: ${item.url}`
            : `- ${item.name}`
        )
        .join('\n');

      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    };

  // Prenotazione regalo

  const handleReserveProduct = async (
    product: WishlistProductRecord
  ) => {
    const id = String(product.id);

    if (
      !statusReady ||
      paidSet.has(id) ||
      pendingSet.has(id) ||
      cartSet.has(id)
    ) {
      return;
    }

    setReservingProductId(product.id);
    setCatalogActionError('');
    setReservationError('');
    setReservationInfo('');

    try {
      const {
        code,
        reservationDocId,
        expiresAtMs,
      } = await reserveGiftProduct(
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

      setLocalReservations((previous) => [
        localEntry,
        ...previous.filter(
          (item) => item.productId !== product.id
        ),
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

      if (
        !(
          err instanceof Error &&
          err.message === 'RESERVATION_LIMIT_REACHED'
        )
      ) {
        setCatalogActionError(mapped);
      }

      setActiveReservation(null);
      setActiveCode('');
      setReservationError(mapped);
      setReservationModalOpen(true);
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
      const found =
        await lookupReservationByCode(normalized);

      if (!found) {
        setReservationError(
          t.reservation.lookupNotFound
        );
        return;
      }

      if (
        found.status === 'reserved' &&
        found.expiresAtMs <= Date.now()
      ) {
        setReservationError(t.reservation.errorExpired);

        setLocalReservations((previous) =>
          previous.filter(
            (item) => item.code !== normalized
          )
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

  const handleDeclarePurchased = async (
    code: string,
    buyerNote: string
  ) => {
    const normalized = normalizeReservationCode(code);

    setReservationBusy(true);
    setReservationError('');
    setReservationInfo('');

    try {
      await declareGiftPurchased(normalized, buyerNote);

      setActiveReservation((previous) =>
        previous
          ? {
              ...previous,
              status: 'purchase_declared',
              buyerNote: buyerNote.trim(),
              declaredAtMs: Date.now(),
            }
          : previous
      );

      setLocalReservations((previous) =>
        previous.filter(
          (item) => item.code !== normalized
        )
      );

      setReservationInfo(
        t.reservation.declaredSuccessBody
      );
    } catch (err) {
      setReservationError(mapReservationError(err));
    } finally {
      setReservationBusy(false);
    }
  };

  const handleCancelReservation = async (
    code: string
  ) => {
    const normalized = normalizeReservationCode(code);

    setReservationBusy(true);
    setReservationError('');
    setReservationInfo('');

    try {
      await cancelGiftReservation(normalized);

      setLocalReservations((previous) =>
        previous.filter(
          (item) => item.code !== normalized
        )
      );

      setActiveReservation(null);
      setActiveCode('');

      setReservationInfo(
        t.reservation.cancelledSuccess
      );
    } catch (err) {
      setReservationError(mapReservationError(err));
    } finally {
      setReservationBusy(false);
    }
  };

  const dismissStripeNotice = () => {
    setShowStripeNotice(false);

    const url = new URL(window.location.href);

    url.searchParams.delete('stripe_test');

    window.history.replaceState(
      null,
      '',
      url.toString()
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="wishlist-neon min-h-screen flex flex-col bg-[#FFFBFD] text-[#2D1B24]">

        <Header
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          onCatalog={()=>{setAvailability('available');setActiveCategory('all');}}
          onReserved={()=>{handleResetFilters();setAvailability('reserved');catalogRef.current?.scrollIntoView({block:'start'});}}
          onReceived={()=>{handleResetFilters();setAvailability('received');catalogRef.current?.scrollIntoView({block:'start'});}}
          language={language}
          onLanguageChange={setLanguage}
          favoritesCount={categoryCounts.favorites}
          onSelectFavorites={handleSelectFavorites}
          cartCount={cartProducts.length}
          onOpenCart={handleOpenCart}
          t={t}
        />

        <main className="flex-1">

          {/* Messaggio di ritorno da Stripe */}

          {(stripeReturn === 'success' ||
            stripeReturn === 'cancel') &&
            showStripeNotice && (
              <div
                role="status"
                className="mx-auto mt-5 max-w-3xl px-4"
              >
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center text-[#9B1C4E]">
                  <p
                    className="text-2xl"
                    aria-hidden="true"
                  >
                    ♡
                  </p>

                  <p className="mt-2 font-semibold">
                    {stripeReturn === 'success'
                      ? checkoutMessages.success
                      : checkoutMessages.cancel}
                  </p>

                  <button
                    type="button"
                    className="mt-3 underline text-sm"
                    onClick={dismissStripeNotice}
                  >
                    {t.reservation.close}
                  </button>
                </div>
              </div>
            )}

          <Hero
            purchasedCount={catalogProducts.filter(p => p.status === 'confirmed' || p.status === 'received').length}
            language={language}
            cartCount={cartProducts.length}
            reservedCount={catalogProducts.filter(p => p.status === "reserved" && !isProductAvailableToVisitors(p, nowMs)).length}
            totalCount={visibleCatalog.length}
            favoritesCount={categoryCounts.favorites}
            onSelectFavorites={handleSelectFavorites}
            t={t}
          />

          <section
            id="catalog"
            ref={catalogRef}
            className="wishlist-catalog py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28"
          >
            <div className="wishlist-sidebar">
            <h2 className="wishlist-section-title">♡ {language === "it" ? "Categorie" : language === "ro" ? "Categorii" : "Categories"}</h2>
            <CatalogControls
              language={language} brand={brand} onBrandChange={setBrand} brands={Array.from(new Set(catalogProducts.map(p=>p.brand).filter(Boolean))).sort()}
              availability={availability} onAvailabilityChange={setAvailability}
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
              activeReservationCount={
                activeLocalReservations.length
              }
              onOpenReservationManager={
                handleOpenReservationManager
              }
              onResetFilters={handleResetFilters}
              onClearFavorites={handleClearFavorites}
              onCopyFavorites={handleCopyFavorites}
              t={t}
            />
            </div>
            <div className="wishlist-results">
            <div className="wishlist-catalog-heading"><div><h2 className="wishlist-section-title">{t.nav.catalog}</h2><p>{language==='it'?'Scegli un regalo per Sarah ♡':language==='ro'?'Alege un cadou pentru Sarah ♡':'Choose a gift for Sarah ♡'}</p></div><select className="hidden lg:block rounded-xl border p-2" aria-label={t.controls.sortLabel} value={sortOrder} onChange={e=>setSortOrder(e.target.value as SortOrder)}><option value="default">{t.controls.sortDefault}</option><option value="az">{t.controls.sortAz}</option><option value="za">{t.controls.sortZa}</option></select></div>
            {!statusReady && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-sm text-[#9B1C4E]"
              >
                {checkoutMessages.checking}
              </div>
            )}

            {cartUnavailableCount > 0 && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                {checkoutMessages.unavailable}

                <button
                  type="button"
                  className="ml-2 font-semibold underline"
                  onClick={() => {
                    const availableIds = new Set(
                      cartProducts.map((p) =>
                        String(p.id)
                      )
                    );

                    setCartIds((previous) =>
                      previous.filter((id) =>
                        availableIds.has(id)
                      )
                    );
                  }}
                >
                  {language === 'it'
                    ? 'Rimuovi indisponibili'
                    : language === 'en'
                    ? 'Remove unavailable gifts'
                    : 'Elimină cadourile indisponibile'}
                </button>
              </div>
            )}

            {catalogActionError && (
              <div
                role="alert"
                className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-sm text-[#9B1C4E] flex items-center justify-between gap-4"
              >
                <span>{catalogActionError}</span>

                <button
                  type="button"
                  onClick={() =>
                    setCatalogActionError('')
                  }
                  className="text-xs font-semibold underline cursor-pointer shrink-0"
                >
                  {t.reservation.close}
                </button>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="wishlist-products mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {filteredProducts.map((product) => (
                  availability !== 'available' ? <article key={product.id} className="overflow-hidden rounded-xl border border-pink-400 bg-[#291025] p-3"><img src={product.image || undefined} alt={product.name} className="aspect-square w-full object-contain"/><h3>{product.name}</h3><p>{availability==='reserved' ? (language==='it'?'Prenotato':language==='ro'?'Rezervat':'Reserved') : (language==='it'?'Ricevuto':language==='ro'?'Primit':'Received')}</p></article> : <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    isFavorite={
                      favoriteSet.has(product.id)
                    }
                    isReserving={
                      reservingProductId === product.id
                    }
                    isInCart={
                      cartSet.has(String(product.id))
                    }
                    isPending={
                      pendingSet.has(String(product.id))
                    }
                    onToggleFavorite={
                      handleToggleFavorite
                    }
                    onReserve={handleReserveProduct}
                    onAddToCart={
                      statusReady
                        ? handleAddToCart
                        : undefined
                    }
                    t={t}
                  />
                ))}

              </div>
            ) : (
              <div className="mt-10 rounded-2xl bg-[#FDF2F6] border border-rose-200/80 px-6 py-12 text-center max-w-xl mx-auto">

                <p
                  className="text-2xl text-[#C92A6D]"
                  aria-hidden="true"
                >
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

            </div>
          </section>

          <div className="wishlist-how"><HowItWorks
            publicSettings={publicSettings}
            t={t}
          /></div>

          <section id="faq" className="wishlist-faq">
            <h2>FAQ ♡</h2>
            {({it:[['Come acquisto un regalo?','Aggiungi il regalo al carrello. Per i prodotti Throne, prosegui sul sito Throne per completare il pagamento.'],['Il prezzo è definitivo?','Per i prodotti Throne il prezzo definitivo, comprese eventuali spese, è indicato sul sito Throne.'],['Come gestisco una prenotazione?','Usa Gestisci prenotazione e il tuo codice.']],en:[['How do I buy a gift?','Add a gift to your cart. For Throne products, continue to Throne to complete payment.'],['Is the price final?','The final price and any fees for Throne products are shown on Throne.'],['How do I manage a reservation?','Use Manage reservation and your code.']],ro:[['Cum cumpăr un cadou?','Adaugă cadoul în coș. Pentru produsele Throne, continuă pe Throne pentru plată.'],['Prețul este final?','Prețul final și eventualele taxe pentru produsele Throne sunt afișate pe Throne.'],['Cum gestionez o rezervare?','Folosește gestionarea rezervării și codul tău.']]}[language]).map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </section>
        </main>

        <Footer
          onOpenAdmin={() => setAdminOpen(true)}
          t={t}
        />

        {/* Carrello */}

        <Cart
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          language={language}
          products={statusReady ? cartProducts : []}
          onRemove={handleRemoveFromCart}
        />

        {/* Gestione prenotazioni */}

        <ReservationModal
          isOpen={reservationModalOpen}
          onClose={() => setReservationModalOpen(false)}
          language={language}
          activeReservation={activeReservation}
          activeCode={activeCode}
          localReservations={activeLocalReservations}
          onLookupCode={handleLookupCode}
          onSelectLocalReservation={
            handleSelectLocalReservation
          }
          onDeclarePurchased={handleDeclarePurchased}
          onCancelReservation={handleCancelReservation}
          busy={reservationBusy}
          errorMsg={reservationError}
          infoMsg={reservationInfo}
          t={t}
        />

        {/* Area amministrativa Sarah */}

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
