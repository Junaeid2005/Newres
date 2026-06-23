/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Load environment variables
dotenv.config();

// Load firebase-applet-config dynamically
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
if (!fs.existsSync(configPath)) {
  console.error("firebase-applet-config.json not found in root!");
  process.exit(1);
}
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
    ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
    : getFirestore(firebaseApp);

const app = express();
app.use(express.json());

const PORT = 3000;

// Setup nodemailer transporter
let mailTransporter: any = null;
let etherealUrl: string | null = null;

// Initialize Mailer
async function initMailer() {
  try {
    if (process.env.SMTP_HOST) {
      mailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log("Mailer initialized with environment SMTP server.");
    } else {
      // Create ethereal test account at runtime
      const testAccount = await nodemailer.createTestAccount();
      mailTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      etherealUrl = "https://ethereal.email";
      console.log(`Mailer initialized with Ethereal SMTP - Account: ${testAccount.user}`);
    }
  } catch (error) {
    console.error("Failed to initialize SMTP transporter. Logs will be stored in Firestore but emails won't send over SMTP.", error);
  }
}

initMailer();

// Seed Menu Items dynamically
const INITIAL_MENU_ITEMS = [
  {
    name: "Mint-Glazed Lamb Chops",
    price: 1200,
    description: "Tender double-rib lamb chops finished in a sweet garlic mint glaze and served with garden green beans.",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    category: "Entrées",
    isAvailable: true
  },
  {
    name: "Pistachio Pesto Gnocchi",
    price: 750,
    description: "Soft potato gnocchi tossed in a fragrant basil and toasted pistachio pesto, topped with whipped burrata cheese.",
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
    category: "Pasta",
    isAvailable: true
  },
  {
    name: "Avocado Garden Salad",
    price: 500,
    description: "Crisp watercress, butterhead lettuce, creamy avocado slices, cucumber, pumpkin seeds, and clean green goddess dressing.",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    category: "Salads",
    isAvailable: true
  },
  {
    name: "Savory Slim Green Burger",
    price: 680,
    description: "Gourmet plant green herb patty with fresh romaine, green mustard, and dynamic salt-crusted potato wedges.",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    category: "Burgers",
    isAvailable: true
  },
  {
    name: "Matcha White Cocoa Mousse",
    price: 420,
    description: "Japanese stone-ground green tea whipped mousse layered with soft vanilla sponge cake, finished with white chocolate curls.",
    imageUrl: "https://images.unsplash.com/photo-1536680465769-236b47ee7b2a?w=600&auto=format&fit=crop&q=80",
    category: "Desserts",
    isAvailable: true
  },
  {
    name: "Mint Key Lime Cooler",
    price: 280,
    description: "Fresh forest mint muddled with fresh lime juice, cane sugar, sparkling soda elixir, and crushed diamond ice.",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
    category: "Drinks",
    isAvailable: true
  }
];

async function seedDatabaseIfEmpty() {
  try {
    const menuColRef = collection(db, "menu_items");
    const snapshot = await getDocs(menuColRef);
    if (snapshot.empty) {
      console.log("Menu items collection is empty. Seeding INITIAL_MENU_ITEMS into Firestore...");
      for (const item of INITIAL_MENU_ITEMS) {
        await addDoc(menuColRef, item);
      }
      console.log("Successfully seeded database menu items.");
    } else {
      console.log(`Database already has ${snapshot.size} menu items.`);
    }
  } catch (err) {
    console.error("Error seeding initial db:", err);
  }
}

