import { useState } from 'react';
import { ArrowUpRight, Clock, Gift, CreditCard } from 'lucide-react';
import type { WishlistProductRecord } from '../firebase/wishlistService';
import type { Language, Translations } from '../i18n/translations';
import { ProductVisual } from './ProductVisual';

interface ProductCardProps {
  product: WishlistProductRecord;
  language: Language;
  isFavorite: boolean;
  isReserving: boolean;
  onToggleFavorite: (id: string) => void;
  onReserve: (product: WishlistProductRecord) => void;
  t: Translations;
}

export function ProductCard({
  product,
  language,
  isFavorite,
  isReserving,
  onToggleFavorite,
  onReserve,
  t,
}: ProductCardProps) {
  const categoryLabel = t.categories[product.category];
  const storeLabel = product.store ?? t.card.storePending;

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  async function handleTestCheckout() {
    if (isCheckingOut) return;

    setIsCheckingOut(true);
    setCheckoutError('');

    try {
      const response = await fetch('/api/test/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : 'Pagamento temporaneamente non disponibile'
        );
      }

      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Errore durante il pagamento'
      );
      setIsCheckingOut(false);
    }
  }

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
            {t.statuses.available}
          </span>
        </div>

        <h3 className="mt-1.5 text-base font-semibold text-[#2D1B24] leading-snug [text-wrap:balance]">
          {product.name}
        </h3>

        <p className="mt-2 text-sm text-[#6B4E5C] leading-relaxed flex-1">
          {product.description[language]}
        </p>

        <div className="mt-5 pt-4 border-t border-rose-100 space-y-2.5">

          <button
            type="button"
            disabled={isReserving || isCheckingOut}
            onClick={() => onReserve(product)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] disabled:opacity-60 transition-colors duration-150 whitespace-nowrap min-h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
          >
            <Gift className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isReserving ? t.card.reservingButton : t.card.reserveButton}
            </span>
          </button>

          <button
            type="button"
            disabled={isCheckingOut || isReserving}
            onClick={handleTestCheckout}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-[#635BFF] text-white hover:bg-[#5149DD] disabled:opacity-60 transition-colors duration-150 min-h-11 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isCheckingOut
                ? 'Apertura Stripe...'
                : 'Pagamento TEST · 1 € (simulato)'}
            </span>
          </button>

          <p className="text-xs text-center text-[#7A5A69]">
            Modalità test · Nessun addebito reale
          </p>

          {checkoutError && (
            <p
              role="alert"
              className="text-xs text-red-600 text-center"
            >
              {checkoutError}
            </p>
          )}

          {product.url ? (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t.card.buyAriaPrefix} ${product.name}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#FDF2F6] text-[#2D1B24] border border-rose-200 hover:border-[#C92A6D]/50 hover:text-[#C92A6D] transition-colors duration-150 whitespace-nowrap min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
            >
              <span>Continua al pagamento sul negozio ↗</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#FAF4F7] text-[#7A5A69] border border-rose-200/70 min-h-11">
              <Clock className="w-4 h-4 shrink-0 text-[#9E5B78]" aria-hidden="true" />
              <span>{t.card.linkUpdating}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
