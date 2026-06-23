/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowLeftRight, ArrowRight, ShieldCheck, Soup, Award, Star } from "lucide-react";
import { MenuItem } from "../types";
import { motion } from "motion/react";

interface HeroProps {
  onNavigateToMenu: () => void;
  featuredItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export default function Hero({ onNavigateToMenu, featuredItems, onAddToCart }: HeroProps) {
  // Take first 4 available items as featured lists
  const displayItems = featuredItems.filter((i) => i.isAvailable).slice(0, 4);

  return (
    <div className="space-y-12 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="home-page-container">
      {/* Hero Core Section with side-by-side or stacked layout */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/50 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row gap-8 items-center">
        {/* Abstract geometric accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex-1 space-y-6">
          <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
            Pure & Fresh
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 leading-[1.1] tracking-tighter font-sans">
            Modern Dining<br />
            <span className="text-emerald-600 italic">Refined Taste.</span>
          </h1>
          <p className="text-slate-550 text-sm sm:text-base max-w-lg leading-relaxed">
            Experience culinary excellence with our farm-to-table approach, fresh mint compositions, gourmet entrees, and transparent manual payment verification.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={onNavigateToMenu}
              className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-750 transition-all cursor-pointer"
              id="hero-cta-order-now"
            >
              Order Now
            </button>
            <button 
              onClick={onNavigateToMenu}
              className="px-8 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              View Menu
            </button>
          </div>
        </div>

        {/* Hero Decorative Graphic */}
        <div className="w-full md:w-2/5 aspect-[4/3] rounded-2xl overflow-hidden bg-slate-150 relative border border-slate-100 shadow-xs flex items-center justify-center">
          <img 
            referrerPolicy="no-referrer"
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600" 
            alt="Verdant Culinary Platter"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">TODAY'S SPECIAL</p>
            <h4 className="font-bold text-sm">Signature Mint-Glazed Chops</h4>
          </div>
        </div>
      </section>

      {/* Culinary Virtues Grid */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex gap-4 items-start p-6 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0 font-bold text-xl">🥗</div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">100% Organic Recipes</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Harvested daily from certified local biodynamic gardens, bringing zero contamination to your dining table.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start p-6 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0 font-bold text-xl">🥑</div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Pristine Fine-Dining</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Carefully conceptualized culinary compositions that strike a perfect balance of aesthetics, luxury, and health.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start p-6 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0 font-bold text-xl">💸</div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">bKash Settlements</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Robust order validation using manually validated bKash transaction values, and immediate receipt dispatch.
            </p>
          </div>
        </div>
      </section>

      {/* Popular Today Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-slate-100 pb-3">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full inline-block"></span>
            Popular Today
          </h2>
          <button 
            onClick={onNavigateToMenu} 
            className="text-emerald-600 text-xs font-semibold hover:underline"
          >
            View All &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayItems.length > 0 ? (
            displayItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                id={`featured-item-${item.id}`}
              >
                <div>
                  <div className="relative w-full aspect-video rounded-xl bg-slate-50 overflow-hidden mb-3.5 border border-slate-50">
                    <img 
                      referrerPolicy="no-referrer"
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-800 border border-slate-100">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">{item.name}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-50">
                  <span className="font-bold text-emerald-600 text-xs tracking-tight font-mono">{item.price} BDT</span>
                  <button 
                    onClick={() => onAddToCart(item)}
                    className="w-8 h-8 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-emerald-600 hover:text-white transition-colors"
                    id={`add-featured-${item.id}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-slate-100">
              <p className="text-xs text-slate-400">Loading fine delicacies... Ensure server is running.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
