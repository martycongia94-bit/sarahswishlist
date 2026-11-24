import { Lock } from 'lucide-react';
import type { Translations } from '../i18n/translations';

interface FooterProps {
  onOpenAdmin: () => void;
  t: Translations;
}

export function Footer({ onOpenAdmin, t }: FooterProps) {
  return (
    <footer className="bg-white border-t border-rose-200/70 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-3">
          <div>
            <p className="font-display text-lg font-semibold text-[#2D1B24]">
              Sarah's Wishlist ♡
            </p>
            <p className="mt-1 text-sm text-[#6B4E5C]">{t.footer.tagline}</p>
          </div>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-[#FDF2F6] text-[#7A5A69] border border-rose-200/80 hover:text-[#C92A6D] hover:border-[#C92A6D]/40 transition-colors cursor-pointer min-h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D]"
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.footer.privateAreaButton}</span>
          </button>
        </div>

        <div className="text-xs sm:text-sm text-[#7A5A69] max-w-xl space-y-1 md:text-right">
          <p>{t.footer.disclaimer}</p>
          <p>{t.footer.localPrivacy}</p>
        </div>
      </div>
    </footer>
  );
}