// Helper to send transactions emails and record logs
async function sendAndLogEmail(to: string, userName: string, orderId: string, subject: string, htmlContent: string) {
  let finalEtherealUrl = etherealUrl || "";
  try {
    if (mailTransporter) {
      const mailOptions = {
        from: '"Savory Green Restaurant" <no-reply@savorygreen.com>',
        to: to,
        subject: subject,
        html: htmlContent,
      };
      const info = await mailTransporter.sendMail(mailOptions);
      if (etherealUrl && info) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          finalEtherealUrl = previewUrl;
          console.log(`Ethereal email sent! Preview URL: ${previewUrl}`);
        }
      } else {
        console.log(`Standard SMTP email dispatched to ${to}`);
      }
    } else {
      console.log(`Dry-run log. Transporter unlinked. To: ${to}, Subject: ${subject}`);
    }
  } catch (err) {
    console.error("Mailer failed to deliver SMTP email. Logging locally in Firestore anyway.", err);
  }

  // Save the record to the email_logs collection so we can display it dynamically in our portal
  try {
    await addDoc(collection(db, "email_logs"), {
      to,
      userName,
      orderId,
      subject,
      body: htmlContent,
      sentAt: new Date().toISOString(),
      etherealUrl: finalEtherealUrl || null,
    });
  } catch (err) {
    console.error("Failed to write to email_logs collection", err);
  }
}

// ---------------- API ENDPOINTS ----------------

