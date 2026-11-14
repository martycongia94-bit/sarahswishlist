import { useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Gift,
  KeyRound,
  X,
} from 'lucide-react';
import type {
  GiftReservationRecord,
  LocalVisitorReservation,
} from '../firebase/wishlistService';
import type { Language, Translations } from '../i18n/translations';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  activeReservation: GiftReservationRecord | null;
  activeCode: string;
  localReservations: LocalVisitorReservation[];
  onLookupCode: (code: string) => Promise<void>;
  onSelectLocalReservation: (item: LocalVisitorReservation) => Promise<void>;
  onDeclarePurchased: (code: string, buyerNote: string) => Promise<void>;
  onCancelReservation: (code: string) => Promise<void>;
  busy: boolean;
  errorMsg: string;
  infoMsg: string;
  t: Translations;
}

export function ReservationModal({
  isOpen,
  onClose,
  language,
  activeReservation,
  activeCode,
  localReservations,
  onLookupCode,
  onSelectLocalReservation,
  onDeclarePurchased,
  onCancelReservation,
  busy,
  errorMsg,
  infoMsg,
  t,
}: ReservationModalProps) {
  const [lookupInput, setLookupInput] = useState('');
  const [buyerNote, setBuyerNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const locale = language === 'it' ? 'it-IT' : language === 'ro' ? 'ro-RO' : 'en-GB';

  const handleCopyCode = async () => {
    if (!activeCode) return;
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleLookupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;
    await onLookupCode(lookupInput.trim());
  };

  const handleDeclareSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeCode) return;
    await onDeclarePurchased(activeCode, buyerNote);
    setBuyerNote('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D1B24]/45 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white border border-rose-200 shadow-xl shadow-rose-950/15 overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#FDF2F6] border-b border-rose-200/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Gift className="w-5 h-5 text-[#C92A6D] shrink-0" aria-hidden="true" />
            <h2
              id="reservation-modal-title"
              className="font-display text-lg sm:text-xl font-semibold text-[#2D1B24] truncate"
            >
              {activeReservation
                ? activeReservation.status === 'purchase_declared'
                  ? t.reservation.declaredSuccessTitle
                  : t.reservation.modalTitle
                : t.reservation.lookupHeading}
            </h2> 
<div className="mt-2 rounded-xl border border-rose-200 bg-white/80 px-4 py-3">
  <p className="text-sm font-semibold text-rose-700">
    🔒 Destinazione: Indirizzo di casa
  </p>
  <p className="mt-1 text-xs text-gray-600">
    Regalo destinato a Sarah ♡
    L'indirizzo privato non viene mostrato sul sito.
  </p>
</div>

          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.reservation.close}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B4E5C] hover:text-[#2D1B24] hover:bg-white cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs sm:text-sm text-[#9B1C4E]">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 rounded-xl bg-[#FDF2F6] border border-rose-200 text-xs sm:text-sm text-[#2D1B24]">
              {infoMsg}
            </div>
          )}

          {activeReservation ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#FAF4F7] border border-rose-200/80 p-4">
                <p className="text-xs font-medium text-[#7A5A69]">
                  {activeReservation.productStore || t.card.storePending} ·{' '}
                  <span className="text-[#A81E58] font-semibold">
                    {t.statuses[
                      activeReservation.status === 'cancelled'
                        ? 'available'
                        : activeReservation.status
                    ]}
                  </span>
                </p>
                <p className="mt-1 font-display text-base font-semibold text-[#2D1B24]">
                  {activeReservation.productName}
                </p>

                {activeReservation.status === 'reserved' && (
                  <p className="mt-2 text-xs text-[#6B4E5C] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C92A6D] shrink-0" aria-hidden="true" />
                    <span>
                      {t.reservation.expiresLabel}{' '}
                      <strong>
                        {new Date(activeReservation.expiresAtMs).toLocaleString(
                          locale,
                          {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }
                        )}
                      </strong>
                    </span>
                  </p>
                )}
              </div>

              {activeCode && (
                <div className="rounded-xl bg-[#FDF2F6] border border-rose-200 p-4 space-y-2">
                  <p className="text-xs font-semibold text-[#5E4451]">
                    {t.reservation.codeLabel}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm sm:text-base font-mono font-semibold text-[#2D1B24] tracking-wider select-all">
                      {activeCode}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-[#C92A6D] border border-rose-200 hover:border-[#C92A6D] cursor-pointer shrink-0"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {copied ? t.reservation.copiedCode : t.reservation.copyCode}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-[#6B4E5C] leading-relaxed">
                    {t.reservation.modalSubtitle}
                  </p>
                </div>
              )}

              {activeReservation.status === 'reserved' && (
                <>
                  <p className="text-xs text-[#7A5A69]">
                    {t.reservation.expiryRule}
                  </p>

                  {activeReservation.productUrl ? (
                    <a
                      href={activeReservation.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-[#FDF2F6] text-[#2D1B24] border border-rose-200 hover:border-[#C92A6D] hover:text-[#C92A6D] transition-colors min-h-11"
                    >
                      <span>{t.reservation.goToStore}</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </a>
                  ) : (
                    <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#FAF4F7] text-[#7A5A69] border border-rose-200/70">
                      <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{t.card.linkUpdating}</span>
                    </div>
                  )}

                  <form onSubmit={handleDeclareSubmit} className="space-y-3 pt-2 border-t border-rose-100">
                    <div>
                      <label
                        htmlFor="buyer-gift-note"
                        className="block text-xs font-semibold text-[#5E4451] mb-1.5"
                      >
                        {t.reservation.noteLabel}
                      </label>
                      <input
                        id="buyer-gift-note"
                        type="text"
                        maxLength={240}
                        value={buyerNote}
                        onChange={(e) => setBuyerNote(e.target.value)}
                        placeholder={t.reservation.notePlaceholder}
                        className="w-full h-10 px-3.5 rounded-xl border border-rose-200 text-sm text-[#2D1B24] focus:outline-none focus:border-[#C92A6D]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] disabled:opacity-60 transition-colors cursor-pointer min-h-11"
                    >
                      <span>{t.reservation.declareBoughtButton}</span>
                    </button>
                  </form>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onCancelReservation(activeCode)}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-white text-[#6B4E5C] border border-rose-200 hover:text-[#C92A6D] cursor-pointer min-h-10"
                  >
                    {t.reservation.cancelReservationButton}
                  </button>
                </>
              )}

              {activeReservation.status === 'purchase_declared' && (
                <div className="rounded-xl bg-[#FDF2F6] border border-rose-200 p-4 text-sm text-[#4B3440] leading-relaxed">
                  {t.reservation.declaredSuccessBody}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {localReservations.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9E5B78]">
                    {t.reservation.activeBannerTitle}
                  </p>
                  {localReservations.map((item) => (
                    <div
                      key={item.code}
                      className="rounded-xl bg-[#FDF2F6] border border-rose-200 p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#2D1B24] truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs font-mono text-[#7A5A69] truncate">
                          {item.code}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onSelectLocalReservation(item)}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] shrink-0 cursor-pointer min-h-9"
                      >
                        {t.reservation.manageButton}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleLookupSubmit} className="space-y-3">
                <label
                  htmlFor="lookup-reservation-code"
                  className="block text-xs font-semibold text-[#5E4451]"
                >
                  {t.reservation.lookupHeading}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <KeyRound
                      className="w-4 h-4 text-[#8C6878] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="lookup-reservation-code"
                      type="text"
                      required
                      value={lookupInput}
                      onChange={(e) => setLookupInput(e.target.value)}
                      placeholder={t.reservation.lookupPlaceholder}
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-rose-200 text-sm font-mono uppercase text-[#2D1B24] focus:outline-none focus:border-[#C92A6D]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] cursor-pointer min-h-11 shrink-0"
                  >
                    {t.reservation.lookupButton}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
