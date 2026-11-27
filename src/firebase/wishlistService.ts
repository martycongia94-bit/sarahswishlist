import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { PRODUCTS, type Product, type ProductCategory } from '../data/products';
import {
  BOOTSTRAPPED_OWNER_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from './client';

export type GiftStatus =
  | 'available'
  | 'reserved'
  | 'purchase_declared'
  | 'confirmed'
  | 'received';

export interface WishlistProductRecord extends Product {
  status: GiftStatus;
  reservedUntilMs: number | null;
  received: boolean;
  sortOrder: number;
}

export interface GiftReservationRecord {
  reservationDocId: string;
  productId: string;
  productName: string;
  productStore: string;
  productUrl: string;
  status: 'reserved' | 'purchase_declared' | 'confirmed' | 'received' | 'cancelled';
  buyerNote: string;
  reservedAtMs: number | null;
  expiresAtMs: number;
  declaredAtMs: number | null;
}

export interface LocalVisitorReservation {
  code: string;
  productId: string;
  productName: string;
  productStore: string | null;
  productUrl: string | null;
  expiresAtMs: number;
}

export interface PublicWishlistSettings {
  amazonWishlistUrl: string;
  showAmazonWishlist: boolean;
  publicDeliveryNote: string;
  showPublicDeliveryNote: boolean;
  hideReceivedFromVisitors: boolean;
}

export interface PrivateDeliveryInfo {
  recipientName: string;
  streetAddress: string;
  cityAndPostal: string;
  country: string;
  amazonLockerName: string;
  amazonLockerAddress: string;
  privateInstructions: string;
}

export const DEFAULT_PUBLIC_SETTINGS: PublicWishlistSettings = {
  amazonWishlistUrl: '',
  showAmazonWishlist: false,
  publicDeliveryNote: '',
  showPublicDeliveryNote: false,
  hideReceivedFromVisitors: false,
};

export const DEFAULT_PRIVATE_DELIVERY: PrivateDeliveryInfo = {
  recipientName: '',
  streetAddress: '',
  cityAndPostal: '',
  country: '',
  amazonLockerName: '',
  amazonLockerAddress: '',
  privateInstructions: '',
};

const PRODUCTS_COL = 'wishlist_products';
const SETTINGS_DOC = 'wishlist_settings/public';
const PRIVATE_DOC = 'private_delivery/sarah_private';
const INVITE_DOC = 'admin_invites/primary_sarah';
const RESERVATIONS_COL = 'gift_reservations';
const LOCKS_COL = 'private_reservation_locks';

const MAX_ACTIVE_LOCAL_RESERVATIONS = 3;
const RESERVATION_HOURS = 24;

function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function isValidCategory(value: unknown): value is ProductCategory {
  return (
    value === 'funko' ||
    value === 'plush' ||
    value === 'gaming' ||
    value === 'streaming' ||
    value === 'accessories'
  );
}

function isValidStatus(value: unknown): value is GiftStatus {
  return (
    value === 'available' ||
    value === 'reserved' ||
    value === 'purchase_declared' ||
    value === 'confirmed' ||
    value === 'received'
  );
}

function timestampToMs(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

export function isProductAvailableToVisitors(
  product: WishlistProductRecord,
  nowMs: number = Date.now()
): boolean {
  if (product.status === 'available') return true;
  if (
    product.status === 'reserved' &&
    product.reservedUntilMs !== null &&
    product.reservedUntilMs <= nowMs
  ) {
    return true;
  }
  return false;
}

export function getEffectiveProductStatus(
  product: WishlistProductRecord,
  nowMs: number = Date.now()
): GiftStatus {
  if (
    product.status === 'reserved' &&
    product.reservedUntilMs !== null &&
    product.reservedUntilMs <= nowMs
  ) {
    return 'available';
  }
  return product.status;
}

function mapFirestoreProduct(
  docId: string,
  data: Record<string, unknown>
): WishlistProductRecord {
  // Prefer matching catalog gift links without changing stored reservations.
  const savedUrl = typeof data.url === 'string' ? data.url : '';
  const catalogItem = PRODUCTS.find(item => item.id === docId && item.name === data.name);
  const catalogUrl = catalogItem?.url;
  const rawUrl = catalogUrl && /^https:\/\/throne\.com\/sarah15petkovic\/item\/[0-9a-f-]{36}$/i.test(catalogUrl) ? catalogUrl : savedUrl;
  const rawStore = typeof data.store === 'string' ? data.store : '';
  const rawImage = typeof data.image === 'string' ? data.image : '';
  const received = Boolean(data.received);
  const status: GiftStatus = isValidStatus(data.status)
    ? data.status
    : received
      ? 'received'
      : 'available';

  return {
    id: typeof data.id === 'string' ? data.id : docId,
    name: typeof data.name === 'string' ? data.name : '',
    brand: typeof data.brand === 'string' ? data.brand : 'Brand',
    category: isValidCategory(data.category) ? data.category : 'accessories',
    store: rawStore ? rawStore : null,
    url: rawUrl ? rawUrl : null,
    image: rawImage ? rawImage : null,
    description: {
      it: typeof data.descriptionIt === 'string' ? data.descriptionIt : '',
      en: typeof data.descriptionEn === 'string' ? data.descriptionEn : '',
      ro: typeof data.descriptionRo === 'string' ? data.descriptionRo : '',
    },
    status,
    reservedUntilMs: timestampToMs(data.reservedUntil),
    received: status === 'received' || received,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 999,
  };
}

export function getInitialStaticCatalog(): WishlistProductRecord[] {
  return PRODUCTS.map((item, idx) => ({
    ...item,
    status: 'available',
    reservedUntilMs: null,
    received: false,
    sortOrder: idx + 1,
  }));
}

export function subscribePublicProducts(
  onData: (products: WishlistProductRecord[], isFromFirestore: boolean) => void
): Unsubscribe {
  const q = query(collection(db, PRODUCTS_COL), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(getInitialStaticCatalog(), false);
        return;
      }
      const list = snapshot.docs.map((d) =>
        mapFirestoreProduct(d.id, d.data() as Record<string, unknown>)
      );
      onData(list, true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, PRODUCTS_COL);
    }
  );
}

