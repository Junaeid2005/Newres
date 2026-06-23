/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { X, ShoppingBag, Plus, Minus, Trash, Tag, ShieldCheck, Check, ArrowRight, Loader2 } from "lucide-react";
import { CartItem, MenuItem, UserProfile } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  user: UserProfile | null;
  onPlaceOrder: (details: {
    name: string;
    email: string;
    phone: string;
    items: any[];
    totalPrice: number;
    discountDetails?: { code: string; amount: number };
  }) => Promise<{ id: string; referenceNumber: string } | null>;
  onNavigateToPortal: () => void;
}

const STATIC_OFFERS = [
  { code: "MINT20", discountPercentage: 20, description: "20% off on premium meals over 1000 BDT", minimumOrder: 1000 },
  { code: "ORGANIC10", discountPercentage: 10, description: "10% off with zero minimum limit", minimumOrder: 0 },
];

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  user,
  onPlaceOrder,
  onNavigateToPortal,
}: CartDrawerProps) {
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "details" | "bkash">("cart");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<typeof STATIC_OFFERS[0] | null>(null);
  const [couponError, setCouponError] = useState("");

  // Customer credentials state (autofilled from Auth profile)
  const [billingName, setBillingName] = useState(user?.name || "");
  const [billingEmail, setBillingEmail] = useState(user?.email || "");
  const [billingPhone, setBillingPhone] = useState(user?.phone || "");
  const [validationError, setValidationError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; referenceNumber: string; totalPrice: number } | null>(null);

  // Sync autofill when user state loads
  React.useEffect(() => {
    if (user) {
      if (!billingName) setBillingName(user.name);
      if (!billingEmail) setBillingEmail(user.email);
      if (!billingPhone) setBillingPhone(user.phone);
    }
  }, [user]);

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (subtotal < appliedCoupon.minimumOrder) return 0;
    return Math.round((subtotal * appliedCoupon.discountPercentage) / 100);
  }, [appliedCoupon, subtotal]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const handleApplyCoupon = (code: string) => {
    setCouponError("");
    const codeUpper = code.trim().toUpperCase();
    const offer = STATIC_OFFERS.find((o) => o.code === codeUpper);
    if (!offer) {
      setCouponError("Invalid voucher code");
      return;
    }
    if (subtotal < offer.minimumOrder) {
      setCouponError(`Minimum order value of ${offer.minimumOrder} BDT required`);
      return;
    }
    setAppliedCoupon(offer);
    setCouponCode("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleProgressToCheckout = () => {
    if (!user) {
      setValidationError("Please register or log in first to proceed with checkout.");
      onNavigateToPortal();
      onClose();
      return;
    }
    setValidationError("");
    if (cartItems.length === 0) return;
    setCheckoutStep("details");
  };

  const handleCompleteOrderSubmission = async () => {
    setValidationError("");
    if (!billingName.trim()) {
      setValidationError("Full Name is required.");
      return;
    }
    if (!billingEmail.trim()) {
      setValidationError("Email Address is required.");
      return;
    }
    if (!billingPhone.trim() || billingPhone.length < 10) {
      setValidationError("A valid mobile phone number is required to coordinates bKash tracker.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = cartItems.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
      }));

      const res = await onPlaceOrder({
        name: billingName,
        email: billingEmail,
        phone: billingPhone,
        items: orderItems,
        totalPrice: finalTotal,
        discountDetails: appliedCoupon ? { code: appliedCoupon.code, amount: discountAmount } : undefined,
      });

      if (res) {
        setCreatedOrder({
          id: res.id,
          referenceNumber: res.referenceNumber,
          totalPrice: finalTotal,
        });
        setCheckoutStep("bkash");
      }
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetCheckout = () => {
    setCreatedOrder(null);
    setCheckoutStep("cart");
    setAppliedCoupon(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-container">
      {/* Black Translucent Backdrop */}
      <div 
        onClick={() => checkoutStep !== "bkash" && onClose()} 
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity" 
      />

      {/* Drawer Body panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-zinc-100 flex flex-col h-full shadow-2xl">
          
          {/* Header Row */}
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
              <h2 className="font-sans text-lg font-bold tracking-tight text-emerald-950">
                {checkoutStep === "cart" && "Your Cart"}
                {checkoutStep === "details" && "Your Details"}
                {checkoutStep === "bkash" && "Manual Payment"}
              </h2>
            </div>
            {checkoutStep !== "bkash" && (
              <button 
                onClick={onClose} 
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 cursor-pointer"
                id="close-cart-drawer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* STEP 1: REVIEW ITEMS */}
          {checkoutStep === "cart" && (
            <div className="flex-1 flex flex-col min-h-0">
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="rounded-full bg-emerald-50 p-4 text-emerald-600">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-zinc-900 text-base">Your shopping cart is empty</h4>
                    <p className="font-sans text-xs text-zinc-400 max-w-xs mt-1">
                      Browse our high-quality organic recipe menu and add dishes to start planning your custom fresh dinner.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Items Scrollable List */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                    {cartItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between border-b border-zinc-50 pb-4"
                        id={`cart-item-${item.id}`}
                      >
                        {/* Img & info */}
                        <div className="flex items-center space-x-3.5 flex-1 pr-4">
                          <img
                            referrerPolicy="no-referrer"
                            src={item.menuItem.imageUrl}
                            alt={item.menuItem.name}
                            className="h-12 w-12 rounded-lg object-cover bg-zinc-50"
                          />
                          <div className="space-y-0.5">
                            <h4 className="font-sans text-xs font-bold text-zinc-900 line-clamp-1">{item.menuItem.name}</h4>
                            <p className="font-sans text-[11px] font-semibold text-emerald-700">{item.menuItem.price} BDT</p>
                          </div>
                        </div>

                        {/* Qty edit section */}
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border border-zinc-200 rounded-full bg-zinc-50 px-1 py-0.5">
                            <button
                              onClick={() => item.quantity > 1 ? onUpdateQty(item.id, item.quantity - 1) : onRemoveItem(item.id)}
                              className="p-1 text-zinc-500 hover:text-emerald-700 cursor-pointer"
                              id={`minus-qty-${item.id}`}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-mono text-xs font-bold w-6 text-center text-zinc-800">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                              className="p-1 text-zinc-500 hover:text-emerald-700 cursor-pointer"
                              id={`plus-qty-${item.id}`}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 rounded-full text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove entire item selection"
                            id={`trash-item-${item.id}`}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing and Coupon Section */}
                  <div className="border-t border-zinc-100 bg-zinc-50/50 p-6 space-y-4">
                    {/* Apply discount code */}
                    <div className="space-y-1.5">
                      <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500">Apply Coupon Code</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Try MINT20, ORGANIC10"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-sans text-xs outline-none focus:border-emerald-500"
                          id="coupon-input"
                        />
                        <button
                          onClick={() => handleApplyCoupon(couponCode)}
                          className="bg-emerald-600 text-white rounded-lg px-4 py-2 font-sans text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                          id="apply-coupon-btn"
                        >
                          Apply
                        </button>
                      </div>
                      
                      {couponError && (
                        <p className="font-sans text-[10px] text-red-500 font-semibold">{couponError}</p>
                      )}

                      {/* Display Applied Voucher */}
                      {appliedCoupon && (
                        <div className="flex items-center justify-between rounded-md bg-emerald-100/75 border border-emerald-200 px-3 py-1.5 text-emerald-800" id="applied-coupon-badge">
                          <span className="font-mono text-xs font-bold leading-none flex items-center space-x-1">
                            <Tag className="h-3 w-3" />
                            <span>Voucher Applied: {appliedCoupon.code}</span>
                          </span>
                          <button onClick={handleRemoveCoupon} className="text-emerald-700 hover:text-red-600 cursor-pointer">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <hr className="border-zinc-200" />

                    {/* Numeric totals layout */}
                    <div className="space-y-2 font-sans text-xs">
                      <div className="flex justify-between text-zinc-500">
                        <span>Items Subtotal</span>
                        <span>{subtotal} BDT</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Discount ({appliedCoupon.code})</span>
                          <span>-{discountAmount} BDT</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-extrabold text-zinc-900 pt-1.5 border-t border-dashed border-zinc-200">
                        <span>Estimated Total</span>
                        <span className="text-emerald-800 font-mono">{finalTotal} BDT</span>
                      </div>
                    </div>

                    {/* CTA Proceed to checkout */}
                    <button
                      onClick={handleProgressToCheckout}
                      className="w-full rounded-xl bg-emerald-600 py-3.5 font-sans text-xs font-bold tracking-wide uppercase text-white shadow-xl shadow-emerald-600/10 hover:bg-emerald-700 hover:shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer"
                      id="proceed-checkout-btn"
                    >
                      <span>Checkout & Diner Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: FILL BILLING DETAIL DETAILS */}
          {checkoutStep === "details" && (
            <div className="flex-1 flex flex-col justify-between p-6">
              <div className="space-y-5">
                <div className="space-y-1">
                  <p className="font-sans text-xs text-zinc-500">Autofilled using your secure user credentials. Please ensure delivery details are correct.</p>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500">Delivery Diner Full Name</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 font-sans text-xs text-zinc-900 outline-none focus:border-emerald-500"
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="e.g. Sheikh Shohan"
                      id="checkout-name-input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500">Receipt Email Address</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 font-sans text-xs text-zinc-900 outline-none focus:border-emerald-500 bg-zinc-50 text-zinc-400"
                      value={billingEmail}
                      disabled
                      placeholder="email@example.com"
                      id="checkout-email-input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500">Mobile Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 font-sans text-xs font-semibold text-zinc-400">+880</span>
                      <input
                        type="tel"
                        className="w-full rounded-xl border border-zinc-200 pl-14 pr-3.5 py-3 font-sans text-xs text-zinc-900 outline-none focus:border-emerald-500"
                        value={billingPhone}
                        onChange={(e) => setBillingPhone(e.target.value)}
                        placeholder="1712345678"
                        id="checkout-phone-input"
                      />
                    </div>
                  </div>
                </div>

                {validationError && (
                  <p className="font-sans text-xs text-red-500 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">{validationError}</p>
                )}
              </div>

              {/* Drawer bottoms */}
              <div className="space-y-3">
                <button
                  onClick={handleCompleteOrderSubmission}
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-emerald-600 py-3.5 font-sans text-xs font-bold tracking-wide uppercase text-white shadow-xl shadow-emerald-600/10 hover:bg-emerald-700 flex items-center justify-center space-x-1.5 cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed"
                  id="checkout-submit-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      <span>Submitting order details...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Order & Pay Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setCheckoutStep("cart")}
                  className="w-full rounded-xl border border-zinc-200 py-3 font-sans text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                  id="checkout-back-btn"
                >
                  Back to Review
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REFS AND MANUAL BKASH DETAILS */}
          {checkoutStep === "bkash" && createdOrder && (
            <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
              <div className="space-y-6">
                
                {/* Visual order code success wrapper */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 text-center space-y-3">
                  <div className="mx-auto block rounded-full bg-emerald-100/80 p-2 text-emerald-600 w-9 h-9 flex items-center justify-center">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-bold text-emerald-950">Order Placed Successfully!</h3>
                    <p className="font-sans text-[11px] text-zinc-500">Wait for chef release. Confirmation code registered.</p>
                  </div>

                  <div className="bg-white border border-emerald-100 rounded-lg p-3">
                    <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-0.5">Payment Reference Number</span>
                    <span className="font-mono text-2xl font-extrabold text-emerald-700 tracking-wider" id="bkash-ref-number">{createdOrder.referenceNumber}</span>
                  </div>
                </div>

                {/* Billing Summary check block */}
                <div className="space-y-2 border-t border-zinc-100 pt-4">
                  <h4 className="font-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500">Order Summary</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Order UID:</span>
                      <span className="font-mono text-[10px] text-zinc-500">{createdOrder.id}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Client email:</span>
                      <span className="font-medium">{billingEmail}</span>
                    </div>
                    <div className="flex justify-between font-bold text-zinc-900 pt-1">
                      <span>Paid total:</span>
                      <span className="text-emerald-800">{createdOrder.totalPrice} BDT</span>
                    </div>
                  </div>
                </div>

                {/* Instruction container block */}
                <div className="p-6 bg-emerald-900 rounded-2xl text-white shadow-lg space-y-4" id="bkash-phone-block">
                  <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest">Payment Method (Manual)</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-200 opacity-80">bKash recipient (Send Money)</p>
                      <p className="text-lg font-mono font-bold text-emerald-300">01721938899</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-100 leading-relaxed border-t border-emerald-805 pt-3">
                    Send exactly <strong className="font-extrabold text-emerald-200 font-mono text-xs">{createdOrder.totalPrice} BDT</strong> to this number. Write your Reference code <strong className="underline text-emerald-300 font-mono font-bold text-xs">{createdOrder.referenceNumber}</strong> in the bKash notes/reference field for instant kitchen validation.
                  </p>
                </div>

              </div>

              {/* Finish drawer checkout button */}
              <button
                onClick={handleResetCheckout}
                className="w-full rounded-xl bg-emerald-600 py-3.5 font-sans text-xs font-bold tracking-wide uppercase text-white shadow-xl shadow-emerald-600/10 hover:bg-emerald-700 hover:shadow-emerald-600/20 flex items-center justify-center space-x-1 cursor-pointer mt-6"
                id="finish-bkash-checkout"
              >
                <span>Finished & Close Tab</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
