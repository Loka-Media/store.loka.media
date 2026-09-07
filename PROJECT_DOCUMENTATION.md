# 🚀 LOKA MEDIA — COMPLETE PROJECT DOCUMENTATION

> **Platform Tagline:** Monetization Made Easy  
> **Repository:** `store.loka.media`  
> **Architecture:** Modern Full-Stack Creator Print-on-Demand (POD) Marketplace  
> **Last Updated:** September 2026  

---

## 📋 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture & Technology Stack](#2-system-architecture--technology-stack)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Financial Model & Pricing Engine](#4-financial-model--pricing-engine)
5. [Core Feature Modules](#5-core-feature-modules)
   - [A. Creator Catalog & Fast Search](#a-creator-catalog--fast-search)
   - [B. Unified 2D/3D Canvas Design Editor](#b-unified-2d3d-canvas-design-editor)
   - [C. Creator Earnings & Wallet System](#c-creator-earnings--wallet-system)
   - [D. Multi-Country Payout Settings](#d-multi-country-payout-settings)
   - [E. Admin Management Dashboard](#e-admin-management-dashboard)
6. [API Routes & External Integrations](#6-api-routes--external-integrations)
7. [Environment Configuration & Deployment](#7-environment-configuration--deployment)
8. [Testing & Quality Assurance Guide](#8-testing--quality-assurance-guide)

---

## 1. Executive Summary

**Loka Media (`store.loka.media`)** is a state-of-the-art Print-on-Demand (POD) creator e-commerce platform. It empowers digital creators, designers, and brands to monetize their artwork by instantly creating, customizing, pricing, and selling custom apparel and lifestyle products globally without holding physical inventory.

### Key Highlights:
- **Zero Inventory Risk**: Orders are fulfilled automatically via Printify.
- **Dynamic Pricing Engine**: Automated profit distribution between Platform Fee (5%), Creator Net Earnings, Printify Wholesale Costs, and Stripe Processing Fees.
- **Unified 2D & 3D PDP Editor**: Interactive design canvas with real-time 3D mockup previews.
- **Multi-Country Payout System**: Encrypted bank details support for US (Routing Number), India (IFSC Code), UK, EU, Canada, and global Stripe Connect payouts.
- **High-Performance Architecture**: Sub-50ms catalog responses for 2,349+ products with smart client-side pagination.

---

## 2. System Architecture & Technology Stack

```
                                  ┌───────────────────────────────┐
                                  │      Client (Next.js 15)      │
                                  └──────────────┬────────────────┘
                                                 │
                        ┌────────────────────────┼────────────────────────┐
                        ▼                        ▼                        ▼
               ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
               │ Next.js Routes │       │ Backend API    │       │ Printify API   │
               │ (App Router)   │       │ (Express/DB)   │       │ (Catalog/POD)  │
               └───────┬────────┘       └───────┬────────┘       └────────────────┘
                       │                        │
                       ▼                        ▼
               ┌────────────────┐       ┌────────────────┐
               │ Stripe Gateway │       │ PostgreSQL DB  │
               │ (Express/Card) │       │ (DigitalOcean) │
               └────────────────┘       └────────────────┘
```

### Core Stack:
- **Framework**: Next.js 15 (App Router, Turbopack) & React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4, Vanilla CSS Design System, Framer Motion
- **Design Canvas**: Fabric.js 6, Three.js, React Three Fiber, OGL 3D Engine
- **Database**: PostgreSQL (DigitalOcean Managed Database)
- **Payment Processing**: Stripe API (Elements & Connect Express), PayPal SDK
- **POD Fulfillment**: Printify REST API Integration

---

## 3. User Roles & Access Control

| Role | Privileges & Access |
|---|---|
| **Guest / Shopper** | Browses product catalog, views PDP, customizes items, manages guest cart, executes guest checkout via Stripe or PayPal. |
| **Creator** | Accesses Creator Hub, customizes 2,300+ blueprints in 2D/3D editor, sets product selling prices, views Wallet Balance, manages Payout Settings, requests Bank/Stripe withdrawals. |
| **Admin** | Manages platform-wide operations, approves creator applications, inspects order pipeline, adjusts Global Markup % (default 35%), approves bank/stripe withdrawal payouts. |

---

## 4. Financial Model & Pricing Engine

Loka Media features a multi-tiered pricing engine ([`src/lib/pricing.ts`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/lib/pricing.ts)):

```
                                  Customer Pays ($100.00)
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           ▼                                ▼                                ▼
  1. Stripe Fee (2.9%+$0.30)      2. Loka Platform Fee (5%)      3. Printify Wholesale Cost
         ($3.20)                          ($5.00)                        ($40.00)
           │                                │                                │
           └────────────────────────────────┴────────────────────────────────┘
                                            │
                                            ▼
                                 4. Net Creator Profit
                                       ($51.80)
```

### Formulas:
1. **Printify Premium Price (PPP)**:
   $$\text{PPP} = \text{Printify Standard Catalog Price} \times 0.77 \quad (23\% \text{ Wholesale Savings})$$

2. **Customer Selling Price**:
   $$\text{Selling Price} = \text{PPP} \times \left(1 + \frac{\text{Platform Markup \%}}{100}\right)$$

3. **Net Creator Profit**:
   $$\text{Creator Profit} = \text{Selling Price} - \text{Printify Wholesale Cost} - \text{Platform Fee (5\%)} - \text{Stripe Processing Fee}$$

---

## 5. Core Feature Modules

### A. Creator Catalog & Fast Search
- **Location**: [`src/app/dashboard/creator/catalog/page.tsx`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/app/dashboard/creator/catalog/page.tsx)
- **Features**: Sub-50ms loading time for **2,349+ catalog blueprints** using O(1) instant memory lookup in [`src/app/api/printify/catalog/[[...path]]/route.ts`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/app/api/printify/catalog/%5B%5B...path%5D%5D/route.ts).
- Gender-aware category filtering (Men, Women, Unisex, Kids, Accessories, Home & Living).

### B. Unified 2D/3D Canvas Design Editor
- **Location**: [`src/components/canvas/UnifiedCanvasPDP.tsx`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/components/canvas/UnifiedCanvasPDP.tsx)
- **Features**: Drag-and-drop image upload, vector text layer manipulation, print area alignment, color variant switching, and live 3D webGL preview.

### C. Creator Earnings & Wallet System
- **Location**: [`src/app/dashboard/creator/earnings/page.tsx`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/app/dashboard/creator/earnings/page.tsx)
- **Features**: Displays **Available Balance**, **Pending Verification Balance**, **Lifetime Earnings**, and transaction ledger.
- Supports instant **Withdraw Funds** modal pre-filled with saved bank account details.

### D. Multi-Country Payout Settings
- **Location**: [`src/app/dashboard/creator/settings/stripe/page.tsx`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/app/dashboard/creator/settings/stripe/page.tsx)
- **Features**: Allows creators to pre-save their bank details with AES-256 encryption.
- Supports country-specific bank code rules:
  - **United States**: 9-digit Routing Number
  - **India**: 11-character IFSC Code (`HDFC0000123`)
  - **UK**: Sort Code
  - **EU**: IBAN & SWIFT Code

### E. Admin Management Dashboard
- **Location**: [`src/app/dashboard/admin/page.tsx`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/app/dashboard/admin/page.tsx)
- **Features**: Real-time stats cards linking directly to management pages:
  - **Active Creators** $\rightarrow$ [`/dashboard/admin/earnings`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/app/dashboard/admin/earnings/page.tsx)
  - **Published Products** $\rightarrow$ [`/dashboard/admin/products`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/app/dashboard/admin/products/page.tsx) (24 items per page)
  - **Total Orders** $\rightarrow$ [`/dashboard/admin/orders`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/app/dashboard/admin/orders/page.tsx)
  - **Platform Revenue** $\rightarrow$ [`/dashboard/admin/payouts`](file:///c:/Users/harsh%20vaishnani/OneDrive/Desktop/Lantern%20Projects/store.loka.media/src/app/dashboard/admin/payouts/page.tsx)

---

## 6. API Routes & External Integrations

### Next.js API Routes Summary:
- `GET /api/admin/stats` — Real-time admin dashboard metrics.
- `GET /api/printify/catalog` — Instant blueprint catalog with metadata lookup.
- `GET|POST|DELETE /api/creator/payout/bank-details` — Creator bank details management.
- `GET /api/creator/stripe/auth-url` — Stripe Express onboarding account links API.

### External Services:
- **Printify API**: Blueprint catalog, print provider variants, shipping rates, order submission.
- **Stripe API**: Payment Intents, Customer Checkout, Express Account Links, Payout Transfers.
- **DigitalOcean PostgreSQL**: Core data persistence for users, products, orders, and wallets.

---

## 7. Environment Configuration & Deployment

### Required Environment Variables (`.env.local`):
```env
NEXT_PUBLIC_API_URL=https://catalog.loka.media
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
PRINTIFY_API_KEY=eyJ0e...
PRINTIFY_SHOP_ID=27856672
DATABASE_URL=postgresql://doadmin:...@db-postgresql-blr1-57746-do-user-12834989-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

---

## 8. Testing & Quality Assurance Guide

1. **Free Test Order ($0.00 Spent)**:
   - Use Stripe Test Card `4242 4242 4242 4242`, Expiry `12/28`, CVC `123`.
2. **Real Card Safety Protocol**:
   - Ensure Printify **Order Approval** is set to **"Manual"** in `printify.com`.
   - Swap to Stripe Live Keys (`pk_live_...` & `sk_live_...`).
   - Test $1.00 order and issue a 1-click refund from Stripe Dashboard.

---
*Documentation compiled and verified for Loka Media (`store.loka.media`).*
