import { ArrowUpRight } from 'lucide-react';
import type { PublicWishlistSettings } from '../firebase/wishlistService';
import type { Translations } from '../i18n/translations';

interface HowItWorksProps {
  publicSettings: PublicWishlistSettings;
  t: Translations;
}

export function HowItWorks({ publicSettings, t }: HowItWorksProps) {
  const steps = [
    { title: t.howItWorks.step1Title, body: t.howItWorks.step1Body },
    { title: t.howItWorks.step2Title, body: t.howItWorks.step2Body },
    { title: t.howItWorks.step3Title, body: t.howItWorks.step3Body },
  ];

  const deliveryPoints = [
    t.deliverySection.point1,
    t.deliverySection.point2,
    t.deliverySection.point3,
    t.deliverySection.point4,
    t.deliverySection.point5,
  ];

  const hasAmazonLink =
    publicSettings.showAmazonWishlist &&
    publicSettings.amazonWishlistUrl.trim().startsWith('http');
  const hasPublicNote =
    publicSettings.showPublicDeliveryNote &&
    publicSettings.publicDeliveryNote.trim().length > 0;

  return (
    <section
      id="how-it-works"
      className="py-14 sm:py-16 bg-[#FDF2F6] border-t border-rose-200/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div>
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#2D1B24] tracking-tight [text-wrap:balance]">
              {t.howItWorks.heading}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#4B3440] leading-relaxed">
              {t.howItWorks.lead}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl bg-white p-6 border border-rose-200/70 shadow-xs shadow-rose-900/5"
              >
                <h3 className="text-base font-semibold text-[#2D1B24]">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm text-[#6B4E5C] leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Public Delivery Section (Section 9) */}
        <div
          id="delivery"
          className="rounded-2xl bg-white p-6 sm:p-8 border border-rose-200/80 shadow-xs shadow-rose-900/5 space-y-5"
        >
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#2D1B24] [text-wrap:balance]">
            {t.deliverySection.heading}
          </h2>

          <ul className="space-y-2.5 text-sm sm:text-base text-[#4B3440]">
            {deliveryPoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="text-[#C92A6D] font-semibold mt-0.5" aria-hidden="true">
                  ♡
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {(hasAmazonLink || hasPublicNote) && (
            <div className="pt-4 border-t border-rose-100 space-y-4">
              {hasPublicNote && (
                <div className="rounded-xl bg-[#FDF2F6] border border-rose-200/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9E5B78]">
                    {t.deliverySection.authorizedNoteTitle}
                  </p>
                  <p className="mt-1.5 text-sm sm:text-base text-[#2D1B24] leading-relaxed whitespace-pre-line">
                    {publicSettings.publicDeliveryNote}
                  </p>
                </div>
              )}

              {hasAmazonLink && (
                <div>
                  <a
                    href={publicSettings.amazonWishlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] transition-colors min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C92A6D] focus-visible:ring-offset-2"
                  >
                    <span>{t.deliverySection.amazonCta}</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-[#7A5A69]">
          {t.howItWorks.privacyNote}
        </p>
      </div>
    </section>
  );
}
