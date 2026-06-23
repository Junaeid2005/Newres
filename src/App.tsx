/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { MenuItem, CartItem, Order, UserProfile } from "./types";

// Import Custom Modular Components
import Header from "./components/Header";
import Hero from "./components/Hero";
import MenuGrid from "./components/MenuGrid";
import OffersPage from "./components/OffersPage";
import ContactPage from "./components/ContactPage";
import UserPortal from "./components/UserPortal";
import AdminPanel from "./components/AdminPanel";
import CartDrawer from "./components/CartDrawer";

import { Loader2, Plus, Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  // Navigation Route State
  const [currentTab, setCurrentTab] = useState<string>("home");

  // Core Datastore State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Shopping Cart & Drawer States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Global Loading Indicators
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Load custom cart from localStorage on init
  useEffect(() => {
    try {
      const cachedCart = localStorage.getItem("sg_cart_cache");
      if (cachedCart) {
        setCartItems(JSON.parse(cachedCart));
      }
    } catch (e) {
      console.error("Cart localStorage cache read failed:", e);
    }
  }, []);

  // Save cart to localCache on changes
  useEffect(() => {
    try {
      localStorage.setItem("sg_cart_cache", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Cart localStorage cache write failed:", e);
    }
  }, [cartItems]);

  // Sync menu items from Express backend API
  const fetchMenuItems = async () => {
    setIsLoadingMenu(true);
    try {
      const res = await fetch("/api/menu");
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (err) {
      console.error("Failed to load menu items from backend API:", err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Sync orders from Express backend API (useful for Admin and User Profile dashboards)
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to sync orders catalog:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Listen to Firebase Auth state shifts
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Read full details including phone and admin flag from Firestore profile
          const docSnap = await getDoc(doc(db, "users", fbUser.uid));
          if (docSnap.exists()) {
            setCurrentUser(docSnap.data() as UserProfile);
          } else {
            // Fallback profile if auth claims exist but doc missing
            const fallbackProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || "",
              phone: "",
              name: fbUser.displayName || "Valued Diner",
              isAdmin: fbUser.email === "junaeid2.0shohan@gmail.com" || fbUser.email === "admin@savorygreen.com",
            };
            setCurrentUser(fallbackProfile);
          }
        } catch (e) {
          console.error("Failed to load user profile doc:", e);
        }
      } else {
        setCurrentUser(null);
      }
    });

    // Populate initial assets on boot
    fetchMenuItems();
    fetchOrders();

    return () => unsub();
  }, []);

  // Sync orders on tab changes to keep panels live
  useEffect(() => {
    if (currentTab === "portal" || currentTab === "admin") {
      fetchOrders();
    }
  }, [currentTab]);

  // ---------------- CART OPERATIONS ----------------

  const handleAddToCart = (item: MenuItem) => {
    setCartItems((prev) => {
      const matchedIdx = prev.findIndex((c) => c.id === item.id);
      if (matchedIdx > -1) {
        const copy = [...prev];
        copy[matchedIdx].quantity += 1;
        return copy;
      } else {
        return [...prev, { id: item.id, menuItem: item, quantity: 1 }];
      }
    });
    // Open cart automatically to prompt progress review
    setIsCartOpen(true);
  };

  const handleUpdateQty = (id: string, newQty: number) => {
    if (newQty < 1) {
      handleRemoveItem(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, quantity: newQty } : c))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem("sg_cart_cache");
  };

  // ---------------- AUTHENTICATION OPERATIONS ----------------

  const handleLoginSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
    if (profile.isAdmin) {
      setCurrentTab("admin");
    } else {
      setCurrentTab("portal");
    }
  };

  const handleLogoutAction = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCurrentTab("home");
      handleClearCart();
    } catch (e) {
      console.error("Logout process met an error:", e);
    }
  };

  // ---------------- ORDER & KITCHEN OPERATIONS ----------------

  const handlePlaceOrderSubmission = async (details: {
    name: string;
    email: string;
    phone: string;
    items: any[];
    totalPrice: number;
  }) => {
    if (!currentUser) return null;

    try {
      const payload = {
        userId: currentUser.uid,
        userName: details.name,
        userEmail: details.email,
        userPhone: details.phone,
        items: details.items,
        totalPrice: details.totalPrice,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const orderData = await res.json();
        // clear local shopping cart
        handleClearCart();
        // sync database orders
        fetchOrders();
        return { id: orderData.id, referenceNumber: orderData.referenceNumber };
      } else {
        const err = await res.json();
        throw new Error(err.error || "Server error");
      }
    } catch (err: any) {
      console.error("Order submission threw an error:", err);
      throw new Error(err.message || "Billing connection failed. Verify server is online.");
    }
  };

  const handleMarkAsPaidAction = async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        fetchOrders(); // refresh
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // ---------------- ADMIN MENU MANAGEMENT OPERATIONS ----------------

  const handleAddMenuItem = async (item: Omit<MenuItem, "id">): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        fetchMenuItems(); // Refresh local list
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleEditMenuItem = async (id: string, item: Omit<MenuItem, "id">): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        fetchMenuItems();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleDeleteMenuItem = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMenuItems();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Helper values
  const totalCartCount = cartItems.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col justify-between text-zinc-800 selection:bg-emerald-100 selection:text-emerald-900" id="savory-green-app-root">
      
      {/* Dynamic Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        cartCount={totalCartCount}
        user={currentUser}
        onLogout={handleLogoutAction}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Screen Layout Container */}
      <main className="flex-grow">
        {currentTab === "home" && (
          <Hero
            onNavigateToMenu={() => setCurrentTab("menu")}
            featuredItems={menuItems}
            onAddToCart={handleAddToCart}
          />
        )}

        {currentTab === "menu" && (
          <MenuGrid
            items={menuItems}
            onAddToCart={handleAddToCart}
            isLoading={isLoadingMenu}
          />
        )}

        {currentTab === "offers" && <OffersPage />}

        {currentTab === "contact" && <ContactPage />}

        {currentTab === "portal" && (
          <UserPortal
            user={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogoutAction}
            orders={orders}
            isLoadingOrders={isLoadingOrders}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === "admin" && (
          <AdminPanel
            user={currentUser}
            menuItems={menuItems}
            orders={orders}
            isLoadingOrders={isLoadingOrders}
            onRefreshOrders={fetchOrders}
            onMarkAsPaid={handleMarkAsPaidAction}
            onAddMenuItem={handleAddMenuItem}
            onEditMenuItem={handleEditMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        )}
      </main>

      {/* Slide-out Shopping Cart & Manual Checkout Portal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        user={currentUser}
        onPlaceOrder={handlePlaceOrderSubmission}
        onNavigateToPortal={() => setCurrentTab("portal")}
      />

      {/* Brand Footer */}
      <footer className="border-t border-emerald-50 bg-white py-12" id="applet-footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-emerald-805">Savory Green Platter</p>
          <p className="font-sans text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Pristine organic dining experiences engineered in modern React + Firebase. 
            Send manual payments safely directly to bKash receiver 01721938899.
          </p>
          <div className="flex justify-center space-x-6 text-[11px] font-sans font-semibold text-zinc-400">
            <button onClick={() => setCurrentTab("home")} className="hover:text-emerald-700 cursor-pointer">Home</button>
            <span>•</span>
            <button onClick={() => setCurrentTab("menu")} className="hover:text-emerald-700 cursor-pointer">Menu</button>
            <span>•</span>
            <button onClick={() => setCurrentTab("offers")} className="hover:text-emerald-700 cursor-pointer">Offers</button>
            <span>•</span>
            <button onClick={() => setCurrentTab("contact")} className="hover:text-emerald-700 cursor-pointer">Contact</button>
          </div>
          <p className="font-mono text-[10px] text-zinc-400 pt-3">
            © {new Date().getFullYear()} Savory Green Restaurant. Crafted with pride, Dhaka, Bangladesh.
          </p>
        </div>
      </footer>
    </div>
  );
}
