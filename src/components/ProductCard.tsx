
import {
  ArrowUpRight,
  Clock,
  Gift,
  ShoppingCart,
  Check,
} from 'lucide-react';

import type { WishlistProductRecord } from '../firebase/wishlistService';
import type { Language, Translations } from '../i18n/translations';
import { ProductVisual } from './ProductVisual';

interface ProductCardProps {
  product: WishlistProductRecord;
  language: Language;
  isFavorite: boolean;
  isReserving: boolean;
  isInCart?: boolean;
  isPending?: boolean;
  onToggleFavorite: (id: string) => void;
  onReserve: (product: WishlistProductRecord) => void;
  onAddToCart?: (product: WishlistProductRecord) => void;
  t: Translations;
}

const cartTranslations = {
  it: {
    add: 'Aggiungi al carrello',
    added: 'Nel carrello',
    pending: 'Pagamento in attesa',
    test: 'Prezzo TEST: 1,00 € · Nessun addebito reale',
    external: 'Visita il negozio',
  },
  en: {
    add: 'Add to cart',
    added: 'In your cart',
    pending: 'Payment pending',
    test: 'TEST price: €1.00 · No real charge',
    external: 'Visit the store',
  },
  ro: {
    add: 'Adaugă în coș',
    added: 'În coș',
    pending: 'Plată în așteptare',
    test: 'Preț TEST: 1,00 € · Fără plată reală',
    external: 'Vizitează magazinul',
  },
};

export function ProductCard({
  product,
  language,
  isFavorite,
  isReserving,
  isInCart = false,
  isPending = false,
  onToggleFavorite,
  onReserve,
  onAddToCart,
  t,
}: ProductCardProps) {
  const categoryLabel = t.categories[product.category];
  const storeLabel = product.store ?? t.card.storePending;
  const cartText = cartTranslations[language] || cartTranslations.it;

  const throneUrl = product.url && /^https:\/\/throne\.com\/[a-zA-Z0-9_-]+\/item\/[0-9a-f-]{36}$/i.test(product.url) ? product.url : null;
  const throneNote = language === 'ro' ? 'Prețul final este afișat pe Throne.' : language === 'en' ? 'Final price shown on Throne.' : 'Prezzo finale indicato su Throne.';

  return (
    <article className="group relative flex flex-col rounded-2xl bg-white border border-rose-200/75 overflow-hidden shadow-xs shadow-rose-900/5 hover:-translate-y-0.5 hover:shadow-md hover:shadow-rose-900/8 transition-all duration-200">

      <button
        type="button"
        onClick={() => onToggleFavorite(product.id)}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite
            ? `${t.card.removeFavorite}: ${product.name}`
            : `${t.card.addFavorite}: ${product.name}`
        }
        className={`absolute top-3 right-3 z-10 w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2 ${
          isFavorite
            ? 'bg-[#C92A6D] border-[#C92A6D] text-white shadow-sm'
            : 'bg-white/92 border-rose-200 text-[#C92A6D] hover:bg-[#FDF2F6] hover:border-[#C92A6D]/50'
        }`}
      >
        <span className="text-lg leading-none" aria-hidden="true">
          {isFavorite ? '♥' : '♡'}
        </span>
      </button>

      <ProductVisual
        product={product}
        categoryLabel={categoryLabel}
        imagePendingNote={t.card.imagePendingNote}
      />

      <div className="flex-1 flex flex-col p-5">

        <div className="flex items-center gap-1.5 text-xs font-medium text-[#7A5A69] truncate">
          <span className="truncate">{categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{storeLabel}</span>
          <span aria-hidden="true">·</span>

          <span className="text-[#A81E58] font-medium shrink-0">
            {isPending
              ? cartText.pending
              : t.statuses.available}
          </span>
        </div>

        <h3 className="mt-1.5 text-base font-semibold text-[#2D1B24] leading-snug [text-wrap:balance]">
          {product.name}
        </h3>

        <p className="mt-2 text-sm text-[#6B4E5C] leading-relaxed flex-1">
          {product.description[language]}
        </p>

        <div className="mt-5 pt-4 border-t border-rose-100 space-y-2.5">

          {throneUrl ? (
            <>
              <button type="button" disabled={isInCart || isPending || isReserving || !onAddToCart} onClick={() => onAddToCart?.(product)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white min-h-11 disabled:opacity-60">
                {isInCart ? <Check className="w-5 h-5" aria-hidden="true" /> : <ShoppingCart className="w-5 h-5" aria-hidden="true" />}
                {isPending ? cartText.pending : isInCart ? cartText.added : cartText.add}
              </button>
              <p className="text-xs text-center text-[#7A5A69]">{throneNote}</p>
            </>
          ) : (<>
          {/* Pulsante carrello */}

          <button
            type="button"
            disabled={
              isInCart ||
              isPending ||
              isReserving ||
              !onAddToCart
            }
            onClick={() => onAddToCart?.(product)}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl min-h-11 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2 ${
              isPending
                ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                : isInCart
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                : 'bg-gradient-to-r from-[#C92A6D] to-[#E84D91] text-white hover:shadow-lg hover:shadow-pink-200 cursor-pointer disabled:opacity-60'
            }`}
          >
            {isPending ? (
              <Clock className="w-5 h-5 shrink-0" aria-hidden="true" />
            ) : isInCart ? (
              <Check className="w-5 h-5 shrink-0" aria-hidden="true" />
            ) : (
              <ShoppingCart className="w-5 h-5 shrink-0" aria-hidden="true" />
            )}

            <span>
              {isPending
                ? cartText.pending
                : isInCart
                ? cartText.added
                : cartText.add}
            </span>
          </button>

          <p className="text-xs text-center text-[#7A5A69]">
            {cartText.test}
          </p>

          {/* Pulsante prenotazione */}

          <button
            type="button"
            disabled={isReserving || isPending || isInCart}
            onClick={() => onReserve(product)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#FDF2F6] text-[#C92A6D] border border-rose-200 hover:bg-rose-100 disabled:opacity-60 transition-colors duration-150 min-h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
          >
            <Gift className="w-4 h-4 shrink-0" aria-hidden="true" />

            <span>
              {isReserving
                ? t.card.reservingButton
                : t.card.reserveButton}
            </span>
          </button>

          {/* Collegamento al negozio */}

          {product.url ? (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t.card.buyAriaPrefix} ${product.name}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-[#7A5A69] border border-rose-200 hover:border-[#C92A6D]/50 hover:text-[#C92A6D] transition-colors duration-150 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
            >
              <span>{cartText.external}</span>

              <ArrowUpRight
                className="w-4 h-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          ) : (
            <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#FAF4F7] text-[#7A5A69] border border-rose-200/70 min-h-11">
              <Clock
                className="w-4 h-4 shrink-0 text-[#9E5B78]"
                aria-hidden="true"
              />

              <span>{t.card.linkUpdating}</span>
            </div>
          )}
          </>)}
        </div>
      </div>
    </article>
  );
}
