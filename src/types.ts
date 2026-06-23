/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
}

export interface CartItem {
  id: string; // matches menuItem.id
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalPrice: number;
  referenceNumber: string;
  paymentStatus: "pending" | "paid";
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  phone: string;
  name: string;
  isAdmin: boolean;
  offersClaimed?: string[];
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  etherealUrl?: string; // link to view sent email
}

export interface Offer {
  id: string;
  code: string;
  discountPercentage: number;
  description: string;
  minimumOrder: number;
}