// GET MENU
app.get("/api/menu", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "menu_items"));
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADD MENU ITEM (ADMIN)
app.post("/api/admin/menu", async (req, res) => {
  try {
    const { name, price, description, imageUrl, category, isAvailable } = req.body;
    if (!name || !price || !description || !imageUrl || !category) {
      return res.status(400).json({ error: "Missing required menu item fields" });
    }
    const docRef = await addDoc(collection(db, "menu_items"), {
      name,
      price: Number(price),
      description,
      imageUrl,
      category,
      isAvailable: isAvailable !== false,
    });
    res.json({ id: docRef.id, message: "Menu item created successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// EDIT MENU ITEM (ADMIN)
app.put("/api/admin/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, imageUrl, category, isAvailable } = req.body;
    const itemRef = doc(db, "menu_items", id);
    await updateDoc(itemRef, {
      name,
      price: Number(price),
      description,
      imageUrl,
      category,
      isAvailable: isAvailable !== false,
    });
    res.json({ id, message: "Menu item updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE MENU ITEM (ADMIN)
app.delete("/api/admin/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDoc(doc(db, "menu_items", id));
    res.json({ id, message: "Menu item deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SUBMIT ORDER
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, userName, userEmail, userPhone, items, totalPrice } = req.body;
    if (!userId || !userEmail || !items || !items.length) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    // Generate reference code
    const referenceNumber = Math.floor(1000 + Math.random() * 9000).toString();

    const newOrder = {
      userId,
      userName: userName || "Valued Diners",
      userEmail,
      userPhone: userPhone || "",
      items,
      totalPrice: Number(totalPrice),
      referenceNumber,
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "orders"), newOrder);
    const orderId = docRef.id;

    // Send automatic confirmation email to the user
    const itemsListHtml = items
      .map(
        (i: any) =>
          `<li><strong>${i.name}</strong> x ${i.quantity} @ ${i.price} BDT - ${
            i.price * i.quantity
          } BDT</li>`
      )
      .join("");

    const subject = `🌱 Order Confirmation - Savory Green (#Ref: ${referenceNumber})`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #15803d; margin-bottom: 4px;">Savory Green Restaurant</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Pristine Organic Culinary Pleasures</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <h3 style="color: #1e293b;">Thank You for Your Order, ${newOrder.userName}!</h3>
        <p>We are delighted to prepare your healthy meal. Your order has been registered securely.</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 0 0 8px 0;"><strong>Payment Reference Number:</strong> <span style="font-size: 18px; color: #16a34a; font-weight: bold; letter-spacing: 1px;">${referenceNumber}</span></p>
          <p style="margin: 0;"><strong>Total Price:</strong> ${totalPrice} BDT</p>
        </div>

        <h4 style="color: #1e293b; margin-bottom: 8px;">Ordered Dishes:</h4>
        <ul style="padding-left: 20px; line-height: 1.6; color: #334155;">
          ${itemsListHtml}
        </ul>

        <div style="border: 1px dashed #b91c1c; background-color: #fef2f2; padding: 16px; border-radius: 6px; margin-top: 24px;">
          <h4 style="color: #991b1b; margin: 0 0 6px 0;">Manual bKash Payment Instructions:</h4>
          <p style="margin: 0 0 8px 0; font-size: 14px;">To cook and release your order, please cash-in or send money to our official bKash account:</p>
          <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>bKash Number:</strong> <span style="color: #b91c1c; font-weight: bold;">01721938899</span></p>
          <p style="margin: 0; font-size: 13px; color: #7f1d1d;"><strong>Critical:</strong> Please write <strong>${referenceNumber}</strong> as the payment description or transaction reference, otherwise we cannot clear the payment.</p>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; text-align: center;">Savory Green Restaurant, All Rights Reserved.</p>
      </div>
    `;

    // Dispatch background email without blocking the immediate JSON response to make user experience fast
    sendAndLogEmail(userEmail, newOrder.userName, orderId, subject, htmlContent);

    res.json({ id: orderId, referenceNumber, ...newOrder });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL ORDERS (ADMIN)
app.get("/api/admin/orders", async (req, res) => {
  try {
    const ordersCol = collection(db, "orders");
    const snapshot = await getDocs(ordersCol);
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort manually by createdAt descending
    orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MARK ORDER AS PAID (ADMIN)
app.post("/api/admin/orders/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, "orders", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = docSnap.data();
    await updateDoc(docRef, { paymentStatus: "paid" });

    // Send payment received email to the user
    const subject = `✅ Payment Cleared! Your meal is being prepared - Savory Green (#Ref: ${orderData.referenceNumber})`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #15803d; margin-bottom: 4px;">Savory Green Restaurant</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Payment Settlement Service</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #15803d; margin: 0 0 10px 0; font-size: 24px;">Confirming Payment Success</h1>
          <p style="color: #166534; font-size: 15px; margin: 0;">Your payment for Order <strong>${id}</strong> (Reference <strong>${orderData.referenceNumber}</strong>) of <strong>${orderData.totalPrice} BDT</strong> has been successfully received and verified by our auditing server!</p>
        </div>

        <p>Dear ${orderData.userName || "Valued Diner"},</p>
        <p>Our master chefs have received the green light and are actively preparing your freshly seasoned organic platter. Your order is prioritised for instant kitchen assembly and rapid dispatch.</p>

        <p style="margin-top: 30px;">If you have any further questions, simple contact our support line or reference the manual bKash tracker inside your personal profile dashboard.</p>
        
        <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; text-align: center;">Savory Green Restaurant, All Rights Reserved.</p>
      </div>
    `;

    sendAndLogEmail(orderData.userEmail, orderData.userName, id, subject, htmlContent);

    res.json({ success: true, message: "Order payment updated together with dispatched notification" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET EMAIL LOGS (FOR USER & ADMIN VIEW)
app.get("/api/emails", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "email_logs"));
    const logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort by sentAt descending
    logs.sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET DASHBOARD STATS (ADMIN)
app.get("/api/admin/stats", async (req, res) => {
  try {
    const ordersCol = collection(db, "orders");
    const snapshot = await getDocs(ordersCol);
    const orders = snapshot.docs.map((d) => d.data());

    let totalOrders = orders.length;
    let totalRevenue = 0;
    // Calculate total users by distinct emails
    const uniqueEmails = new Set();

    orders.forEach((o: any) => {
      if (o.paymentStatus === "paid") {
        totalRevenue += o.totalPrice;
      }
      if (o.userEmail) {
        uniqueEmails.add(o.userEmail);
      }
    });

    res.json({
      totalOrders,
      totalRevenue,
      totalUsers: uniqueEmails.size || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- VITE / DEPLOYMENT GATEWAY ----------------

const startServer = async () => {
  // Seed the empty DB on reload
  await seedDatabaseIfEmpty();

  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for rendering and local dev routing integration
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite developer middleware server.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Critical: Failed to launch backend wrapper:", error);
});