export function subscribePublicSettings(
  onData: (settings: PublicWishlistSettings) => void
): Unsubscribe {
  const ref = doc(db, 'wishlist_settings', 'public');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_PUBLIC_SETTINGS);
        return;
      }
      const data = snap.data() as Record<string, unknown>;
      onData({
        amazonWishlistUrl:
          typeof data.amazonWishlistUrl === 'string'
            ? data.amazonWishlistUrl
            : '',
        showAmazonWishlist: Boolean(data.showAmazonWishlist),
        publicDeliveryNote:
          typeof data.publicDeliveryNote === 'string'
            ? data.publicDeliveryNote
            : '',
        showPublicDeliveryNote: Boolean(data.showPublicDeliveryNote),
        hideReceivedFromVisitors: Boolean(data.hideReceivedFromVisitors),
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, SETTINGS_DOC);
    }
  );
}

// Cryptographic helpers for secret reservation codes
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReservationCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let raw = '';
  for (let i = 0; i < bytes.length; i += 1) {
    raw += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `SARAH-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function normalizeReservationCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export async function hashReservationCode(code: string): Promise<string> {
  const normalized = normalizeReservationCode(code);
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function reserveGiftProduct(
  product: WishlistProductRecord,
  activeLocalCount: number
): Promise<{
  code: string;
  reservationDocId: string;
  expiresAtMs: number;
}> {
  if (activeLocalCount >= MAX_ACTIVE_LOCAL_RESERVATIONS) {
    throw new Error('RESERVATION_LIMIT_REACHED');
  }

  // Preliminary check only: the Worker and Firestore do not share an atomic lock.
  const response = await fetch('/api/test/status', { cache: 'no-store' });
  if (!response.ok) throw new Error('STRIPE_STATUS_UNAVAILABLE');
  const stripeStatus = await response.json();
  if (!Array.isArray(stripeStatus.paid) || !Array.isArray(stripeStatus.pending)) {
    throw new Error('STRIPE_STATUS_UNAVAILABLE');
  }
  if (stripeStatus.paid.includes(product.id) || stripeStatus.pending.includes(product.id)) {
    throw new Error('ALREADY_RESERVED');
  }

  const code = generateReservationCode();
  const reservationDocId = await hashReservationCode(code);
  const expiresAtMs = Date.now() + RESERVATION_HOURS * 60 * 60 * 1000;
  const expiresAtTs = Timestamp.fromMillis(expiresAtMs);

  const productRef = doc(db, PRODUCTS_COL, product.id);
  const lockRef = doc(db, LOCKS_COL, product.id);
  const reservationRef = doc(db, RESERVATIONS_COL, reservationDocId);

  try {
    await runTransaction(db, async (tx) => {
      const prodSnap = await tx.get(productRef);
      if (!prodSnap.exists()) {
        throw new Error('CATALOG_NOT_SYNCED');
      }

      const prodData = prodSnap.data() as Record<string, unknown>;
      const currentStatus = isValidStatus(prodData.status)
        ? prodData.status
        : 'available';
      const currentUntil = timestampToMs(prodData.reservedUntil);

      const canReserve =
        currentStatus === 'available' ||
        (currentStatus === 'reserved' &&
          currentUntil !== null &&
          currentUntil <= Date.now());

      if (!canReserve) {
        throw new Error('ALREADY_RESERVED');
      }

      tx.update(productRef, {
        status: 'reserved',
        reservedUntil: expiresAtTs,
        updatedAt: serverTimestamp(),
      });

      tx.set(lockRef, {
        productId: product.id,
        reservationDocId,
        expiresAt: expiresAtTs,
        updatedAt: serverTimestamp(),
      });

      tx.set(reservationRef, {
        productId: product.id,
        productName: clampString(product.name, 160),
        productStore: clampString(product.store ?? '', 80),
        productUrl: clampString(product.url ?? '', 500),
        status: 'reserved',
        buyerNote: '',
        reservedAt: serverTimestamp(),
        expiresAt: expiresAtTs,
        declaredAt: null,
        updatedAt: serverTimestamp(),
      });
    });

    return { code, reservationDocId, expiresAtMs };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'ALREADY_RESERVED' ||
        error.message === 'CATALOG_NOT_SYNCED' ||
        error.message === 'RESERVATION_LIMIT_REACHED')
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `${PRODUCTS_COL}/${product.id}`);
  }
}

export async function lookupReservationByCode(
  code: string
): Promise<GiftReservationRecord | null> {
  const reservationDocId = await hashReservationCode(code);
  const ref = doc(db, RESERVATIONS_COL, reservationDocId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const d = snap.data() as Record<string, unknown>;
    return {
      reservationDocId,
      productId: String(d.productId ?? ''),
      productName: String(d.productName ?? ''),
      productStore: String(d.productStore ?? ''),
      productUrl: String(d.productUrl ?? ''),
      status: (d.status as GiftReservationRecord['status']) ?? 'reserved',
      buyerNote: String(d.buyerNote ?? ''),
      reservedAtMs: timestampToMs(d.reservedAt),
      expiresAtMs: timestampToMs(d.expiresAt) ?? 0,
      declaredAtMs: timestampToMs(d.declaredAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${RESERVATIONS_COL}/${reservationDocId}`);
  }
}

