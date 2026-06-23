/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserProfile, Order } from "../types";
import {
  User,
  Mail,
  Phone,
  Lock,
  History,
  ShoppingBag,
  Tag,
  LogOut,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  Shield,
  HelpCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface UserPortalProps {
  user: UserProfile | null;
  onLoginSuccess: (profile: UserProfile) => void;
  onLogout: () => void;
  orders: Order[];
  isLoadingOrders: boolean;
  setCurrentTab: (tab: string) => void;
}

export default function UserPortal({
  user,
  onLoginSuccess,
  onLogout,
  orders,
  isLoadingOrders,
  setCurrentTab,
}: UserPortalProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");

  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter orders specific to this logged in customer
  const userOrders = orders.filter((o) => o?.userId === user?.uid);
  const activeOrders = userOrders.filter((o) => o?.paymentStatus === "pending");
  const pastOrders = userOrders.filter((o) => o?.paymentStatus === "paid");

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Email and password fields are required.");
      setIsAuthenticating(false);
      return;
    }

    try {
      if (isRegistering) {
        // Sign up flow
        if (!authName.trim()) {
          setAuthError("Please provide your full name for delivery coordinates.");
          setIsAuthenticating(false);
          return;
        }
        if (!authPhone.trim() || authPhone.length < 10) {
          setAuthError("Please specify a valid mobile phone number for manual payment reference checks.");
          setIsAuthenticating(false);
          return;
        }

        // Create Firebase Authentication Account
        const res = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const firebaseUser = res.user;

        // Customise auth displayName
        await updateProfile(firebaseUser, { displayName: authName });

        // Set developer email or admin credentials as Admin metadata
        const isAdmin = authEmail.trim().toLowerCase() === "junaeid2.0shohan@gmail.com" || authEmail.trim().toLowerCase() === "admin@savorygreen.com";

        // Record User profile within Firestore
        const profileData: UserProfile = {
          uid: firebaseUser.uid,
          email: authEmail.trim().toLowerCase(),
          phone: authPhone.trim(),
          name: authName.trim(),
          isAdmin: isAdmin,
        };

        await setDoc(doc(db, "users", firebaseUser.uid), profileData);
        onLoginSuccess(profileData);
      } else {
        // Sign in flow
        const res = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        const firebaseUser = res.user;

        // Retrieve custom user profile document from firestore
        const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (docSnap.exists()) {
          onLoginSuccess(docSnap.data() as UserProfile);
        } else {
          // If profile doc missing, regenerate it safely on current credentials
          const isAdmin = authEmail.trim().toLowerCase() === "junaeid2.0shohan@gmail.com" || authEmail.trim().toLowerCase() === "admin@savorygreen.com";
          const profileData: UserProfile = {
            uid: firebaseUser.uid,
            email: authEmail,
            phone: authPhone || "01700000000",
            name: firebaseUser.displayName || "Diner",
            isAdmin: isAdmin,
          };
          await setDoc(doc(db, "users", firebaseUser.uid), profileData);
          onLoginSuccess(profileData);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setAuthError("This email address is already registered.");
      } else if (err.code === "auth/invalid-credential") {
        setAuthError("Incorrect password or credentials combination.");
      } else if (err.code === "auth/operation-not-allowed") {
        setAuthError("Email/Password login is currently disabled in your Firebase Console. Please go to Build > Authentication > Sign-in method tab in your Firebase Console, click 'Add new provider', select 'Email/Password' and enable it. In the meantime, you can use the 'Continue with Google' button below!");
      } else {
        setAuthError(err.message || "Authentication failed. Please verify details.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setIsAuthenticating(true);
    try {
      const provider = new GoogleAuthProvider();
      // Enforce custom query parameter to ensure account selection popup
      provider.setCustomParameters({
        prompt: "select_account",
      });
      const res = await signInWithPopup(auth, provider);
      const firebaseUser = res.user;

      const authEmail = firebaseUser.email || "";
      const authName = firebaseUser.displayName || "Diner";
      const authPhone = firebaseUser.phoneNumber || "01700000000";

      // Check if user has an existing Firestore profile doc
      const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      const isAdmin = authEmail.trim().toLowerCase() === "junaeid2.0shohan@gmail.com" || authEmail.trim().toLowerCase() === "admin@savorygreen.com";

      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        // Keep isAdmin up-to-date
        if (profile.isAdmin !== isAdmin) {
          profile.isAdmin = isAdmin;
          await setDoc(doc(db, "users", firebaseUser.uid), profile, { merge: true });
        }
        onLoginSuccess(profile);
      } else {
        // Document missing, create one safely
        const profileData: UserProfile = {
          uid: firebaseUser.uid,
          email: authEmail.trim().toLowerCase(),
          phone: authPhone,
          name: authName.trim(),
          isAdmin: isAdmin,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), profileData);
        onLoginSuccess(profileData);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-blocked") {
        setAuthError("The sign-in popup was blocked by the browser. Because the app is running inside a preview frame (iframe), popups are blocked by default. Please open the app in a new browser tab using the 'Open in new tab' button in the top-right corner of the screen and try again!");
      } else {
        setAuthError(err.message || "Google Authentication failed. Please retry.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const copyVoucherToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="user-portal-container">
      {!user ? (
        /* ================= AUTHENTICATION FORMS ================= */
        <div className="mx-auto max-w-md bg-white border border-slate-150 rounded-2xl p-8 shadow-sm">
          <div className="text-center space-y-2 mb-8">
            <h2 className="font-sans text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl flex items-center justify-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              {isRegistering ? "Create your Account" : "Access User Portal"}
            </h2>
            <p className="font-sans text-xs text-slate-500 max-w-xs mx-auto">
              {isRegistering
                ? "Register your mobile and delivery details to begin placing customized health salads and chops."
                : "Sign in using your register credentials to log, view past orders, or review pending meals."}
            </p>
          </div>

          <form onSubmit={handleAuthAction} className="space-y-4" id="auth-form">
            {isRegistering && (
              <>
                <div className="space-y-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sheikh Shohan"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 font-sans text-sm text-slate-900 outline-none focus:border-emerald-500"
                      id="input-reg-name"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute top-3 left-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 01721938899"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 font-sans text-sm text-slate-900 outline-none focus:border-emerald-500"
                      id="input-reg-phone"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 font-sans text-sm text-slate-900 outline-none focus:border-emerald-500"
                  id="input-auth-email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Secret Password</label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="minimum 6 characters"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 font-sans text-sm text-slate-900 outline-none focus:border-emerald-500"
                  id="input-auth-password"
                />
              </div>
            </div>

            {authError && (
              <p className="font-sans text-xs font-semibold text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100" id="auth-error-block">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full rounded-xl bg-emerald-600 py-3.5 font-sans text-xs font-bold tracking-wide uppercase text-white hover:bg-emerald-700 flex items-center justify-center cursor-pointer transition-colors"
              id="auth-submit-btn"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                  <span>Configuring custom session...</span>
                </>
              ) : (
                <span>{isRegistering ? "Create Diner Profile" : "Secure Log In"}</span>
              )}
            </button>
          </form>

          {/* Divider and Google Sign-In */}
          <div className="mt-4 space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <span className="relative bg-white px-3 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Or recommend
              </span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              type="button"
              className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3.5 font-sans text-xs font-bold tracking-wide text-slate-700 flex items-center justify-center gap-2.5 cursor-pointer transition-colors shadow-2xs"
              id="google-signin-btn"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.9 0 3.51.65 4.58 1.66l3.43-3.43C17.9 1.19 15.15 0 12 0 7.37 0 3.4 2.66 1.48 6.55l4 3.1c.96-2.88 3.66-4.61 6.52-4.61z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.46h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.48 14.54c-.25-.75-.39-1.55-.39-2.37s.14-1.62.39-2.37l-4-3.1C.53 8.31 0 10.09 0 12s.53 3.69 1.48 5.3l4-3.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.71 1.09-2.86 0-5.56-1.73-6.52-4.61l-4 3.12C3.4 21.34 7.37 24 12 24z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Form Toggles */}
          <div className="text-center mt-6 border-t border-slate-100 pt-4">
            <button
              onClick={() => {
                setAuthError("");
                setIsRegistering(!isRegistering);
              }}
              className="font-sans text-xs font-bold text-emerald-600 hover:text-emerald-850 transition-colors cursor-pointer"
              id="auth-toggle-btn"
            >
              {isRegistering
                ? "Already have diner credentials? Sign In here"
                : "A new diner? Register your details here"}
            </button>
          </div>
        </div>
      ) : (
        /* ================= USER PROFILE DASHBOARD ================= */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3" id="diner-dashboard">
          {/* PROFILE SUMMARY BAR */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-emerald-50 p-3.5 text-emerald-600">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-bold text-slate-800">{user.name}</h3>
                  <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-bold tracking-wider text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <Sparkles className="h-3 w-3 inline" />
                    <span>Regular Diner</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-50 pt-4 text-xs font-sans">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center space-x-1 font-semibold">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </span>
                  <span className="font-semibold text-slate-800">{user.email}</span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center space-x-1 font-semibold">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>Registered Mobile</span>
                  </span>
                  <span className="font-semibold text-slate-800">{user.phone}</span>
                </div>

                {user.isAdmin && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-amber-700" />
                    <span className="text-[10px] font-bold text-amber-900">
                      You are flagged as Administrator. Visit the administrative system.
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-red-150 py-3 font-sans text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                id="portal-logout-btn"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out Account</span>
              </button>
            </div>

            {/* OFFERS & VOUCHER DISCOUNTS INSIDE USER PORTAL AS REQUESTED */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-sans text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                  <Tag className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Claims and Active Promotions</span>
                </h3>
                <p className="font-sans text-[11px] text-slate-450 mt-0.5">Copy these active vouchers directly onto your checkout cart.</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/20 p-3.5 flex items-center justify-between">
                  <div className="space-y-1 pr-2">
                    <span className="font-mono text-xs font-extrabold text-emerald-850 tracking-wide bg-emerald-100 px-2 py-0.5 rounded-md">MINT20</span>
                    <p className="font-sans text-xs font-bold text-slate-800">20% Off Culinary Platter</p>
                    <p className="font-sans text-[10px] text-slate-400 leading-tight">Applied on custom organic meals over 1000 BDT.</p>
                  </div>
                  <button
                    onClick={() => copyVoucherToClipboard("MINT20")}
                    className="p-1.5 bg-white rounded-lg border border-slate-100 text-slate-500 hover:text-emerald-700 hover:border-emerald-200 cursor-pointer"
                    title="Copy Discount Code"
                  >
                    {copiedCode === "MINT20" ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>

                <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/20 p-3.5 flex items-center justify-between">
                  <div className="space-y-1 pr-2">
                    <span className="font-mono text-xs font-extrabold text-emerald-850 tracking-wide bg-emerald-100 px-2 py-0.5 rounded-md">ORGANIC10</span>
                    <p className="font-sans text-xs font-bold text-slate-800">10% Off Flat Saver</p>
                    <p className="font-sans text-[10px] text-slate-400 leading-tight">No minimum cart restriction. Valid everyday!</p>
                  </div>
                  <button
                    onClick={() => copyVoucherToClipboard("ORGANIC10")}
                    className="p-1.5 bg-white rounded-lg border border-slate-100 text-slate-500 hover:text-emerald-700 hover:border-emerald-200 cursor-pointer"
                    title="Copy Discount Code"
                  >
                    {copiedCode === "ORGANIC10" ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE & HISTORIC ORDERS LISTINGS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs min-h-[400px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-sans text-base font-bold text-slate-900 flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  <span>Diner Order History</span>
                </h3>
                <span className="font-sans text-xs text-slate-400 font-semibold">{userOrders.length} Registered Placements</span>
              </div>

              {isLoadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 text-emerald-700 space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="font-sans text-xs text-slate-500">Securing order histories...</p>
                </div>
              ) : userOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="rounded-full bg-emerald-50 p-4 text-emerald-600">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-slate-800 text-sm">No registered orders found</h4>
                    <p className="font-sans text-xs text-slate-400 max-w-sm mt-1">
                      You haven’t ordered any fresh meals yet! Head to the culinary menu to pick mint chops or coolers.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab("menu")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 font-sans text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    Browse Organic Food Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-6 pt-5">
                  {/* PENDING MANUAL STATE VERIFICATIONS */}
                  {activeOrders.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center space-x-1.5 bg-amber-50 px-3 py-1.5 rounded-lg w-max">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
                        <span>Pending manual validation ({activeOrders.length})</span>
                      </h4>
                      {activeOrders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-amber-100 bg-amber-50/10 p-5 space-y-3.5"
                          id={`order-active-${order.id}`}
                        >
                          {/* Order Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-150/40 pb-2.5 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-sans text-slate-400 block uppercase font-bold text-[9px]">ORDER ID</span>
                              <span className="font-mono text-slate-700 font-semibold">{order.id}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-sans text-slate-400 block uppercase font-bold text-[9px]">BKASH REFERENCE CODE</span>
                              <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-xs">{order.referenceNumber}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-sans text-slate-400 block uppercase font-bold text-[9px]">PLACED AT</span>
                              <span className="font-medium text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Order Article Items */}
                          <div className="space-y-2 text-xs">
                            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-450 block">Registered Dishes</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {order.items.map((it: any, idx: number) => (
                                <div key={idx} className="flex justify-between bg-white border border-slate-100 p-2 rounded-lg">
                                  <span className="font-semibold text-slate-800 font-sans">{it.name} <span className="text-slate-400">x{it.quantity}</span></span>
                                  <span className="text-slate-500 font-mono text-[11px] font-semibold">{it.price * it.quantity} BDT</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Instructions manual info block */}
                          <div className="bg-amber-100/35 border border-amber-200/50 rounded-xl p-3 text-xs flex justify-between items-center">
                            <div className="space-y-0.5 pr-2">
                              <p className="font-bold text-amber-950 font-sans">Payment verification is pending</p>
                              <p className="font-sans text-slate-500 text-[11px]">
                                Send money to <strong className="text-slate-705">01721938899</strong> with bKash reference <strong className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-1 rounded-sm">{order.referenceNumber}</strong>. We deliver immediately once received.
                              </p>
                            </div>
                            <span className="text-emerald-800 font-mono font-extrabold text-sm whitespace-nowrap">{order.totalPrice} BDT</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PAST CLEARED DELIVERED MEALS */}
                  {pastOrders.length > 0 && (
                    <div className="space-y-3 pt-4">
                      <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Paid and delivered meals ({pastOrders.length})
                      </h4>
                      {pastOrders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-emerald-50 bg-emerald-50/5 p-5 space-y-3.5"
                          id={`order-past-${order.id}`}
                        >
                          {/* Order Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/40 pb-2.5 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-sans text-slate-400 block uppercase font-bold text-[9px]">ORDER ID</span>
                              <span className="font-mono text-slate-600">{order.id}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-sans text-slate-400 block uppercase font-bold text-[9px]">VERIFIED BKASH REF</span>
                              <span className="font-mono font-bold text-emerald-805 bg-emerald-100 px-2 py-0.5 rounded-md text-xs">{order.referenceNumber}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-sans text-slate-400 block uppercase font-bold text-[9px]">COMPLETED MEAL</span>
                              <span className="font-medium text-emerald-700 flex items-center space-x-1">
                                <CheckCircle2 className="h-3.5 w-3.5 inline inline-block text-emerald-600" />
                                <span>Verified & Cooked</span>
                              </span>
                            </div>
                          </div>

                          {/* Order Article Items */}
                          <div className="space-y-2 text-xs">
                            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-450 block">Dished Placed</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {order.items.map((it: any, idx: number) => (
                                <div key={idx} className="flex justify-between bg-white border border-slate-100 p-2 rounded-lg">
                                  <span className="font-semibold text-slate-800 font-sans">{it.name} <span className="text-slate-400">x{it.quantity}</span></span>
                                  <span className="text-slate-500 font-mono text-[11px] font-semibold">{it.price * it.quantity} BDT</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="font-sans text-xs text-slate-450">Completed on: {new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="text-emerald-950 font-mono font-extrabold text-sm">{order.totalPrice} BDT</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
