/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Tag, Copy, CheckCircle2, Flame, Gift, Percent } from "lucide-react";

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const STATIC_OFFERS_DISPLAY = [
    {
      code: "MINT20",
      percentage: "20% OFF",
      title: "Mint-Infused Culinary Treat",
      minimum: "Min order: 1000 BDT",
      description: "Applies across all signature entrée items including mint-glazed chops and pesto gnocchis. Settle payment via manual bKash tracker.",
      badge: "Chef's Handpick"
    },
    {
      code: "ORGANIC10",
      percentage: "10% FLAT",
      title: "Everyday Organic Saver",
      minimum: "No Minimum limit BDT",
      description: "Enjoy a flat discounts across burgers, deserts, and refreshing mojitos. Feed your dynamic appetite lighter.",
      badge: "Everyday Deal"
    }
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10" id="offers-page-container">
      {/* Editorial Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-850 bg-emerald-100/60 px-3.5 py-1 rounded-full uppercase tracking-wider">
          <Flame className="h-3.5 w-3.5 fill-emerald-800" />
          <span>Seasonal Promotions</span>
        </span>
        <h1 className="font-sans text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl flex items-center justify-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          Savory Green Vouchers
        </h1>
        <p className="font-sans text-sm text-slate-550 leading-relaxed">
          Redeem premium discount vouchers and promo certificates directly in your shopping cart summary drawer.
        </p>
      </div>

      {/* Promotions Cards Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {STATIC_OFFERS_DISPLAY.map((offer) => (
          <div
            key={offer.code}
            className="group relative rounded-2xl border border-slate-100 bg-white p-6 hover:shadow-md transition-all flex flex-col justify-between"
            id={`offer-card-${offer.code}`}
          >
            {/* Top row */}
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1 pr-3">
                <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 tracking-wider uppercase">
                  {offer.badge}
                </span>
                <h3 className="font-sans text-xl font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">{offer.title}</h3>
                <p className="font-sans text-xs text-slate-500 leading-relaxed">{offer.description}</p>
              </div>

              {/* Graphic Discount Bubble */}
              <div className="rounded-xl bg-emerald-600 p-4 text-white text-center font-sans space-y-0.5 shadow-sm min-w-[90px]">
                <Percent className="h-5 w-5 mx-auto" />
                <span className="block text-xs font-black tracking-tighter uppercase">{offer.percentage}</span>
              </div>
            </div>

            {/* Bottom panel */}
            <div className="border-t border-slate-100 mt-6 pt-5 flex items-center justify-between text-xs font-sans">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px] tracking-wider uppercase">MINIMUM CART</span>
                <span className="font-mono text-slate-800 font-extrabold" id={`offer-min-${offer.code}`}>{offer.minimum}</span>
              </div>

              {/* Copy Coupon Trigger */}
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-slate-50 font-mono text-xs font-bold border border-slate-200 px-3 py-1.5 text-slate-800">
                  {offer.code}
                </div>
                <button
                  onClick={() => copyCoupon(offer.code)}
                  className="rounded-lg bg-emerald-50 px-3.5 py-2 font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer flex items-center space-x-1"
                  id={`copy-offer-btn-${offer.code}`}
                >
                  {copiedCode === offer.code ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decorative Tips */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 flex items-start space-x-3.5 max-w-xl mx-auto">
        <Gift className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 font-sans text-xs leading-relaxed text-slate-500">
          <strong className="text-slate-800 font-bold">Chef Tip: Enjoy manual discounts!</strong>
          <p>
            Voucher codes can be typed into the cart summary slides during active orders. Each verified discount updates both email ticket printouts and administrative clearance totals.
          </p>
        </div>
      </div>
    </div>
  );
}