export async function declareGiftPurchased(
  code: string,
  buyerNote: string = ''
): Promise<string> {
  const reservationDocId = await hashReservationCode(code);
  const reservationRef = doc(db, RESERVATIONS_COL, reservationDocId);

  try {
    const productId = await runTransaction(db, async (tx) => {
      const resSnap = await tx.get(reservationRef);
      if (!resSnap.exists()) {
        throw new Error('RESERVATION_NOT_FOUND');
      }
      const resData = resSnap.data() as Record<string, unknown>;
      const pid = String(resData.productId ?? '');
      const expiresAtMs = timestampToMs(resData.expiresAt) ?? 0;

      if (resData.status !== 'reserved') {
        throw new Error('INVALID_RESERVATION_STATE');
      }
      if (expiresAtMs <= Date.now()) {
        throw new Error('RESERVATION_EXPIRED');
      }

      const productRef = doc(db, PRODUCTS_COL, pid);
      const prodSnap = await tx.get(productRef);
      if (!prodSnap.exists()) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      tx.update(reservationRef, {
        status: 'purchase_declared',
        declaredAt: serverTimestamp(),
        buyerNote: clampString(buyerNote, 240),
        updatedAt: serverTimestamp(),
      });

      tx.update(productRef, {
        status: 'purchase_declared',
        updatedAt: serverTimestamp(),
      });

      return pid;
    });

    return productId;
  } catch (error) {
    if (
      error instanceof Error &&
      [
        'RESERVATION_NOT_FOUND',
        'INVALID_RESERVATION_STATE',
        'RESERVATION_EXPIRED',
        'PRODUCT_NOT_FOUND',
      ].includes(error.message)
    ) {
      throw error;
    }
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `${RESERVATIONS_COL}/${reservationDocId}`
    );
  }
}

