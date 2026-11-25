import { useEffect, useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth';
import {
  Check,
  Clock,
  Database,
  ExternalLink,
  Gift,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { PRODUCTS, type ProductCategory } from '../data/products';
import {
  auth,
  FIREBASE_PROJECT_ID,
  googleProvider,
} from '../firebase/client';
import {
  adminTransitionProductStatus,
  DEFAULT_PRIVATE_DELIVERY,
  deleteProductFromFirestore,
  fetchAdminReservationDetails,
  getEffectiveProductStatus,
  getPrivateDeliveryInfo,
  getSarahInviteEmail,
  savePrivateDeliveryInfo,
  saveProductToFirestore,
  savePublicSettings,
  saveSarahInviteEmail,
  seedOrSyncCatalogToFirestore,
  verifyAndClaimAdmin,
  type GiftReservationRecord,
  type GiftStatus,
  type PrivateDeliveryInfo,
  type PublicWishlistSettings,
  type WishlistProductRecord,
} from '../firebase/wishlistService';
import type { Translations } from '../i18n/translations';
import { StripeOrders } from './StripeOrders';

interface SarahAdminAreaProps {
  isOpen: boolean;
  onClose: () => void;
  products: WishlistProductRecord[];
  isFromFirestore: boolean;
  publicSettings: PublicWishlistSettings;
  t: Translations;
}

type AdminTab =
  | 'products'
  | 'reservations'
  | 'addresses'
  | 'publicNotes'
  | 'security'
  | 'stripeOrders';

const EMPTY_PRODUCT: WishlistProductRecord = {
  id: '',
  name: '',
  brand: '',
  category: 'accessories',
  store: null,
  url: null,
  image: null,
  description: { it: '', en: '', ro: '' },
  status: 'available',
  reservedUntilMs: null,
  received: false,
  sortOrder: 99,
};

export function SarahAdminArea({
  isOpen,
  onClose,
  products,
  isFromFirestore,
  publicSettings,
  t,
}: SarahAdminAreaProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Dashboard tabs
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [adminSearch, setAdminSearch] = useState('');

  // Product editor state
  const [editingProduct, setEditingProduct] =
    useState<WishlistProductRecord | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [productStatus, setProductStatus] = useState('');
  const [productError, setProductError] = useState('');
  const [productBusy, setProductBusy] = useState(false);

  // Private delivery state
  const [privateInfo, setPrivateInfo] = useState<PrivateDeliveryInfo>(
    DEFAULT_PRIVATE_DELIVERY
  );
  const [privateLoaded, setPrivateLoaded] = useState(false);
  const [privateSavedMsg, setPrivateSavedMsg] = useState('');
  const [privateBusy, setPrivateBusy] = useState(false);

  // Public settings draft state
  const [publicDraft, setPublicDraft] =
    useState<PublicWishlistSettings>(publicSettings);
  const [publicSavedMsg, setPublicSavedMsg] = useState('');
  const [publicBusy, setPublicBusy] = useState(false);

  // Security / password / invite state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  // Reservations & purchase declarations details
  const [reservationDetails, setReservationDetails] = useState<
    Record<string, GiftReservationRecord>
  >({});
  const [reservationsBusy, setReservationsBusy] = useState(false);

  useEffect(() => {
    setPublicDraft(publicSettings);
  }, [publicSettings]);

  useEffect(() => {
    if (!isAdmin || !isFromFirestore) return;
    let cancelled = false;
    fetchAdminReservationDetails(products)
      .then((details) => {
        if (!cancelled) setReservationDetails(details);
      })
      .catch(() => {
        // Ignore transient detail load failure
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, isFromFirestore, products]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      setAuthError('');
      setAuthInfo('');

      if (!nextUser) {
        setIsAdmin(false);
        setPrivateLoaded(false);
        return;
      }

      if (!nextUser.emailVerified) {
        setIsAdmin(false);
        return;
      }

      setCheckingAdmin(true);
      try {
        const ok = await verifyAndClaimAdmin(nextUser);
        setIsAdmin(ok);
        if (ok) {
          const [priv, invited] = await Promise.all([
            getPrivateDeliveryInfo(),
            getSarahInviteEmail(),
          ]);
          setPrivateInfo(priv);
          setPrivateLoaded(true);
          setInviteEmail(invited);
        }
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : String(err));
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const formatAuthError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth/operation-not-allowed')) {
      return `${t.admin.providerNotice} (Project: ${FIREBASE_PROJECT_ID})`;
    }
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
      return 'Email o password non validi.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'Esiste già un account con questa email. Usa Accedi.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'La password deve contenere almeno 6–8 caratteri.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Finestra di accesso chiusa prima del completamento.';
    }
    return msg;
  };

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setAuthError('');
    setAuthInfo('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    setAuthInfo('');
    try {
      if (isRegisterMode) {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await sendEmailVerification(cred.user);
        setAuthInfo(t.admin.verificationSent);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setAuthError('Inserisci prima la tua email.');
      return;
    }
    setAuthBusy(true);
    setAuthError('');
    setAuthInfo('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setAuthInfo(t.admin.resetSent);
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      await sendEmailVerification(user);
      setAuthInfo(t.admin.verificationSent);
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!user) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      await reload(user);
      const refreshed = auth.currentUser;
      setUser(refreshed);
      if (refreshed?.emailVerified) {
        const ok = await verifyAndClaimAdmin(refreshed);
        setIsAdmin(ok);
        if (ok) {
          const [priv, invited] = await Promise.all([
            getPrivateDeliveryInfo(),
            getSarahInviteEmail(),
          ]);
          setPrivateInfo(priv);
          setPrivateLoaded(true);
          setInviteEmail(invited);
        }
      }
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setPrivateInfo(DEFAULT_PRIVATE_DELIVERY);
    setPrivateLoaded(false);
    setEditingProduct(null);
  };

  const ensureSeededBeforeMutation = async () => {
    if (!isFromFirestore) {
      await seedOrSyncCatalogToFirestore();
    }
  };

  const handleSeedCatalog = async () => {
    setProductBusy(true);
    setProductError('');
    setProductStatus('');
    try {
      const { created, updated } = await seedOrSyncCatalogToFirestore();
      const total = created + updated;
      setProductStatus(
        total > 0
          ? `${t.admin.productsPanel.syncedSuccess} (${total})`
          : t.admin.productsPanel.syncedSuccess
      );
    } catch (err) {
      setProductError(err instanceof Error ? err.message : String(err));
    } finally {
      setProductBusy(false);
    }
  };

  const handleOpenNewProduct = () => {
    const nextOrder =
      products.reduce((max, p) => Math.max(max, p.sortOrder), 0) + 1;
    const newId = `wish_${Date.now()}`;
    setIsNewProduct(true);
    setEditingProduct({
      ...EMPTY_PRODUCT,
      id: newId,
      sortOrder: nextOrder,
    });
    setProductError('');
    setProductStatus('');
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProductBusy(true);
    setProductError('');
    setProductStatus('');
    try {
      await ensureSeededBeforeMutation();
      await saveProductToFirestore(editingProduct, isNewProduct);
      setEditingProduct(null);
      setProductStatus(t.admin.productsPanel.savedMessage);
    } catch (err) {
      setProductError(err instanceof Error ? err.message : String(err));
    } finally {
      setProductBusy(false);
    }
  };

  const handleToggleReceived = async (product: WishlistProductRecord) => {
    setProductBusy(true);
    setProductError('');
    try {
      await ensureSeededBeforeMutation();
      await adminTransitionProductStatus(
        product.id,
        product.received ? 'restore' : 'mark_received'
      );
    } catch (err) {
      setProductError(err instanceof Error ? err.message : String(err));
    } finally {
      setProductBusy(false);
    }
  };

  const handleReservationAction = async (
    productId: string,
    action: 'confirm_purchase' | 'reject_declaration' | 'restore' | 'mark_received'
  ) => {
    setReservationsBusy(true);
    setProductError('');
    try {
      await ensureSeededBeforeMutation();
      await adminTransitionProductStatus(productId, action);
    } catch (err) {
      setProductError(err instanceof Error ? err.message : String(err));
    } finally {
      setReservationsBusy(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProductBusy(true);
    setProductError('');
    try {
      await ensureSeededBeforeMutation();
      await deleteProductFromFirestore(productId);
      setDeleteTargetId(null);
    } catch (err) {
      setProductError(err instanceof Error ? err.message : String(err));
    } finally {
      setProductBusy(false);
    }
  };

  const handleSavePrivateDelivery = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPrivateBusy(true);
    setPrivateSavedMsg('');
    try {
      await savePrivateDeliveryInfo(privateInfo, user.uid);
      setPrivateSavedMsg(t.admin.addressesPanel.savedMessage);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : String(err));
    } finally {
      setPrivateBusy(false);
    }
  };

  const handleSavePublicSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPublicBusy(true);
    setPublicSavedMsg('');
    try {
      await savePublicSettings(publicDraft, user.uid);
      setPublicSavedMsg(t.admin.publicPanel.savedMessage);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : String(err));
    } finally {
      setPublicBusy(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    setPwError('');
    setPwMsg('');
    if (newPw.length < 8) {
      setPwError(t.admin.securityPanel.passwordTooShort);
      return;
    }
    if (newPw !== confirmPw) {
      setPwError(t.admin.securityPanel.passwordMismatch);
      return;
    }
    setPwBusy(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setPwMsg(t.admin.securityPanel.passwordUpdated);
    } catch (err) {
      setPwError(formatAuthError(err));
    } finally {
      setPwBusy(false);
    }
  };

  const handleSaveInviteEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setInviteMsg('');
    setPwError('');
    try {
      await saveSarahInviteEmail(inviteEmail, user.uid);
      setInviteMsg(t.admin.securityPanel.inviteSaved);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : String(err));
    }
  };

  const hasPasswordProvider =
    user?.providerData.some((p) => p.providerId === 'password') ?? false;

  const needsCatalogSync =
    !isFromFirestore ||
    PRODUCTS.some((staticItem) => {
      const existing = products.find((p) => p.id === staticItem.id);
      return (
        !existing ||
        (Boolean(staticItem.url) && !existing.url) ||
        (Boolean(staticItem.image) && !existing.image)
      );
    });

  const trackedReservationProducts = products
    .filter((item) => item.status !== 'available')
    .sort((a, b) => {
      const rank: Record<GiftStatus, number> = {
        purchase_declared: 0,
        reserved: 1,
        confirmed: 2,
        received: 3,
        available: 4,
      };
      return rank[a.status] - rank[b.status];
    });

  const pendingAttentionCount = products.filter(
    (item) =>
      item.status === 'purchase_declared' ||
      getEffectiveProductStatus(item) === 'reserved'
  ).length;

  const filteredAdminProducts = products.filter((item) => {
    const q = adminSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      (item.store ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#FFFBFD]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sarah-admin-title"
    >
      {/* Top Admin Header */}
      <header className="sticky top-0 z-20 h-16 bg-[#FFFBFD]/95 backdrop-blur-md border-b border-rose-200/70">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lock className="w-4 h-4 text-[#C92A6D] shrink-0" aria-hidden="true" />
            <h1
              id="sarah-admin-title"
              className="font-display text-lg sm:text-xl font-semibold text-[#2D1B24] truncate"
            >
              {t.admin.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-white text-[#6B4E5C] border border-rose-200 hover:text-[#C92A6D] transition-colors cursor-pointer min-h-10"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.admin.signOut}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] transition-colors cursor-pointer min-h-10"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span>{t.admin.close}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {authLoading || checkingAdmin ? (
          <div className="max-w-md mx-auto rounded-2xl bg-white border border-rose-200 p-8 text-center">
            <p className="text-sm text-[#6B4E5C]">Verifica sessione sicura...</p>
          </div>
        ) : !user ? (
          /* LOGIN VIEW */
          <div className="max-w-md mx-auto rounded-2xl bg-white border border-rose-200/80 p-6 sm:p-8 shadow-sm shadow-rose-900/5">
            <h2 className="font-display text-2xl font-semibold text-[#2D1B24]">
              {t.admin.loginTitle}
            </h2>
            <p className="mt-2 text-sm text-[#6B4E5C] leading-relaxed">
              {t.admin.loginSubtitle}
            </p>

            {authError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs sm:text-sm text-[#9B1C4E]">
                {authError}
              </div>
            )}
            {authInfo && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#FDF2F6] border border-rose-200 text-xs sm:text-sm text-[#2D1B24]">
                {authInfo}
              </div>
            )}

            <button
              type="button"
              disabled={authBusy}
              onClick={handleGoogleSignIn}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] disabled:opacity-60 transition-colors cursor-pointer min-h-11"
            >
              <span>{t.admin.googleLogin}</span>
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-[#8C6878]">
              <div className="flex-1 h-px bg-rose-200/70" />
              <span>o</span>
              <div className="flex-1 h-px bg-rose-200/70" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-[#5E4451] mb-1.5"
                >
                  {t.admin.emailLabel}
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FFFBFD] border border-rose-200 text-sm text-[#2D1B24] focus:outline-none focus:border-[#C92A6D] focus:ring-2 focus:ring-[#C92A6D]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-[#5E4451] mb-1.5"
                >
                  {t.admin.passwordLabel}
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FFFBFD] border border-rose-200 text-sm text-[#2D1B24] focus:outline-none focus:border-[#C92A6D] focus:ring-2 focus:ring-[#C92A6D]/20"
                />
              </div>

              <button
                type="submit"
                disabled={authBusy}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#FDF2F6] text-[#C92A6D] border border-rose-200 hover:bg-[#FAE8EF] disabled:opacity-60 transition-colors cursor-pointer min-h-11"
              >
                {isRegisterMode ? t.admin.registerInvite : t.admin.signInEmail}
              </button>
            </form>

            <div className="mt-4 flex flex-col gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode((prev) => !prev);
                  setAuthError('');
                }}
                className="text-left text-[#7A5A69] hover:text-[#C92A6D] underline underline-offset-4 cursor-pointer"
              >
                {isRegisterMode ? t.admin.signInEmail : t.admin.registerInvite}
              </button>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-left text-[#7A5A69] hover:text-[#C92A6D] underline underline-offset-4 cursor-pointer"
              >
                {t.admin.forgotPassword}
              </button>
            </div>
          </div>
        ) : !user.emailVerified ? (
          /* EMAIL VERIFICATION GATE */
          <div className="max-w-md mx-auto rounded-2xl bg-white border border-rose-200 p-6 sm:p-8 text-center space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#2D1B24]">
              {t.admin.verifyEmailTitle}
            </h2>
            <p className="text-sm text-[#6B4E5C] leading-relaxed">
              {t.admin.verifyEmailBody}
            </p>
            {authInfo && (
              <p className="text-xs font-medium text-[#C92A6D]">{authInfo}</p>
            )}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                disabled={authBusy}
                onClick={handleRefreshVerification}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] cursor-pointer min-h-11"
              >
                {t.admin.refreshStatus}
              </button>
              <button
                type="button"
                disabled={authBusy}
                onClick={handleResendVerification}
                className="px-4 py-2.5 text-sm font-medium rounded-xl bg-[#FDF2F6] text-[#2D1B24] border border-rose-200 cursor-pointer min-h-11"
              >
                {t.admin.resendVerification}
              </button>
            </div>
          </div>
        ) : !isAdmin ? (
          /* UNAUTHORIZED GATE */
          <div className="max-w-md mx-auto rounded-2xl bg-white border border-rose-200 p-6 sm:p-8 text-center space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#2D1B24]">
              {t.admin.unauthorizedTitle}
            </h2>
            <p className="text-sm text-[#6B4E5C] leading-relaxed">
              {t.admin.unauthorizedBody}
            </p>
            <p className="text-xs text-[#8C6878]">{user.email}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] cursor-pointer min-h-11"
            >
              {t.admin.signOut}
            </button>
          </div>
        ) : (
          /* AUTHENTICATED SARAH DASHBOARD */
          <div className="space-y-6">
            <div>
              <p className="text-sm text-[#6B4E5C]">{t.admin.subtitle}</p>
            </div>

            {/* Admin Section Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#FDF2F6] border border-rose-200/70">
              {(
                [
                  { id: 'products', label: t.admin.tabs.products, Icon: Package, badge: 0 },
                  {
                    id: 'reservations',
                    label: t.admin.tabs.reservations,
                    Icon: Gift,
                    badge: pendingAttentionCount,
                  },
                  { id: 'addresses', label: t.admin.tabs.addresses, Icon: MapPin, badge: 0 },
                  { id: 'publicNotes', label: t.admin.tabs.publicNotes, Icon: ExternalLink, badge: 0 },
                  { id: 'security', label: t.admin.tabs.security, Icon: KeyRound, badge: 0 },
                  { id: 'stripeOrders', label: 'Ordini Stripe', Icon: Package, badge: 0 },
                ] as const
              ).map(({ id, label, Icon, badge }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer min-h-10 ${
                      active
                        ? 'bg-white text-[#C92A6D] font-semibold shadow-xs border border-rose-200/70'
                        : 'text-[#5E4451] hover:text-[#2D1B24]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                    {badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#C92A6D] text-white text-[11px] font-semibold tabular-nums">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeTab === 'stripeOrders' && <StripeOrders />}

            {/* TAB 1: PRODUCTS, LINKS, IMAGES & RECEIVED */}
            {activeTab === 'products' && (
              <div className="space-y-5">
                {needsCatalogSync && (
                  <div className="rounded-2xl bg-[#FDF2F6] border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Database className="w-5 h-5 text-[#C92A6D] shrink-0 mt-0.5" aria-hidden="true" />
                      <p className="text-sm text-[#2D1B24]">
                        {t.admin.productsPanel.syncInitial}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={productBusy}
                      onClick={handleSeedCatalog}
                      className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] shrink-0 cursor-pointer min-h-10"
                    >
                      {t.admin.productsPanel.syncInitial}
                    </button>
                  </div>
                )}

                {productError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-sm text-[#9B1C4E]">
                    {productError}
                  </div>
                )}
                {productStatus && (
                  <div className="p-3.5 rounded-xl bg-[#FDF2F6] border border-rose-200 text-sm text-[#2D1B24]">
                    {productStatus}
                  </div>
                )}

                {/* Product Editor Form */}
                {editingProduct && (
                  <form
                    onSubmit={handleSaveProduct}
                    className="rounded-2xl bg-white border border-rose-200 p-5 sm:p-6 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="font-display text-lg font-semibold text-[#2D1B24]">
                        {isNewProduct
                          ? t.admin.productsPanel.addNew
                          : editingProduct.name}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="text-sm text-[#6B4E5C] hover:text-[#2D1B24] cursor-pointer"
                      >
                        {t.admin.productsPanel.cancel}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.productsPanel.nameLabel}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={160}
                          value={editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              name: e.target.value,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.productsPanel.brandLabel}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={80}
                          value={editingProduct.brand}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              brand: e.target.value,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.productsPanel.categoryLabel}
                        </label>
                        <select
                          value={editingProduct.category}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              category: e.target.value as ProductCategory,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-rose-200 text-sm bg-white"
                        >
                          <option value="funko">{t.categories.funko}</option>
                          <option value="plush">{t.categories.plush}</option>
                          <option value="gaming">{t.categories.gaming}</option>
                          <option value="streaming">{t.categories.streaming}</option>
                          <option value="accessories">{t.categories.accessories}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.productsPanel.storeLabel}
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={editingProduct.store ?? ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              store: e.target.value || null,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.productsPanel.urlLabel}
                        </label>
                        <input
                          type="url"
                          maxLength={500}
                          placeholder="https://..."
                          value={editingProduct.url ?? ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              url: e.target.value || null,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.productsPanel.imageLabel}
                        </label>
                        <input
                          type="text"
                          maxLength={600}
                          placeholder="/products/... or https://..."
                          value={editingProduct.image ?? ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              image: e.target.value || null,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-rose-200 text-sm"
                        />
                        <p className="mt-1 text-xs text-[#7A5A69]">
                          {t.admin.productsPanel.imageHint}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.productsPanel.descItLabel}
                        </label>
                        <textarea
                          required
                          rows={2}
                          maxLength={500}
                          value={editingProduct.description.it}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              description: {
                                ...editingProduct.description,
                                it: e.target.value,
                              },
                            })
                          }
                          className="w-full p-3 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.productsPanel.descEnLabel}
                        </label>
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={editingProduct.description.en}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              description: {
                                ...editingProduct.description,
                                en: e.target.value,
                              },
                            })
                          }
                          className="w-full p-3 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.productsPanel.descRoLabel}
                        </label>
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={editingProduct.description.ro}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              description: {
                                ...editingProduct.description,
                                ro: e.target.value,
                              },
                            })
                          }
                          className="w-full p-3 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-[#2D1B24] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingProduct.received}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              received: e.target.checked,
                              status: e.target.checked ? 'received' : 'available',
                            })
                          }
                          className="w-4 h-4 accent-[#C92A6D]"
                        />
                        <span>{t.admin.productsPanel.receivedToggle}</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="admin-edit-status"
                          className="text-xs font-semibold text-[#5E4451]"
                        >
                          Stato:
                        </label>
                        <select
                          id="admin-edit-status"
                          value={editingProduct.status}
                          onChange={(e) => {
                            const next = e.target.value as GiftStatus;
                            setEditingProduct({
                              ...editingProduct,
                              status: next,
                              received: next === 'received',
                            });
                          }}
                          className="h-9 px-3 rounded-xl border border-rose-200 text-xs font-medium bg-white"
                        >
                          <option value="available">{t.statuses.available}</option>
                          <option value="reserved">{t.statuses.reserved}</option>
                          <option value="purchase_declared">{t.statuses.purchase_declared}</option>
                          <option value="confirmed">{t.statuses.confirmed}</option>
                          <option value="received">{t.statuses.received}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={productBusy}
                        className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] cursor-pointer min-h-11"
                      >
                        {t.admin.productsPanel.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-5 py-2.5 text-sm font-medium rounded-xl bg-[#FDF2F6] text-[#5E4451] border border-rose-200 cursor-pointer min-h-11"
                      >
                        {t.admin.productsPanel.cancel}
                      </button>
                    </div>
                  </form>
                )}

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <input
                    type="search"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder={t.controls.searchPlaceholder}
                    className="sm:w-80 h-10 px-3.5 rounded-xl bg-white border border-rose-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleOpenNewProduct}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] cursor-pointer min-h-10"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>{t.admin.productsPanel.addNew}</span>
                  </button>
                </div>

                {/* Product Management List */}
                <div className="space-y-2.5">
                  {filteredAdminProducts.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white border border-rose-200/75 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-[#FAF4F7] border border-rose-100 shrink-0 overflow-hidden flex items-center justify-center">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <Package
                              className="w-5 h-5 text-[#C92A6D]/50"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#2D1B24] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#7A5A69] truncate">
                            {t.categories[item.category]} ·{' '}
                            {item.store ?? t.card.storePending} ·{' '}
                            <span
                              className={
                                getEffectiveProductStatus(item) !== 'available'
                                  ? 'text-[#A81E58] font-semibold'
                                  : ''
                              }
                            >
                              {t.statuses[getEffectiveProductStatus(item)]}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={productBusy}
                          onClick={() => handleToggleReceived(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer min-h-9 ${
                            item.received
                              ? 'bg-[#C92A6D] text-white border-[#C92A6D]'
                              : 'bg-[#FDF2F6] text-[#2D1B24] border-rose-200 hover:border-[#C92A6D]/50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t.admin.productsPanel.receivedBadge}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsNewProduct(false);
                            setEditingProduct(item);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-[#2D1B24] border border-rose-200 hover:border-[#C92A6D] cursor-pointer min-h-9"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t.admin.productsPanel.editItem}</span>
                        </button>

                        {deleteTargetId === item.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={productBusy}
                              onClick={() => handleDeleteProduct(item.id)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#C92A6D] text-white cursor-pointer min-h-9"
                            >
                              {t.admin.productsPanel.deleteConfirm}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(null)}
                              className="px-2.5 py-1.5 text-xs rounded-xl bg-[#FDF2F6] text-[#5E4451] cursor-pointer min-h-9"
                            >
                              {t.admin.productsPanel.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(item.id)}
                            aria-label={`${t.admin.productsPanel.deleteAction}: ${item.name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-white text-[#7A5A69] border border-rose-200 hover:text-[#C92A6D] cursor-pointer min-h-9"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: RESERVATIONS & PURCHASE DECLARATIONS */}
            {activeTab === 'reservations' && (
              <div className="space-y-5">
                {productError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-sm text-[#9B1C4E]">
                    {productError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold text-[#2D1B24]">
                    {t.admin.reservationsPanel.heading}
                  </h2>
                </div>

                {trackedReservationProducts.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-rose-200/80 p-8 text-center">
                    <Gift className="w-6 h-6 text-[#C92A6D]/70 mx-auto" aria-hidden="true" />
                    <p className="mt-3 text-sm text-[#6B4E5C]">
                      {t.admin.reservationsPanel.empty}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trackedReservationProducts.map((item) => {
                      const detail = reservationDetails[item.id];
                      const effective = getEffectiveProductStatus(item);
                      const isExpiredHold =
                        item.status === 'reserved' && effective === 'available';

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-white border border-rose-200/80 p-4 sm:p-5 space-y-3"
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-[#FDF2F6] text-[#A81E58] border border-rose-200 font-semibold">
                                  {t.statuses[item.status]}
                                </span>
                                {isExpiredHold && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-[#7A5A69] border border-rose-200">
                                    <Clock className="w-3 h-3" aria-hidden="true" />
                                    <span>Scaduta (&gt;24h)</span>
                                  </span>
                                )}
                                <span className="text-[#7A5A69]">
                                  {item.store ?? t.card.storePending}
                                </span>
                              </div>

                              <p className="font-display text-base sm:text-lg font-semibold text-[#2D1B24]">
                                {item.name}
                              </p>

                              {detail && (
                                <div className="pt-1 space-y-1 text-xs text-[#6B4E5C]">
                                  {detail.expiresAtMs > 0 && item.status === 'reserved' && (
                                    <p>
                                      {t.admin.reservationsPanel.expiresAtPrefix}{' '}
                                      <strong>
                                        {new Date(detail.expiresAtMs).toLocaleString(
                                          'it-IT',
                                          { dateStyle: 'short', timeStyle: 'short' }
                                        )}
                                      </strong>
                                    </p>
                                  )}
                                  {detail.declaredAtMs && (
                                    <p>
                                      {t.admin.reservationsPanel.declaredAtPrefix}{' '}
                                      <strong>
                                        {new Date(detail.declaredAtMs).toLocaleString(
                                          'it-IT',
                                          { dateStyle: 'short', timeStyle: 'short' }
                                        )}
                                      </strong>
                                    </p>
                                  )}
                                  {detail.buyerNote && (
                                    <p className="mt-1.5 p-2.5 rounded-xl bg-[#FDF2F6] border border-rose-200/70 text-[#2D1B24]">
                                      <span className="font-semibold">
                                        {t.admin.reservationsPanel.buyerNotePrefix}
                                      </span>{' '}
                                      {detail.buyerNote}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {(item.status === 'purchase_declared' ||
                                item.status === 'reserved') && (
                                <button
                                  type="button"
                                  disabled={reservationsBusy}
                                  onClick={() =>
                                    handleReservationAction(
                                      item.id,
                                      'confirm_purchase'
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] disabled:opacity-60 cursor-pointer min-h-10"
                                >
                                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>
                                    {t.admin.reservationsPanel.confirmPurchase}
                                  </span>
                                </button>
                              )}

                              {item.status !== 'received' && (
                                <button
                                  type="button"
                                  disabled={reservationsBusy}
                                  onClick={() =>
                                    handleReservationAction(
                                      item.id,
                                      'mark_received'
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#FDF2F6] text-[#A81E58] border border-rose-200 hover:border-[#C92A6D] disabled:opacity-60 cursor-pointer min-h-10"
                                >
                                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>
                                    {t.admin.reservationsPanel.markReceived}
                                  </span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={reservationsBusy}
                                onClick={() =>
                                  handleReservationAction(
                                    item.id,
                                    item.status === 'purchase_declared'
                                      ? 'reject_declaration'
                                      : 'restore'
                                  )
                                }
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-white text-[#5E4451] border border-rose-200 hover:text-[#C92A6D] disabled:opacity-60 cursor-pointer min-h-10"
                              >
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>
                                  {item.status === 'purchase_declared'
                                    ? t.admin.reservationsPanel.rejectDeclaration
                                    : t.admin.reservationsPanel.restoreAvailable}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PRIVATE DELIVERY ADDRESSES */}
            {activeTab === 'addresses' && (
              <form
                onSubmit={handleSavePrivateDelivery}
                className="rounded-2xl bg-white border border-rose-200 p-6 space-y-5 max-w-3xl"
              >
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#2D1B24]">
                    {t.admin.addressesPanel.heading}
                  </h2>
                  <div className="mt-3 p-3.5 rounded-xl bg-[#FDF2F6] border border-rose-200 flex items-start gap-2.5 text-xs sm:text-sm text-[#4B3440]">
                    <ShieldCheck className="w-4 h-4 text-[#C92A6D] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{t.admin.addressesPanel.privacyBanner}</span>
                  </div>
                </div>

                {!privateLoaded ? (
                  <p className="text-sm text-[#6B4E5C]">Caricamento dati protetti...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                        {t.admin.addressesPanel.recipientName}
                      </label>
                      <input
                        type="text"
                        maxLength={120}
                        value={privateInfo.recipientName}
                        onChange={(e) =>
                          setPrivateInfo({
                            ...privateInfo,
                            recipientName: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                        {t.admin.addressesPanel.streetAddress}
                      </label>
                      <input
                        type="text"
                        maxLength={250}
                        value={privateInfo.streetAddress}
                        onChange={(e) =>
                          setPrivateInfo({
                            ...privateInfo,
                            streetAddress: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                        {t.admin.addressesPanel.cityAndPostal}
                      </label>
                      <input
                        type="text"
                        maxLength={150}
                        value={privateInfo.cityAndPostal}
                        onChange={(e) =>
                          setPrivateInfo({
                            ...privateInfo,
                            cityAndPostal: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                        {t.admin.addressesPanel.country}
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        value={privateInfo.country}
                        onChange={(e) =>
                          setPrivateInfo({
                            ...privateInfo,
                            country: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                        {t.admin.addressesPanel.amazonLockerName}
                      </label>
                      <input
                        type="text"
                        maxLength={200}
                        value={privateInfo.amazonLockerName}
                        onChange={(e) =>
                          setPrivateInfo({
                            ...privateInfo,
                            amazonLockerName: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                        {t.admin.addressesPanel.amazonLockerAddress}
                      </label>
                      <input
                        type="text"
                        maxLength={250}
                        value={privateInfo.amazonLockerAddress}
                        onChange={(e) =>
                          setPrivateInfo({
                            ...privateInfo,
                            amazonLockerAddress: e.target.value,
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                        {t.admin.addressesPanel.privateInstructions}
                      </label>
                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={privateInfo.privateInstructions}
                        onChange={(e) =>
                          setPrivateInfo({
                            ...privateInfo,
                            privateInstructions: e.target.value,
                          })
                        }
                        className="w-full p-3.5 rounded-xl border border-rose-200 text-sm"
                      />
                    </div>
                  </div>
                )}

                {privateSavedMsg && (
                  <p className="text-sm font-medium text-[#A81E58]">
                    {privateSavedMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={privateBusy || !privateLoaded}
                  className="px-6 py-3 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] disabled:opacity-60 cursor-pointer min-h-11"
                >
                  {t.admin.addressesPanel.saveButton}
                </button>
              </form>
            )}

            {/* TAB 3: PUBLIC INSTRUCTIONS & AMAZON WISHLIST */}
            {activeTab === 'publicNotes' && (
              <form
                onSubmit={handleSavePublicSettings}
                className="rounded-2xl bg-white border border-rose-200 p-6 space-y-5 max-w-3xl"
              >
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#2D1B24]">
                    {t.admin.publicPanel.heading}
                  </h2>
                  <p className="mt-2 text-sm text-[#6B4E5C] leading-relaxed">
                    {t.admin.publicPanel.intro}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                      {t.admin.publicPanel.amazonWishlistUrl}
                    </label>
                    <input
                      type="url"
                      maxLength={500}
                      placeholder="https://www.amazon.it/hz/wishlist/ls/..."
                      value={publicDraft.amazonWishlistUrl}
                      onChange={(e) =>
                        setPublicDraft({
                          ...publicDraft,
                          amazonWishlistUrl: e.target.value,
                        })
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                    />
                    <label className="mt-2 inline-flex items-center gap-2 text-sm text-[#2D1B24] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={publicDraft.showAmazonWishlist}
                        onChange={(e) =>
                          setPublicDraft({
                            ...publicDraft,
                            showAmazonWishlist: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-[#C92A6D]"
                      />
                      <span>{t.admin.publicPanel.showAmazonWishlist}</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                      {t.admin.publicPanel.publicDeliveryNote}
                    </label>
                    <textarea
                      rows={3}
                      maxLength={800}
                      value={publicDraft.publicDeliveryNote}
                      onChange={(e) =>
                        setPublicDraft({
                          ...publicDraft,
                          publicDeliveryNote: e.target.value,
                        })
                      }
                      className="w-full p-3.5 rounded-xl border border-rose-200 text-sm"
                    />
                    <label className="mt-2 inline-flex items-center gap-2 text-sm text-[#2D1B24] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={publicDraft.showPublicDeliveryNote}
                        onChange={(e) =>
                          setPublicDraft({
                            ...publicDraft,
                            showPublicDeliveryNote: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-[#C92A6D]"
                      />
                      <span>{t.admin.publicPanel.showPublicDeliveryNote}</span>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-rose-100">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#2D1B24] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={publicDraft.hideReceivedFromVisitors}
                        onChange={(e) =>
                          setPublicDraft({
                            ...publicDraft,
                            hideReceivedFromVisitors: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-[#C92A6D]"
                      />
                      <span>{t.admin.publicPanel.hideReceivedFromVisitors}</span>
                    </label>
                  </div>
                </div>

                {publicSavedMsg && (
                  <p className="text-sm font-medium text-[#A81E58]">
                    {publicSavedMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={publicBusy}
                  className="px-6 py-3 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] disabled:opacity-60 cursor-pointer min-h-11"
                >
                  {t.admin.publicPanel.saveButton}
                </button>
              </form>
            )}

            {/* TAB 4: SECURITY, PASSWORD CHANGE & SARAH ACCOUNT INVITE */}
            {activeTab === 'security' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white border border-rose-200 p-6 space-y-4">
                  <h2 className="font-display text-xl font-semibold text-[#2D1B24]">
                    {t.admin.securityPanel.changePasswordHeading}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B4E5C]">
                    {t.admin.securityPanel.signedInAs}{' '}
                    <span className="font-semibold text-[#2D1B24]">
                      {user.email}
                    </span>
                  </p>

                  {pwError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs sm:text-sm text-[#9B1C4E]">
                      {pwError}
                    </div>
                  )}
                  {pwMsg && (
                    <div className="p-3 rounded-xl bg-[#FDF2F6] border border-rose-200 text-xs sm:text-sm text-[#A81E58] font-medium">
                      {pwMsg}
                    </div>
                  )}

                  {hasPasswordProvider ? (
                    <form onSubmit={handleChangePassword} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.securityPanel.currentPassword}
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.securityPanel.newPassword}
                        </label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.securityPanel.confirmPassword}
                        </label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={pwBusy}
                        className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] cursor-pointer min-h-11"
                      >
                        {t.admin.securityPanel.updatePasswordButton}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-[#6B4E5C] leading-relaxed">
                        {t.admin.securityPanel.googleAccountNotice}
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user.email) return;
                          try {
                            await sendPasswordResetEmail(auth, user.email);
                            setPwMsg(t.admin.resetSent);
                          } catch (err) {
                            setPwError(formatAuthError(err));
                          }
                        }}
                        className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#FDF2F6] text-[#C92A6D] border border-rose-200 cursor-pointer min-h-10"
                      >
                        {t.admin.securityPanel.sendResetEmail}
                      </button>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleSaveInviteEmail}
                  className="rounded-2xl bg-white border border-rose-200 p-6 space-y-4"
                >
                  <h2 className="font-display text-xl font-semibold text-[#2D1B24]">
                    {t.admin.securityPanel.inviteHeading}
                  </h2>
                  <p className="text-sm text-[#6B4E5C] leading-relaxed">
                    {t.admin.securityPanel.inviteHelp}
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                      {t.admin.securityPanel.inviteEmailLabel}
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={160}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                    />
                  </div>

                  {inviteMsg && (
                    <p className="text-sm font-medium text-[#A81E58]">
                      {inviteMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] cursor-pointer min-h-11"
                  >
                    {t.admin.securityPanel.saveInviteButton}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}