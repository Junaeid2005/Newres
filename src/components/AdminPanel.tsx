/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { MenuItem, Order, EmailLog, UserProfile } from "../types";
import {
  TrendingUp,
  Users,
  UtensilsCrossed,
  DollarSign,
  CheckCircle,
  Plus,
  Trash,
  Edit2,
  Mail,
  ListOrdered,
  Eye,
  Check,
  AlertCircle,
  Clock,
  Loader2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  user: UserProfile | null;
  menuItems: MenuItem[];
  orders: Order[];
  isLoadingOrders: boolean;
  onRefreshOrders: () => void;
  onMarkAsPaid: (id: string) => Promise<boolean>;
  onAddMenuItem: (item: Omit<MenuItem, "id">) => Promise<{ success: boolean; error?: string }>;
  onEditMenuItem: (id: string, item: Omit<MenuItem, "id">) => Promise<{ success: boolean; error?: string }>;
  onDeleteMenuItem: (id: string) => Promise<boolean>;
}

const getTroubleshootingInstructions = (error: string) => {
  const err = error.toLowerCase();
  if (err.includes("permission") || err.includes("insufficient") || err.includes("denied")) {
    return {
      title: "Firebase Security Rules Modification Needed",
      steps: [
        "Go to your Firebase Console for the project 'savory-9163f'.",
        "Select 'Firestore Database' under 'Build' on the left menu.",
        "Click the 'Rules' tab at the top of the interface.",
        "Click 'Edit' and update the allow statement to: allow read, write: if true; (you can harden this later) or publish the rules we deployed.",
        "Click the blue 'Publish' button to save."
      ]
    };
  }
  if (err.includes("not found") || err.includes("not-found") || err.includes("database") || err.includes("dataset") || err.includes("project")) {
    return {
      title: "Firestore Database Is Not Processed / Initialized",
      steps: [
        "Your new Firebase Project 'savory-9163f' doesn't have a Cloud Firestore database started yet.",
        "Go to your Firebase Console at: https://console.firebase.google.com/project/savory-9163f/firestore",
        "Click the large 'Create database' button.",
        "Select '(default)' as the database ID, pick any hosting location, and start in 'Test mode'.",
        "Once created, reload this browser window and register the food dish again! It will seed the database successfully."
      ]
    };
  }
  if (err.includes("auth") || err.includes("login") || err.includes("operation-not-allowed")) {
    return {
      title: "Email/Password Registration Disabled",
      steps: [
        "Open the Firebase Console for your project 'savory-9163f'.",
        "Select 'Authentication' under 'Build' on the left menu.",
        "Go to the 'Sign-in method' tab at the top of the page.",
        "Click 'Add new provider', select 'Email/Password', of enable both settings ('Email/Password' and optionally 'Email link'), then click Save."
      ]
    };
  }
  return {
    title: "Database Initialization Connection Check",
    steps: [
      "Ensure you have a stable network connection.",
      "Check that your Cloud Firestore database of project 'savory-9163f' is fully created in your Firebase Console.",
      "Ensure that its security rules are set up to permit public reads and writes for testing during this sandbox phase."
    ]
  };
};

