/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShoppingBag, User, LogOut, ShieldAlert, FileText, Leaf } from "lucide-react";
import { UserProfile } from "../types";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  cartCount: number;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenCart: () => void;
}

export default function Header({
  currentTab,
  setCurrentTab,
  cartCount,
  user,
  onLogout,
  onOpenCart,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-white h-20 flex items-center justify-between shadow-xs">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div 
          onClick={() => setCurrentTab("home")} 
          className="flex cursor-pointer items-center gap-3 text-emerald-800 transition-colors hover:text-emerald-950"
          id="brand-logo"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
            S
          </div>
          <span className="font-sans text-2xl font-bold tracking-tight text-emerald-900">
            Savory<span className="font-light text-slate-500">Green</span>
          </span>
        </div>

        {/* Global Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          {[
            { id: "home", label: "Home" },
            { id: "menu", label: "Menu" },
            { id: "offers", label: "Offers" },
            { id: "contact", label: "Contact" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`font-sans py-1 transition-colors cursor-pointer relative ${
                currentTab === item.id
                  ? "text-emerald-600 border-b-2 border-emerald-500"
                  : "text-slate-600 hover:text-emerald-600"
              }`}
              id={`nav-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {/* Cart trigger button */}
          <button
            onClick={onOpenCart}
            className="group relative rounded-xl p-2.5 text-slate-600 transition-colors bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
            title="Open Shopping Cart"
            id="cart-trigger"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-between rounded-md bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Status / Portal Entry */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (user.isAdmin) {
                    setCurrentTab("admin");
                  } else {
                    setCurrentTab("portal");
                  }
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-sans text-xs font-bold tracking-wide border transition-all cursor-pointer ${
                  user.isAdmin
                    ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                    : "bg-emerald-50 border-emerald-100 text-emerald-800 hover:bg-emerald-100"
                }`}
                id="header-user-status"
              >
                {user.isAdmin ? (
                  <ShieldAlert className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                <span>{user.isAdmin ? "Admin Portal" : "My Dashboard"}</span>
              </button>

              <button
                onClick={onLogout}
                className="rounded-xl p-2.5 text-slate-400 bg-slate-50 hover:bg-red-50 hover:text-red-655 transition-colors cursor-pointer"
                title="Log Out From Account"
                id="header-logout-btn"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentTab("portal")}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-emerald-750 cursor-pointer shadow-sm"
              id="header-login-btn"
            >
              <User className="h-4 w-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="flex border-t border-emerald-50/50 bg-emerald-50/30 md:hidden justify-around py-2.5 px-2">
        {[
          { id: "home", label: "Home" },
          { id: "menu", label: "Menu" },
          { id: "offers", label: "Offers" },
          { id: "contact", label: "Contact" },
          { id: "portal", label: user ? (user.isAdmin ? "Admin" : "Profile") : "Login" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === "portal" && user && user.isAdmin) {
                setCurrentTab("admin");
              } else {
                setCurrentTab(item.id);
              }
            }}
            className={`font-sans text-xs font-medium cursor-pointer transition-colors px-3 py-1 rounded-md ${
              currentTab === item.id || (item.id === "portal" && currentTab === "admin")
                ? "bg-emerald-100 text-emerald-800"
                : "text-zinc-600 hover:text-emerald-700 hover:bg-emerald-50"
            }`}
            id={`mob-nav-${item.id}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