export async function cancelGiftReservation(code: string): Promise<string> {
  const reservationDocId = await hashReservationCode(code);
  const reservationRef = doc(db, RESERVATIONS_COL, reservationDocId);

  try {
    const productId = await runTransaction(db, async (tx) => {
      const resSnap = await tx.get(reservationRef);
      if (!resSnap.exists()) {
        throw new Error('RESERVATION_NOT_FOUND');
      }
      const resData = resSnap.data() as Record<string, unknown>;
      const pid = String(resData.productId ?? '');
      const expiresAtMs = timestampToMs(resData.expiresAt) ?? 0;

      if (resData.status !== 'reserved') {
        throw new Error('INVALID_RESERVATION_STATE');
      }
      if (expiresAtMs <= Date.now()) {
        throw new Error('RESERVATION_EXPIRED');
      }

      const productRef = doc(db, PRODUCTS_COL, pid);
      tx.update(reservationRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      tx.update(productRef, {
        status: 'available',
        reservedUntil: null,
        updatedAt: serverTimestamp(),
      });
      return pid;
    });

    return productId;
  } catch (error) {
    if (
      error instanceof Error &&
      [
        'RESERVATION_NOT_FOUND',
        'INVALID_RESERVATION_STATE',
        'RESERVATION_EXPIRED',
      ].includes(error.message)
    ) {
      throw error;
    }
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `${RESERVATIONS_COL}/${reservationDocId}`
    );
  }
}