export default function AdminPanel({
  user,
  menuItems,
  orders,
  isLoadingOrders,
  onRefreshOrders,
  onMarkAsPaid,
  onAddMenuItem,
  onEditMenuItem,
  onDeleteMenuItem,
}: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<"orders" | "menu" | "emails">("orders");
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Stats
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o?.paymentStatus === "paid")
    .reduce((sum, o) => sum + (o?.totalPrice || 0), 0);
  const totalUsers = new Set(orders.map((o) => o?.userEmail)).size;

  // Add Item State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormPrice, setNewFormPrice] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");
  const [newFormImageUrl, setNewFormImageUrl] = useState("");
  const [newFormCategory, setNewFormCategory] = useState("Entrées");
  const [newFormAvailable, setNewFormAvailable] = useState(true);

  // Edit Item State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormName, setEditFormName] = useState("");
  const [editFormPrice, setEditFormPrice] = useState("");
  const [editFormDescription, setEditFormDescription] = useState("");
  const [editFormImageUrl, setEditFormImageUrl] = useState("");
  const [editFormCategory, setEditFormCategory] = useState("");
  const [editFormAvailable, setEditFormAvailable] = useState(true);

  // Email detail modal
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // Loading states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load emails
  const fetchEmails = async () => {
    setIsLoadingEmails(true);
    try {
      const res = await fetch("/api/emails");
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data);
      }
    } catch (err) {
      console.error("Failed to load email logs:", err);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  useEffect(() => {
    if (adminTab === "emails") {
      fetchEmails();
    }
  }, [adminTab]);

  // Handle Mark Paid
  const handleTriggerMarkPaid = async (orderId: string) => {
    setActionInProgress(orderId);
    const success = await onMarkAsPaid(orderId);
    if (success) {
      onRefreshOrders();
    }
    setActionInProgress(null);
  };

  // Add Item Handle
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanelError("");
    if (!newFormName || !newFormPrice || !newFormDescription || !newFormImageUrl) {
      setPanelError("All fields are required to assemble an organic recipe card.");
      return;
    }
    setActionInProgress("addItem");
    const result = await onAddMenuItem({
      name: newFormName,
      price: Number(newFormPrice),
      description: newFormDescription,
      imageUrl: newFormImageUrl,
      category: newFormCategory,
      isAvailable: newFormAvailable,
    });
    if (result.success) {
      // clear
      setNewFormName("");
      setNewFormPrice("");
      setNewFormDescription("");
      setNewFormImageUrl("");
      setNewFormCategory("Entrées");
      setNewFormAvailable(true);
      setIsAddingItem(false);
      setPanelError("");
    } else {
      setPanelError(result.error || "Failed to register food recipe in the database. Please check connection.");
    }
    setActionInProgress(null);
  };

  // Edit Item Handle
  const handleEditSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setActionInProgress(`edit_${id}`);
    const result = await onEditMenuItem(id, {
      name: editFormName,
      price: Number(editFormPrice),
      description: editFormDescription,
      imageUrl: editFormImageUrl,
      category: editFormCategory,
      isAvailable: editFormAvailable,
    });
    if (result.success) {
      setEditingItemId(null);
      setPanelError("");
    } else {
      setPanelError(result.error || "Failed to update recipe in the database.");
    }
    setActionInProgress(null);
  };

  const handleStartEditing = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditFormName(item.name);
    setEditFormPrice(item.price.toString());
    setEditFormDescription(item.description);
    setEditFormImageUrl(item.imageUrl);
    setEditFormCategory(item.category);
    setEditFormAvailable(item.isAvailable);
  };

  const handleDeleteItem = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }
    setActionInProgress(`delete_${id}`);
    await onDeleteMenuItem(id);
    setActionInProgress(null);
    setDeleteConfirmId(null);
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="mx-auto max-w-md py-20 px-4 text-center space-y-4" id="admin-unauth-container">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="font-sans text-xl font-extrabold text-slate-950">Access Restricted</h2>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">
          This system is restricted to administrators. Run login as admin@savorygreen.com or update your profile record manually in Firestore.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10" id="admin-panel-container">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
            <span className="w-1.5 h-7 bg-emerald-500 rounded-full" />
            Savory Green Admin Desk
          </h1>
          <p className="font-sans text-sm text-slate-500">
            Fulfill orders, adjust the kitchen menu, and track automatic transactional emails.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-50 border border-slate-200/60 p-1.5 rounded-full space-x-1.5 w-max">
          <button
            onClick={() => setAdminTab("orders")}
            className={`font-sans text-xs font-bold px-4.5 py-2 rounded-full cursor-pointer transition-all ${
              adminTab === "orders" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-650 hover:text-emerald-700"
            }`}
            id="admin-tab-orders"
          >
            Orders Summary
          </button>
          <button
            onClick={() => setAdminTab("menu")}
            className={`font-sans text-xs font-bold px-4.5 py-2 rounded-full cursor-pointer transition-all ${
              adminTab === "menu" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-650 hover:text-emerald-700"
            }`}
            id="admin-tab-menu"
          >
            Manage Food Menu
          </button>
          <button
            onClick={() => setAdminTab("emails")}
            className={`font-sans text-xs font-bold px-4.5 py-2 rounded-full cursor-pointer transition-all ${
              adminTab === "emails" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-650 hover:text-emerald-700"
            }`}
            id="admin-tab-emails"
          >
            Sent Email Logs
          </button>
        </div>
      </div>

      {/* STATS COUNT GRID */}
      {adminTab === "orders" && (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-3" id="admin-stats-grid">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex items-center space-x-4">
            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
              <ListOrdered className="h-6 w-6" />
            </div>
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Placements</span>
              <p className="font-mono text-2xl font-bold text-slate-800" id="stat-total-orders">{totalOrders}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex items-center space-x-4">
            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Cleared Revenue</span>
              <p className="font-mono text-2xl font-extrabold text-emerald-700" id="stat-total-rev">{totalRevenue} BDT</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex items-center space-x-4">
            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Unique Diners</span>
              <p className="font-mono text-2xl font-bold text-slate-800" id="stat-total-users">{totalUsers}</p>
            </div>
          </div>
        </section>
      )}      {/* TAB SUB-PANE: ORDER MANAGEMENT */}
      {adminTab === "orders" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6" id="admin-orders-tab">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-base font-bold text-slate-900">Diner Placements Control Table</h3>
            <button
              onClick={onRefreshOrders}
              className="font-sans text-xs font-bold text-emerald-605 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Force Sync Orders
            </button>
          </div>

          {isLoadingOrders ? (
            <div className="flex flex-col items-center justify-center py-20 text-emerald-700 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="font-sans text-xs text-slate-400">Loading order books...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <p className="font-sans text-xs text-slate-400">Database order collections are empty inside Google Cloud.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs leading-normal">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="pb-3 text-left">Diner Contact</th>
                    <th className="pb-3 text-left">Ordered Dishes</th>
                    <th className="pb-3 text-left">bKash Ref</th>
                    <th className="pb-3 text-left">Total Price</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Audit Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50" id={`row-order-${o.id}`}>
                      {/* Customer contact columns */}
                      <td className="py-4.5 pr-2">
                        <div className="font-bold text-slate-800">{o.userName}</div>
                        <div className="text-slate-500 font-medium">{o.userEmail}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{o.userPhone}</div>
                      </td>

                      {/* Dishes summary bullet list */}
                      <td className="py-4.5 max-w-xs pr-4 text-slate-650">
                        <ul className="space-y-0.5 list-disc list-inside">
                          {o.items.map((i: any, idx: number) => (
                            <li key={idx} className="line-clamp-1">
                              <strong>{i.name}</strong> x{i.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>

                      {/* bKash unique reference number */}
                      <td className="py-4.5 pr-2 font-mono font-bold text-emerald-800 text-xs">
                        {o.referenceNumber}
                      </td>

                      {/* Total bill price */}
                      <td className="py-4.5 pr-2 font-mono font-extrabold text-slate-900 text-sm">
                        {o.totalPrice} BDT
                      </td>

                      {/* Payment Status badge */}
                      <td className="py-4.5 text-center pr-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            o.paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700 animate-pulse"
                          }`}
                          id={`status-badge-${o.id}`}
                        >
                          {o.paymentStatus === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>

                      {/* Action mark as paid trigger button */}
                      <td className="py-4.5 text-right pl-2">
                        {o.paymentStatus === "pending" ? (
                          <button
                            onClick={() => handleTriggerMarkPaid(o.id)}
                            disabled={actionInProgress === o.id}
                            className="rounded-xl bg-emerald-600 px-3.5 py-1.5 font-bold text-white hover:bg-emerald-700 cursor-pointer text-[11px] tracking-wide inline-flex items-center space-x-1"
                            id={`mark-paid-btn-${o.id}`}
                          >
                            {actionInProgress === o.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Mark as Paid</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="font-semibold text-emerald-750 text-[11px] inline-flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mr-1 inline" />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB SUB-PANE: MENU MANAGEMENT */}
      {adminTab === "menu" && (
        <div className="space-y-6" id="admin-menu-tab">
          {/* Menu Title controls */}
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-base font-bold text-slate-900">Manage Restaurant Dishes</h3>
            {!isAddingItem && (
              <button
                onClick={() => setIsAddingItem(true)}
                className="group flex items-center space-x-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-sans text-xs font-bold text-white shadow-sm hover:bg-emerald-700 cursor-pointer transition-all"
                id="add-item-trigger-btn"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Food Item</span>
              </button>
            )}
          </div>          {/* ADD ITEM CARD DRAWER/FORM */}
          {isAddingItem && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-100 bg-emerald-50/20 p-6 shadow-xs space-y-4"
              id="add-item-form-container"
            >
              <h4 className="font-sans font-bold text-slate-850 text-sm">Design Curated Healthy Dish Card</h4>
              
              {panelError && (() => {
                const instructions = getTroubleshootingInstructions(panelError);
                return (
                  <div className="space-y-3" id="admin-troubleshoot-container">
                    <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5 flex items-start space-x-2 text-rose-700 font-sans text-xs">
                      <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Error message from Firebase:</p>
                        <p className="font-mono mt-1 text-[11px] bg-white/60 p-2 rounded border border-rose-100">{panelError}</p>
                      </div>
                    </div>

                    {instructions && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-150 p-4 text-emerald-950 font-sans text-xs space-y-2">
                        <p className="font-extrabold flex items-center gap-1.5 text-[13px]">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          🛠️ Quick Setup: {instructions.title}
                        </p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Since the application is configured to target your custom Firebase project <strong className="text-emerald-800">savory-9163f</strong>, you must configure the Firestore database for this project so the server can record items successfully.
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-700 mt-2 font-medium">
                          {instructions.steps.map((step, idx) => (
                            <li key={idx} className="leading-relaxed pl-1">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Dish Title Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mint infused Lamb Chops"
                    value={newFormName}
                    onChange={(e) => setNewFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-sans text-xs outline-none focus:border-emerald-500"
                    id="new-item-name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Retail Price (BDT)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1200"
                    value={newFormPrice}
                    onChange={(e) => setNewFormPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-sans text-xs outline-none focus:border-emerald-500 font-mono"
                    id="new-item-price"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Category Tag</label>
                  <select
                    value={newFormCategory}
                    onChange={(e) => setNewFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-sans text-xs outline-none focus:border-emerald-500"
                    id="new-item-cat"
                  >
                    {["Entrées", "Pasta", "Salads", "Burgers", "Desserts", "Drinks"].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Unsplash Photo URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newFormImageUrl}
                    onChange={(e) => setNewFormImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-sans text-xs outline-none focus:border-emerald-500"
                    id="new-item-img"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end pb-3">
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFormAvailable}
                      onChange={(e) => setNewFormAvailable(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      id="new-item-avail"
                    />
                    <span className="font-sans text-xs font-semibold text-slate-700">Dish Available in Kitchen</span>
                  </label>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">Aesthetic Menu Description</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Describe delicious recipe ingredients, aroma, spices, plating design..."
                    value={newFormDescription}
                    onChange={(e) => setNewFormDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-sans text-xs outline-none focus:border-emerald-500"
                    id="new-item-desc"
                  />
                </div>

                <div className="md:col-span-3 flex space-x-2 pt-2 justify-end">
                  <button
                    type="submit"
                    disabled={actionInProgress === "addItem"}
                    className="rounded-xl bg-emerald-600 px-4.5 py-2 font-sans text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer flex items-center"
                    id="save-new-item-btn"
                  >
                    {actionInProgress === "addItem" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                        <span>Registering item...</span>
                      </>
                    ) : (
                      "Register Recipe"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="rounded-xl border border-slate-250 px-4.5 py-2 font-sans text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* GRID OF DISHES */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-white overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all"
                id={`manage-item-${item.id}`}
              >
                {editingItemId === item.id ? (
                  /* INLINE EDIT FORM */
                  <form
                    onSubmit={(e) => handleEditSubmit(e, item.id)}
                    className="p-5 space-y-3 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-zinc-400">Dish Name</label>
                        <input
                          type="text"
                          required
                          value={editFormName}
                          onChange={(e) => setEditFormName(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-2 py-1 font-sans text-xs outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-zinc-400">Price (BDT)</label>
                        <input
                          type="number"
                          required
                          value={editFormPrice}
                          onChange={(e) => setEditFormPrice(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-2 py-1 font-sans text-xs outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-zinc-400">Menu Category</label>
                        <select
                          value={editFormCategory}
                          onChange={(e) => setEditFormCategory(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-2 py-1 font-sans text-xs outline-none focus:border-emerald-500"
                        >
                          {["Entrées", "Pasta", "Salads", "Burgers", "Desserts", "Drinks"].map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-zinc-400">Photo URL</label>
                        <input
                          type="url"
                          required
                          value={editFormImageUrl}
                          onChange={(e) => setEditFormImageUrl(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-2 py-1 font-sans text-xs outline-none focus:border-emerald-500 text-[10px]"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-zinc-400">Plating Description</label>
                        <textarea
                          rows={2}
                          required
                          value={editFormDescription}
                          onChange={(e) => setEditFormDescription(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-2.5 py-1 font-sans text-xs outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="pt-1 select-none">
                        <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFormAvailable}
                            onChange={(e) => setEditFormAvailable(e.target.checked)}
                            className="rounded border-zinc-350 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                          />
                          <span className="font-sans text-xs text-zinc-700">Dish Available</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex space-x-1.5 pt-4">
                      <button
                        type="submit"
                        disabled={actionInProgress === `edit_${item.id}`}
                        className="flex-1 rounded-lg bg-emerald-600 py-1.5 font-sans text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer text-center flex items-center justify-center"
                        id={`save-edit-${item.id}`}
                      >
                        {actionInProgress === `edit_${item.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className="flex-1 rounded-lg border border-zinc-200 py-1.5 font-sans text-xs font-bold text-zinc-650 hover:bg-zinc-55 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* STATIC PREVIEW WITH CONTROL BUTTONS */
                  <div className="flex flex-col h-full justify-between flex-1">
                    <div>
                      {/* Photo Header */}
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-50">
                        <img
                          referrerPolicy="no-referrer"
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5 rounded-full bg-white/95 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 shadow-sm border border-emerald-100">
                          {item.price} BDT
                        </div>
                        
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-3xs flex items-center justify-center font-sans font-bold text-white text-[10px] uppercase tracking-wider">
                            Kitchen Blocked
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="p-4 space-y-2">
                        <div>
                          <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-emerald-600">{item.category}</span>
                          <h4 className="font-sans text-base font-bold text-zinc-900 group-hover:text-emerald-800 leading-tight">{item.name}</h4>
                        </div>
                        <p className="font-sans text-xs text-zinc-550 leading-relaxed line-clamp-3">{item.description}</p>
                      </div>
                    </div>

                    {/* Button action buttons */}
                    <div className="p-4 pt-1.5 border-t border-zinc-50 flex space-x-2">
                      <button
                        onClick={() => handleStartEditing(item)}
                        className="flex-1 rounded-xl border border-zinc-200 py-2.5 font-sans text-xs font-bold text-zinc-650 hover:bg-zinc-50 cursor-pointer flex items-center justify-center space-x-1"
                        id={`edit-trigger-${item.id}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={actionInProgress === `delete_${item.id}`}
                        className={`rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          deleteConfirmId === item.id
                            ? "bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 px-4"
                            : "border border-rose-100 text-rose-500 hover:bg-rose-50 px-3"
                        }`}
                        title="Delete entire item selection"
                        id={`delete-btn-${item.id}`}
                      >
                        {actionInProgress === `delete_${item.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                        ) : deleteConfirmId === item.id ? (
                          <span>Confirm?</span>
                        ) : (
                          <Trash className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {deleteConfirmId === item.id && (
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded-xl border border-zinc-200 px-3 py-2.5 font-sans text-xs font-bold text-zinc-500 hover:bg-zinc-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB SUB-PANE: Live mail delivery audit logs */}
      {adminTab === "emails" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6" id="admin-emails-tab">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-sans text-base font-bold text-slate-900 flex items-center space-x-1.5">
                <Mail className="h-4.5 w-4.5 text-emerald-600" />
                <span>Simulated Email Delivery Dispatch Console</span>
              </h3>
              <p className="font-sans text-xs text-slate-400 mt-1 max-w-xl">
                Savory Green’s automatic dispatch logs. Displays real SMTP Ethereal preview links below so you can inspect custom rendered emails directly.
              </p>
            </div>
            <button
              onClick={fetchEmails}
              disabled={isLoadingEmails}
              className="font-sans text-xs font-bold text-emerald-650 hover:text-emerald-800 cursor-pointer disabled:text-zinc-350"
            >
              {isLoadingEmails ? "Syncing..." : "Sync Logs"}
            </button>
          </div>

          {isLoadingEmails ? (
            <div className="flex flex-col items-center justify-center py-20 text-emerald-700 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="font-sans text-xs text-zinc-400">Loading delivery logs...</p>
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-150 max-w-sm mx-auto">
              <p className="font-sans text-xs text-zinc-400">No email alerts have been dispatched yet. Place an order to begin audit tracks.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emailLogs.map((log) => {
                const isExpanded = expandedEmailId === log.id;
                return (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-zinc-100 bg-zinc-50/20 hover:border-emerald-100 transition-all overflow-hidden"
                    id={`email-log-${log.id}`}
                  >
                    {/* Log Header Row */}
                    <div
                      onClick={() => setExpandedEmailId(isExpanded ? null : log.id)}
                      className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-sans text-zinc-400 uppercase font-bold text-[8px] block">TO RECORD</span>
                        <div className="font-semibold text-zinc-800">{log.userName} ({log.to})</div>
                      </div>

                      <div className="space-y-1 flex-1 min-w-[200px]">
                        <span className="font-sans text-zinc-400 uppercase font-bold text-[8px] block">SUBJECT LINE</span>
                        <div className="font-medium text-zinc-700 font-sans leading-none">{log.subject}</div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-sans text-zinc-400 uppercase font-bold text-[8px] block">DISPATCHED TIME</span>
                        <div className="font-mono text-zinc-500 font-medium">{new Date(log.sentAt).toLocaleTimeString()}</div>
                      </div>

                      <div className="flex items-center space-x-3 pl-3">
                        {log.etherealUrl && (
                          <a
                            href={log.etherealUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-lg bg-emerald-50 px-2.5 py-1.5 font-sans text-[10px] font-bold text-emerald-700 hover:bg-emerald-150 inline-flex items-center space-x-0.5 border border-emerald-100/40"
                          >
                            <span>Ethereal Preview</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        <ChevronDown className={`h-4.5 w-4.5 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {/* EXPANDED MARKUP INLINE VIEW */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-zinc-100 bg-white"
                        >
                          <div className="p-6">
                            <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-2">Rendered Email Body Content:</span>
                            <div
                              dangerouslySetInnerHTML={{ __html: log.body }}
                              className="border border-zinc-100 rounded-xl p-5 bg-zinc-50 max-h-80 overflow-y-auto"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
