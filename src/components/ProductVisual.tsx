import { useState } from 'react';
import type { Product, ProductCategory } from '../data/products';

interface ProductVisualProps {
  product: Product;
  categoryLabel: string;
  imagePendingNote: string;
}

function CategoryLineArt({ category }: { category: ProductCategory }) {
  const common = 'w-12 h-12 text-[#C92A6D]/55';
  switch (category) {
    case 'funko':
      return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" className={common} aria-hidden="true">
          <rect x="11" y="7" width="26" height="34" rx="4" />
          <rect x="15" y="12" width="18" height="17" rx="2.5" />
          <circle cx="20.5" cy="19.5" r="1.5" fill="currentColor" />
          <circle cx="27.5" cy="19.5" r="1.5" fill="currentColor" />
          <path d="M18 35h12" strokeLinecap="round" />
        </svg>
      );
    case 'plush':
      return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" className={common} aria-hidden="true">
          <circle cx="15" cy="14" r="4.5" />
          <circle cx="33" cy="14" r="4.5" />
          <circle cx="24" cy="24" r="11" />
          <circle cx="20" cy="22.5" r="1.3" fill="currentColor" />
          <circle cx="28" cy="22.5" r="1.3" fill="currentColor" />
          <path d="M21.5 27.5c1.5 1.3 3.5 1.3 5 0" strokeLinecap="round" />
          <path d="M16 34.5c2 3 14 3 16 0" strokeLinecap="round" />
        </svg>
      );
    case 'gaming':
      return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" className={common} aria-hidden="true">
          <rect x="7" y="10" width="34" height="22" rx="3.5" />
          <path d="M19 32v6M29 32v6M15 38h18" strokeLinecap="round" />
          <path d="M15 19h8M15 24h5" strokeLinecap="round" />
          <circle cx="31.5" cy="21.5" r="3" />
        </svg>
      );
    case 'streaming':
      return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" className={common} aria-hidden="true">
          <rect x="18" y="8" width="12" height="20" rx="6" />
          <path d="M13 22a11 11 0 0 0 22 0" strokeLinecap="round" />
          <path d="M24 33v7M17 40h14" strokeLinecap="round" />
        </svg>
      );
    case 'accessories':
      return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" className={common} aria-hidden="true">
          <path d="M13 18h18v13a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7V18Z" />
          <path d="M31 21h3.5a3.5 3.5 0 0 1 0 7H31" />
          <path d="M18 12c0 1.5 1.5 2 1.5 3.5M24 11c0 1.5 1.5 2 1.5 3.5" strokeLinecap="round" />
        </svg>
      );
  }
}

export function ProductVisual({
  product,
  categoryLabel,
  imagePendingNote,
}: ProductVisualProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (product.image && !imgFailed) {
    return (
      <div className="relative aspect-[4/3] w-full bg-[#FAF4F7] overflow-hidden border-b border-rose-100/80 flex items-center justify-center p-4">
        <img
          src={product.image}
          alt={`${product.name} — ${categoryLabel}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[4/3] w-full bg-gradient-to-br from-[#FDF2F6] via-[#FFF9FB] to-[#F9E8F0] overflow-hidden border-b border-rose-100/80 flex flex-col items-center justify-center p-5 text-center"
      role="img"
      aria-label={`${product.name} — ${imagePendingNote}`}
    >
      <div className="w-full h-full rounded-xl border border-rose-200/70 bg-white/60 flex flex-col items-center justify-center px-4 py-3">
        <CategoryLineArt category={product.category} />
        <p className="mt-2.5 text-[11px] font-semibold tracking-wider uppercase text-[#9E5B78]">
          {product.brand}
        </p>
        <p className="mt-1 font-display text-sm font-medium text-[#2D1B24] line-clamp-2 [text-wrap:balance]">
          {product.name}
        </p>
      </div>
    </div>
  );
}
