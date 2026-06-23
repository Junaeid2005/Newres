/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { MenuItem } from "../types";
import { Search, Loader2, Star, CheckCircle, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MenuGridProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  isLoading: boolean;
}

export default function MenuGrid({ items, onAddToCart, isLoading }: MenuGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extrapolate distinct categories from items
  const categories = useMemo(() => {
    const list = new Set(items.map((i) => i.category));
    return ["All", ...Array.from(list)];
  }, [items]);

  // Filter items matching search and selected category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 py-8" id="menu-page-container">
      {/* Menu Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl flex items-center gap-2">
            <span className="w-2 h-7 bg-emerald-500 rounded-full inline-block" />
            Our Freshly Prepared Menu
          </h1>
          <p className="font-sans text-sm text-slate-500 max-w-lg">
            Every dish is prepared using premium certified organic crops, homegrown mint elixirs, and fresh cold-pressed oils.
          </p>
        </div>

        {/* Live Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search healthy dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 font-sans text-sm text-slate-900 outline-none focus:border-emerald-500"
            id="menu-search-input"
          />
        </div>
      </div>

      {/* Category Tabs list */}
      <div className="scrollbar-none flex overflow-x-auto px-4 sm:px-6 lg:px-8 py-2 border-b border-slate-100 max-w-7xl mx-auto gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 cursor-pointer rounded-lg px-5 py-2 font-sans text-xs font-bold transition-all ${
              selectedCategory === cat
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
            }`}
            id={`category-tab-${cat.replace(/\s+/g, "-")}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-700 space-y-3">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="font-sans text-sm font-semibold tracking-wide text-slate-500">Gathering menu details...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 max-w-lg mx-auto">
            <p className="font-sans text-sm text-slate-400">No items match your preferences. Try another search or category.</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            id="menu-items-grid"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  key={item.id}
                  className={`group flex flex-col overflow-hidden rounded-2xl bg-white border transition-all ${
                    item.isAvailable 
                      ? "border-slate-100 hover:shadow-md hover:border-slate-200" 
                      : "border-slate-200 opacity-65"
                  }`}
                  id={`menu-item-card-${item.id}`}
                >
                  {/* Photo container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-105">
                    <img
                      referrerPolicy="no-referrer"
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    
                    {/* Floating Price badge */}
                    <div className="absolute top-3 right-3 rounded-lg bg-white/95 backdrop-blur-xs px-3 py-1 text-xs font-extrabold text-emerald-800 shadow-sm border border-slate-100">
                      {item.price} BDT
                    </div>

                    {/* Stock Alert */}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-3xs text-white font-sans text-xs font-bold uppercase tracking-wider">
                        Out of stock
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-5 space-y-3">
                    <div>
                      <div className="flex items-center space-x-1 mb-1">
                        <Tag className="h-3 w-3 text-emerald-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          {item.category}
                        </span>
                      </div>
                      
                      <h3 className="font-sans text-lg font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                        {item.name}
                      </h3>
                    </div>

                    <p className="font-sans text-xs text-slate-450 leading-relaxed flex-1">
                      {item.description}
                    </p>

                    {/* Footer Row */}
                    <div className="pt-3 flex items-center justify-between border-t border-slate-50">
                      <span className="font-sans text-xs text-slate-400 flex items-center space-x-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>Fresh Today</span>
                      </span>

                      <button
                        onClick={() => item.isAvailable && onAddToCart(item)}
                        disabled={!item.isAvailable}
                        className={`rounded-xl px-4 py-2 font-sans text-xs font-bold transition-all cursor-pointer ${
                          item.isAvailable
                            ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                        id={`add-btn-${item.id}`}
                      >
                        {item.isAvailable ? "Add to Cart" : "Unavailable"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
