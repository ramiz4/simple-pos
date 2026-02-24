# 🍽️ Simple POS: Restaurant Owner's Guide

Welcome to **Simple POS**. This guide will help you get your restaurant up and running with our offline-first, high-performance point-of-sale system.

---

## 🚀 1. Installation & Access

You can access Simple POS in three different ways. Choose the one that best fits your restaurant's setup:

### A. Desktop Application (Recommended)

Best for fixed stations at the counter or bar.

- **Why:** Most stable printing, direct access to your local database, and works 100% offline.
- **How:** Download the latest version for your system from our [GitHub Releases](https://github.com/ramiz4/simple-pos/releases/latest) page.

| Operating System          | File to Download                   |
| :------------------------ | :--------------------------------- |
| **Windows**               | `_x64-setup.exe` (**Recommended**) |
| **macOS (Apple Silicon)** | `_aarch64.dmg` (**Recommended**)   |
| **Linux (Universal)**     | `_amd64.AppImage`                  |
| **Linux (Ubuntu/Debian)** | `_amd64.deb`                       |

### B. Tablet & Mobile (PWA)

Best for servers taking orders at the table.

- **Why:** Portable and easy to use.
- **How:** Open your restaurant's unique URL in Chrome or Safari. Use the "Add to Home Screen" option in your browser to install it as an app icon.
- **Important:** In this mode, data is stored **only on the specific tablet**. If you use multiple tablets, they will each have their own separate data and will not see each other's orders. For a shared system, see **Enterprise On-Premise** below.

### C. Enterprise On-Premise

Best for restaurants with multiple terminals or tablet systems.

- **Multi-Device Sync:** This setup allows all your tablets and desktop stations to share the same data (tables, orders, and products) in real-time.
- **How:** Your technical team can deploy the full system using our Docker setup on a local server machine (Master Station) within your restaurant. All other devices then connect to this local server.

---

## 🛠️ 2. The One-Time Setup

When you first open Simple POS, you will see the **System Setup** screen. This only happens once.

1.  **Create Owner Profile:** Enter a username (e.g., "Owner" or "Manager").
2.  **Set Secure PIN:** Choose a 4-to-8 digit PIN. This PIN gives you full access to all settings and financial reports.
3.  **Finish Setup:** The system will initialize your local database. From this moment on, the app is ready for work even if your internet goes out.

---

## ⚙️ 3. Configuring Your Restaurant

Before taking your first order, go to the **Admin Dashboard** (top right menu) to set up your business:

### 📦 Products & Categories

- Create **Categories** (e.g., Kitchen, Bar, Desserts).
- Add **Products** with their prices.
- Set up **Variants** (e.g., Small/Large) or **Ingredients** (e.g., Extra Cheese).

### 🪑 Table Management

- Define your **Tables** (e.g., "Table 1", "Bar 2").
- Tables are required for "Dine-In" orders so you can track where the food is going.

### 👥 Staff Management

- Create profiles for your Waiters and Cashiers.
- Assign each person their own PIN.
- _Note:_ Staff cannot access your financial reports or product settings unless you give them permission.

### 🖨️ Printer Settings

- Connect your Thermal Receipt Printer.
- Customize your receipt header with your restaurant's name and address.

---

## 📝 4. Daily Operations

### Taking an Order

1.  **Login:** Pick your name and enter your PIN.
2.  **Select Type:** Choose **Dine-In**, **Takeaway**, or **Delivery**.
3.  **Select Table:** (For Dine-In only).
4.  **Add Items:** Tap the products to add them to the cart.
5.  **Pay & Print:** Select the payment method (Cash/Card) and the receipt will print automatically.

### Workspace & Dashboard

- **Active Orders:** View all currently open tables and pending deliveries.
- **End of Day:** View your daily sales totals at a glance to close your register.

---

## 🌐 5. Advanced: Data & Local Backup

Simple POS is **Local-First**. What does this mean for you?

- **No Internet? No Problem:** You can keep taking orders, printing receipts, and managing tables without any internet connection. All data stays on your device.
- **Safety First:** Because data is stored on your device, we recommend using the **Desktop Application** for your main station, as it uses a more robust database (SQLite) than the web browser.
- **Backup:** Regularly export your data from the Admin panel to an external drive to ensure your business records are safe.
- **Local Network Sync (Optional):** If you use the **Enterprise On-Premise** setup, your devices will automatically sync with your local restaurant server even without internet.

---

## 🆘 Support

If you encounter any issues:

1. Restart the application.
2. Check your printer's paper and connection.
3. Visit the **Error Log** in the Admin panel for detailed troubleshooting.