export async function verifyAndClaimAdmin(user: User): Promise<boolean> {
  if (!user.emailVerified || !user.email) {
    return false;
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const adminRef = doc(db, 'admins', user.uid);

  try {
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      return true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `admins/${user.uid}`);
  }

  if (normalizedEmail === BOOTSTRAPPED_OWNER_EMAIL.toLowerCase()) {
    try {
      await setDoc(adminRef, {
        uid: user.uid,
        email: normalizedEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `admins/${user.uid}`);
    }
  }

  try {
    const inviteRef = doc(db, 'admin_invites', 'primary_sarah');
    const inviteSnap = await getDoc(inviteRef);
    if (
      inviteSnap.exists() &&
      String(inviteSnap.data().email || '').toLowerCase() === normalizedEmail
    ) {
      await setDoc(adminRef, {
        uid: user.uid,
        email: normalizedEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function seedOrSyncCatalogToFirestore(): Promise<{
  created: number;
  updated: number;
}> {
  const colRef = collection(db, PRODUCTS_COL);
  const existingMap = new Map<string, Record<string, unknown>>();
  try {
    const snap = await getDocs(colRef);
    snap.docs.forEach((d) => {
      existingMap.set(d.id, d.data() as Record<string, unknown>);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCTS_COL);
  }

  let created = 0;
  let updated = 0;

  try {
    const batch = writeBatch(db);
    PRODUCTS.forEach((item, index) => {
      const ref = doc(db, PRODUCTS_COL, item.id);
      const existing = existingMap.get(item.id);

      if (!existing) {
        created += 1;
        batch.set(ref, {
          id: item.id,
          name: clampString(item.name, 160),
          brand: clampString(item.brand, 80),
          category: item.category,
          store: clampString(item.store ?? '', 80),
          url: clampString(item.url ?? '', 500),
          image: clampString(item.image ?? '', 600),
          descriptionIt: clampString(item.description.it, 500),
          descriptionEn: clampString(item.description.en, 500),
          descriptionRo: clampString(item.description.ro, 500),
          status: 'available',
          reservedUntil: null,
          received: false,
          sortOrder: index + 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const needsBackfill =
          !existing.status ||
          (!existing.url && item.url) ||
          (!existing.image && item.image);
        if (needsBackfill) {
          updated += 1;
          const currentReceived = Boolean(existing.received);
          const currentStatus = isValidStatus(existing.status)
            ? existing.status
            : currentReceived
              ? 'received'
              : 'available';
          batch.update(ref, {
            store: existing.store || clampString(item.store ?? '', 80),
            url: existing.url || clampString(item.url ?? '', 500),
            image: existing.image || clampString(item.image ?? '', 600),
            descriptionIt:
              existing.descriptionIt || clampString(item.description.it, 500),
            descriptionEn:
              existing.descriptionEn || clampString(item.description.en, 500),
            descriptionRo:
              existing.descriptionRo || clampString(item.description.ro, 500),
            status: currentStatus,
            reservedUntil: existing.reservedUntil ?? null,
            updatedAt: serverTimestamp(),
          });
        }
      }
    });

    if (created > 0 || updated > 0) {
      await batch.commit();
    }
    return { created, updated };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRODUCTS_COL);
  }
}

export async function saveProductToFirestore(
  product: WishlistProductRecord,
  isNew: boolean
): Promise<void> {
  const safeId = clampString(
    product.id.replace(/[^a-zA-Z0-9_\-]/g, '_'),
    128
  );
  if (!safeId) {
    throw new Error('Invalid product ID');
  }

  const ref = doc(db, PRODUCTS_COL, safeId);
  const cleanUrl = clampString(product.url ?? '', 500);
  const cleanImage = clampString(product.image ?? '', 600);
  const cleanName = clampString(product.name, 160) || 'Desiderio';
  const cleanBrand = clampString(product.brand, 80) || 'Wishlist';

  const descIt = clampString(product.description.it || cleanName, 500);
  const descEn = clampString(product.description.en || descIt, 500);
  const descRo = clampString(product.description.ro || descIt, 500);

  const nextStatus: GiftStatus = product.received
    ? 'received'
    : product.status || 'available';

  if (isNew) {
    try {
      await setDoc(ref, {
        id: safeId,
        name: cleanName,
        brand: cleanBrand,
        category: product.category,
        store: clampString(product.store ?? '', 80),
        url: cleanUrl,
        image: cleanImage,
        descriptionIt: descIt,
        descriptionEn: descEn,
        descriptionRo: descRo,
        status: nextStatus,
        reservedUntil: null,
        received: nextStatus === 'received',
        sortOrder: Math.min(10000, Math.max(0, Math.round(product.sortOrder))),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${PRODUCTS_COL}/${safeId}`);
    }
  } else {
    try {
      await updateDoc(ref, {
        name: cleanName,
        brand: cleanBrand,
        category: product.category,
        store: clampString(product.store ?? '', 80),
        url: cleanUrl,
        image: cleanImage,
        descriptionIt: descIt,
        descriptionEn: descEn,
        descriptionRo: descRo,
        status: nextStatus,
        received: nextStatus === 'received',
        sortOrder: Math.min(10000, Math.max(0, Math.round(product.sortOrder))),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COL}/${safeId}`);
    }
  }
}

export async function fetchAdminReservationDetails(
  products: WishlistProductRecord[]
): Promise<Record<string, GiftReservationRecord>> {
  const result: Record<string, GiftReservationRecord> = {};
  const targets = products.filter((p) => p.status !== 'available');

  await Promise.all(
    targets.map(async (p) => {
      try {
        const lockSnap = await getDoc(doc(db, LOCKS_COL, p.id));
        if (!lockSnap.exists()) return;
        const reservationDocId = String(lockSnap.data().reservationDocId ?? '');
        if (!reservationDocId) return;
        const resSnap = await getDoc(doc(db, RESERVATIONS_COL, reservationDocId));
        if (!resSnap.exists()) return;
        const d = resSnap.data() as Record<string, unknown>;
        result[p.id] = {
          reservationDocId,
          productId: String(d.productId ?? p.id),
          productName: String(d.productName ?? p.name),
          productStore: String(d.productStore ?? ''),
          productUrl: String(d.productUrl ?? ''),
          status: (d.status as GiftReservationRecord['status']) ?? 'reserved',
          buyerNote: String(d.buyerNote ?? ''),
          reservedAtMs: timestampToMs(d.reservedAt),
          expiresAtMs: timestampToMs(d.expiresAt) ?? 0,
          declaredAtMs: timestampToMs(d.declaredAt),
        };
      } catch {
        // Ignore individual lock read issues if lock hasn't been created yet
      }
    })
  );

  return result;
}

export async function adminTransitionProductStatus(
  productId: string,
  action: 'confirm_purchase' | 'reject_declaration' | 'restore' | 'mark_received'
): Promise<void> {
  const productRef = doc(db, PRODUCTS_COL, productId);
  const lockRef = doc(db, LOCKS_COL, productId);

  const targetProductStatus: GiftStatus =
    action === 'confirm_purchase'
      ? 'confirmed'
      : action === 'mark_received'
        ? 'received'
        : 'available';

  const targetReservationStatus =
    action === 'confirm_purchase'
      ? 'confirmed'
      : action === 'mark_received'
        ? 'received'
        : 'cancelled';

  try {
    let reservationDocId: string | null = null;
    try {
      const lockSnap = await getDoc(lockRef);
      if (lockSnap.exists()) {
        reservationDocId = String(lockSnap.data().reservationDocId ?? '') || null;
      }
    } catch {
      reservationDocId = null;
    }

    const batch = writeBatch(db);
    batch.update(productRef, {
      status: targetProductStatus,
      reservedUntil: null,
      received: targetProductStatus === 'received',
      updatedAt: serverTimestamp(),
    });

    if (reservationDocId) {
      const resRef = doc(db, RESERVATIONS_COL, reservationDocId);
      batch.update(resRef, {
        status: targetReservationStatus,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COL}/${productId}`);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const ref = doc(db, PRODUCTS_COL, productId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COL}/${productId}`);
  }
}

export async function savePublicSettings(
  settings: PublicWishlistSettings,
  uid: string
): Promise<void> {
  const ref = doc(db, 'wishlist_settings', 'public');
  const payload = {
    amazonWishlistUrl: clampString(settings.amazonWishlistUrl, 500),
    showAmazonWishlist: Boolean(settings.showAmazonWishlist),
    publicDeliveryNote: clampString(settings.publicDeliveryNote, 800),
    showPublicDeliveryNote: Boolean(settings.showPublicDeliveryNote),
    hideReceivedFromVisitors: Boolean(settings.hideReceivedFromVisitors),
    updatedByUid: clampString(uid, 128),
    updatedAt: serverTimestamp(),
  };

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC);
  }
}

export async function getPrivateDeliveryInfo(): Promise<PrivateDeliveryInfo> {
  const ref = doc(db, 'private_delivery', 'sarah_private');
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_PRIVATE_DELIVERY;
    const data = snap.data() as Record<string, unknown>;
    return {
      recipientName:
        typeof data.recipientName === 'string' ? data.recipientName : '',
      streetAddress:
        typeof data.streetAddress === 'string' ? data.streetAddress : '',
      cityAndPostal:
        typeof data.cityAndPostal === 'string' ? data.cityAndPostal : '',
      country: typeof data.country === 'string' ? data.country : '',
      amazonLockerName:
        typeof data.amazonLockerName === 'string' ? data.amazonLockerName : '',
      amazonLockerAddress:
        typeof data.amazonLockerAddress === 'string'
          ? data.amazonLockerAddress
          : '',
      privateInstructions:
        typeof data.privateInstructions === 'string'
          ? data.privateInstructions
          : '',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PRIVATE_DOC);
  }
}

export async function savePrivateDeliveryInfo(
  info: PrivateDeliveryInfo,
  uid: string
): Promise<void> {
  const ref = doc(db, 'private_delivery', 'sarah_private');
  const payload = {
    recipientName: clampString(info.recipientName, 120),
    streetAddress: clampString(info.streetAddress, 250),
    cityAndPostal: clampString(info.cityAndPostal, 150),
    country: clampString(info.country, 80),
    amazonLockerName: clampString(info.amazonLockerName, 200),
    amazonLockerAddress: clampString(info.amazonLockerAddress, 250),
    privateInstructions: clampString(info.privateInstructions, 1000),
    updatedByUid: clampString(uid, 128),
    updatedAt: serverTimestamp(),
  };

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRIVATE_DOC);
  }
}

export async function getSarahInviteEmail(): Promise<string> {
  const ref = doc(db, 'admin_invites', 'primary_sarah');
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return '';
    return typeof snap.data().email === 'string' ? snap.data().email : '';
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, INVITE_DOC);
  }
}

export async function saveSarahInviteEmail(
  email: string,
  invitedByUid: string
): Promise<void> {
  const ref = doc(db, 'admin_invites', 'primary_sarah');
  const cleanEmail = clampString(email.toLowerCase(), 160);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Invalid email');
  }
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        email: cleanEmail,
        invitedByUid: clampString(invitedByUid, 128),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        email: cleanEmail,
        invitedByUid: clampString(invitedByUid, 128),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, INVITE_DOC);
  }
}