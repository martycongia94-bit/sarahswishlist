
import { useEffect, useState } from 'react';
import { Package, RefreshCw, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase/client';

interface OrderProduct {
  id: string;
  name: string;
  status: string;
}

interface StripeOrder {
  id: string;
  sessionId: string | null;
  status: string;
  products: OrderProduct[];
  amount: number;
  currency: string;
  sender: string | null;
  createdAt: string | null;
  test: boolean;
  stripeDetailsAvailable: boolean;
}

interface OrdersResponse {
  orders: StripeOrder[];
  summary: {
    totalOrders: number;
    paidOrders: number;
    paidProducts: number;
    totalPaid: number;
  };
}

const money = (amount: number, currency = 'eur') =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

const statusLabel = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Pagato';
    case 'pending':
      return 'In attesa';
    case 'expired':
      return 'Scaduto';
    case 'cancelled':
      return 'Annullato';
    case 'released':
      return 'Sbloccato';
    default:
      return status;
  }
};

export function StripeOrders() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  const [checkingFirebase, setCheckingFirebase] = useState(false);
  const [firebaseResult, setFirebaseResult] = useState('');

  const [migrationResult, setMigrationResult] = useState('');
  const [checkingMigration, setCheckingMigration] = useState(false);

  async function migrateLocks() {
    if (!window.confirm('Migrare i blocchi degli acquisti simulati? Le nuove regole Firebase devono essere già pubblicate.')) return;
    setCheckingMigration(true);
    setMigrationResult('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Accesso richiesto');
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/migrate-locks', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      const result = await response.json();
      if (!response.ok || !Number.isInteger(result.migrated)) throw new Error('Migrazione non completata (HTTP ' + response.status + ')');
      setMigrationResult('Blocchi migrati: ' + result.migrated);
    } catch (error) {
      setMigrationResult((error instanceof Error ? error.message : 'Errore') + '. Mantieni la manutenzione attiva.');
    } finally {
      setCheckingMigration(false);
    }
  }

  async function checkPreflight() {
    setCheckingMigration(true);
    setMigrationResult('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Accesso richiesto');
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/migration-preflight', {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.products)) throw new Error('Verifica fallita');
      setMigrationResult((result.ready ? 'Migrazione compatibile' : 'Conflitti rilevati') +
        ' · ' + result.products.map((p: {id: string; available: boolean}) => p.id + ': ' + (p.available ? 'OK' : 'NON DISPONIBILE')).join(' · '));
    } catch {
      setMigrationResult('Impossibile verificare la compatibilità.');
    } finally {
      setCheckingMigration(false);
    }
  }

  async function checkMigration() {
    setCheckingMigration(true);
    setMigrationResult('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Accesso richiesto');
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/migration-readiness', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok || typeof result.paused !== 'boolean' ||
          !Number.isInteger(result.paid) || !Number.isInteger(result.pending)) {
        throw new Error('Verifica fallita');
      }
      setMigrationResult('Manutenzione: ' + (result.paused ? 'attiva' : 'disattivata') +
        ' · Regali pagati: ' + result.paid + ' · Pendenti: ' + result.pending);
    } catch {
      setMigrationResult('Impossibile verificare la manutenzione.');
    } finally {
      setCheckingMigration(false);
    }
  }

  async function checkFirebase() {
    setCheckingFirebase(true);
    setFirebaseResult('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Accesso richiesto.');
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/firebase-worker-check', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json();
      if (response.ok && result.authenticated === true) {
        setFirebaseResult('Firebase Worker: autenticazione riuscita.');
      } else {
        setFirebaseResult('Firebase Worker: verifica fallita (HTTP ' + response.status + ').');
      }
    } catch {
      setFirebaseResult('Firebase Worker: impossibile completare la verifica.');
    } finally {
      setCheckingFirebase(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError('');
      setData(null);

      try {
        const user = auth.currentUser;

        if (!user) {
          throw new Error('Accesso richiesto.');
        }

        const token = await user.getIdToken();

        const response = await fetch('/api/admin/orders', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error('Non sei autorizzato a visualizzare gli ordini.');
        }

        if (!response.ok) {
          throw new Error('Impossibile caricare gli ordini.');
        }

        const result = await response.json();

        if (!Array.isArray(result.orders) || !result.summary) {
          throw new Error('Risposta del server non valida.');
        }

        if (active) {
          setData(result);
        }
      } catch (err) {
        if (active && !controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : 'Errore imprevisto.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOrders();

    return () => {
      active = false;
      controller.abort();
    };
  }, [refresh]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#2D1B24]">
            Ordini Stripe
          </h2>
          <p className="mt-1 text-sm text-[#6B4E5C]">
            Gestione dei pagamenti di Sarah's Wishlist
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C92A6D] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Aggiorna
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-[#FDF2F6] p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-[#C92A6D]" />
        <div>
          <p className="font-semibold text-[#C92A6D]">
            Modalità Sandbox
          </p>
          <p className="mt-1 text-sm text-[#6B4E5C]">
            I pagamenti sono simulati. Nessun denaro reale viene incassato
            e nessun prodotto viene spedito automaticamente.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-white p-4">
        <button type="button" disabled={checkingFirebase} onClick={() => void checkFirebase()}
          className="rounded-xl bg-[#C92A6D] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {checkingFirebase ? 'Verifica in corso...' : 'Verifica collegamento Firebase'}
        </button>
        <button type="button" disabled={checkingMigration} onClick={() => void checkMigration()}
          className="ml-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-[#C92A6D] disabled:opacity-50">
          {checkingMigration ? 'Verifica in corso...' : 'Verifica manutenzione'}
        </button>
        <button type="button" disabled={checkingMigration} onClick={() => void checkPreflight()}
          className="ml-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-[#C92A6D] disabled:opacity-50">
          Verifica compatibilità migrazione
        </button>
        <button type="button" disabled={checkingMigration} onClick={() => void migrateLocks()}
          className="ml-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-[#C92A6D] disabled:opacity-50">
          Migra acquisti su Firebase
        </button>
        {migrationResult && <p role="status" className="mt-3 text-sm text-[#6B4E5C]">{migrationResult}</p>}
        {firebaseResult && <p role="status" className="mt-3 text-sm text-[#6B4E5C]">{firebaseResult}</p>}
      </div>

      {loading && (
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center text-sm">
          Caricamento sicuro degli ordini...
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: 'Ordini totali',
                value: data.summary.totalOrders,
              },
              {
                label: 'Ordini pagati',
                value: data.summary.paidOrders,
              },
              {
                label: 'Regali acquistati',
                value: data.summary.paidProducts,
              },
              {
                label: 'Incasso simulato',
                value: money(data.summary.totalPaid),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-medium text-[#6B4E5C]">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#C92A6D]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {data.orders.length === 0 ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-[#C92A6D]" />
              <p className="mt-3 text-sm text-[#6B4E5C]">
                Nessun ordine presente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.orders.map((order) => (
                <article
                  key={order.id}
                  className="space-y-4 rounded-2xl border border-rose-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8C6878]">
                        Ordine
                      </p>
                      <p className="break-all text-xs text-[#6B4E5C]">
                        {order.id}
                      </p>
                      <p className="mt-2 text-sm text-[#6B4E5C]">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString('it-IT')
                          : 'Data non disponibile'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {statusLabel(order.status)}
                      </span>
                      <p className="mt-2 text-xl font-bold text-[#C92A6D]">
                        {money(order.amount, order.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#FDF2F6] p-3">
                    <p className="text-xs font-semibold text-[#8C6878]">
                      Regalato da
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#2D1B24]">
                      {order.sender || 'Nome non disponibile'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {order.products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 shrink-0 text-[#C92A6D]" />
                          <p className="text-sm font-medium text-[#2D1B24]">
                            {product.name}
                          </p>
                        </div>
                        <span className="text-xs text-[#6B4E5C]">
                          {statusLabel(product.status)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-[#C92A6D]">
                      {order.test ? 'Ordine di prova' : 'Ordine reale'}
                    </span>
                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                      Spedizione non gestita
                    </span>
                  </div>

                  {!order.stripeDetailsAvailable && (
                    <p className="text-xs text-[#8C6878]">
                      Dettagli aggiuntivi Stripe non disponibili.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default StripeOrders;

