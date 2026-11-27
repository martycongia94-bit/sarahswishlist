
import { useState } from 'react';
import { ShoppingBag, X, Trash2, Gift, LockKeyhole } from 'lucide-react';

type CartProduct = {
  id: string | number;
  name: string;
  url?: string | null;
};

type CartProps = {
  isOpen: boolean;
  onClose: () => void;
  language: 'it' | 'en' | 'ro';
  products: CartProduct[];
  onRemove: (id: string) => void;
};

const translations = {
  it: {
    title: 'Il tuo carrello',
    empty: 'Il tuo carrello è ancora vuoto',
    subtitle: 'Regala un sorriso a Sarah ♡',
    sender: 'Da parte di (facoltativo)',
    placeholder: 'Il tuo nome',
    total: 'Totale',
    checkout: 'Procedi al pagamento',
    loading: 'Caricamento...',
    secure: 'Pagamento sicuro tramite Stripe',
    test: 'Modalità TEST – Nessun pagamento reale',
    error: 'Pagamento non avviato o non confermato. Verifica la disponibilità prima di riprovare.',
    close: 'Continua a esplorare',
    remove: 'Rimuovi',
  },
  en: {
    title: 'Your cart',
    empty: 'Your cart is empty',
    subtitle: 'Make Sarah smile ♡',
    sender: 'Gift from (optional)',
    placeholder: 'Your name',
    total: 'Total',
    checkout: 'Proceed to checkout',
    loading: 'Loading...',
    secure: 'Secure payment via Stripe',
    test: 'TEST mode – No real payment',
    error: 'Checkout not started or not confirmed. Check availability before retrying.',
    close: 'Continue exploring',
    remove: 'Remove',
  },
  ro: {
    title: 'Coșul tău',
    empty: 'Coșul tău este gol',
    subtitle: 'Adu-i un zâmbet lui Sarah ♡',
    sender: 'Cadou de la (opțional)',
    placeholder: 'Numele tău',
    total: 'Total',
    checkout: 'Continuă la plată',
    loading: 'Se încarcă...',
    secure: 'Plată securizată prin Stripe',
    test: 'Mod TEST – Fără plată reală',
    error: 'Plata nu a fost inițiată sau confirmată. Verifică disponibilitatea înainte de a reîncerca.',
    close: 'Continuă explorarea',
    remove: 'Elimină',
  },
};

export default function Cart({
  isOpen,
  onClose,
  language,
  products,
  onRemove,
}: CartProps) {
  const [sender, setSender] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const t = translations[language] || translations.it;

  const throneLink = (p: CartProduct) => p.url && /^https:\/\/throne\.com\/[a-zA-Z0-9_-]+\/item\/[0-9a-f-]{36}$/i.test(p.url) ? p.url : null;
  const throneProducts = products.filter(p => throneLink(p));
  const testProducts = products.filter(p => !throneLink(p));
  const externalText = language === 'ro' ? 'Continuă pe Throne' : language === 'en' ? 'Proceed to Throne' : 'Procedi al pagamento su Throne';
  const externalNote = language === 'ro' ? 'Cadourile Throne se cumpără separat. Prețul final este afișat pe Throne.' : language === 'en' ? 'Throne gifts are purchased individually. Final prices are shown on Throne.' : 'I regali Throne si acquistano singolarmente. Il prezzo finale è indicato su Throne.';
  const total = new Intl.NumberFormat(
    language === 'ro' ? 'ro-RO' :
    language === 'en' ? 'en-GB' : 'it-IT',
    {
      style: 'currency',
      currency: 'EUR',
    }
  ).format(testProducts.length);

  async function checkout() {
    if (busy || testProducts.length === 0) return;

    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/test/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: testProducts.map(p => String(p.id)),
          sender: sender.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || typeof data.url !== 'string') {
        throw new Error('Checkout failed');
      }

      const url = new URL(data.url);

      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'checkout.stripe.com'
      ) {
        throw new Error('Invalid checkout URL');
      }

      window.location.assign(url.href);
    } catch {
      setError(t.error);
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="relative flex h-full h-[100dvh] w-full max-w-md flex-col bg-[#170b15] text-[#fff0fa] border-l border-[#a33770] shadow-[-8px_0_40px_#ff258b33]"
      >
        <header className="flex items-center justify-between border-b border-[#81335c] bg-[#291025] p-5">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-pink-500" size={26} />

            <div>
              <h2 className="text-xl font-bold text-[#fff0fa]">
                {t.title} ({products.length})
              </h2>

              <p className="text-sm text-pink-500">
                {t.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t.close}
            className="rounded-full bg-[#42152f] p-2 text-[#ffd1e9]"
          >
            <X size={22} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Gift size={64} className="mb-5 text-pink-300" />

              <h3 className="font-semibold text-[#f8d5e8]">
                {t.empty}
              </h3>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-full bg-pink-500 px-6 py-3 font-semibold text-white"
              >
                {t.close}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(product => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#81335c] bg-[#291025] p-4"
                >
                  <div className="rounded-xl bg-[#511c3e] p-3">
                    <Gift size={24} className="text-pink-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#fff0fa]">
                      {product.name}
                    </p>

                    <p className="text-sm font-bold text-[#ff9bce]">
                      {throneLink(product) ? 'Throne' : '1,00 € (TEST)'}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRemove(String(product.id))}
                    aria-label={t.remove}
                    className="rounded-full p-2 text-[#e6a9ca] hover:bg-[#511c3e] hover:text-red-300"
                  >
                    <Trash2 size={19} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {products.length > 0 && (
          <footer className="space-y-4 border-t max-h-[55dvh] overflow-y-auto border-[#81335c] bg-[#210d1e] p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
            {throneProducts.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-[#f3c9df]">{externalNote}</p>
                {throneProducts.map(p => (
                  <a key={p.id} href={throneLink(p)!} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center rounded-2xl bg-gradient-to-r from-[#c21870] to-[#db2777] shadow-[0_0_16px_#ff258b55] px-4 py-3 text-center font-bold text-white">
                    <span>{externalText}</span><span className="text-xs font-normal">{p.name}</span>
                  </a>
                ))}
              </div>
            )}
            {testProducts.length > 0 && (<>
            <div>
              <label
                htmlFor="cart-sender"
                className="mb-2 block text-sm font-medium text-[#f8d5e8]"
              >
                {t.sender}
              </label>

              <input
                id="cart-sender"
                type="text"
                value={sender}
                disabled={busy}
                maxLength={80}
                onChange={e => setSender(e.target.value)}
                placeholder={t.placeholder}
                className="w-full rounded-xl border border-[#a33770] bg-[#170b15] text-white px-4 py-3 outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#f8d5e8]">
                {t.total}
              </span>

              <span className="text-2xl font-bold text-[#ff9bce]">
                {total}
              </span>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={checkout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-4 font-bold text-white shadow-lg disabled:opacity-50"
            >
              <LockKeyhole size={19} />
              {busy ? t.loading : t.checkout}
            </button>

            <p className="text-center text-xs text-[#e6a9ca]">
              {t.secure}
            </p>

            <p className="rounded-lg bg-amber-50 p-2 text-center text-xs font-medium text-amber-700">
              {t.test}
            </p>
            </>)}
          </footer>
        )}
      </section>
    </div>
  );
}

