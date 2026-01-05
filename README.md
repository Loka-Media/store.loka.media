# Loka Media - Marketplace Platform

A comprehensive Next.js-based marketplace platform enabling customers to browse and purchase products, creators to manage catalogs and earn commissions, and admins to oversee the entire ecosystem.

## System Architecture Overview

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (Icons)
- React Hot Toast (Notifications)

**Backend:**
- Node.js with Express.js
- PostgreSQL (28+ tables)
- Stripe API (Payments & Connect)
- Printful API (Print-on-demand)
- Shopify API (Inventory sync)

**Infrastructure:**
- DigitalOcean PostgreSQL
- Environment-based configuration
- JWT Token authentication

---

## Frontend Architecture

### Routes & Pages (25+ Pages)

#### Authentication Routes
- `/auth/login` - User login
- `/auth/signup/customer` - Customer registration
- `/auth/signup/creator` - Creator registration
- `/auth/forgot-password` - Password recovery
- `/auth/reset-password` - Password reset

#### Customer Routes
- `/` - Home/landing page
- `/shop` - Product catalog with filtering
- `/product/[id]` - Product detail page
- `/checkout-unified` - Unified checkout flow
- `/order-confirmation` - Order confirmation page
- `/dashboard/customer` - Customer dashboard
- `/dashboard/customer/orders` - Order history
- `/dashboard/customer/addresses` - Saved addresses
- `/dashboard/customer/profile` - Profile settings

#### Creator Routes
- `/dashboard/creator` - Creator dashboard home
- `/dashboard/creator/catalog` - Custom product management
- `/dashboard/creator/loka-products` - Browse & publish products
- `/dashboard/creator/files` - Design file management
- `/dashboard/creator/earnings` - Commission tracking
- `/dashboard/creator/settings/stripe` - Stripe Connect setup

#### Admin Routes
- `/dashboard/admin` - Admin dashboard
- `/dashboard/admin/orders` - Order management
- `/dashboard/admin/earnings` - Creator earnings overview
- `/dashboard/admin/payouts` - Payout processing
- `/dashboard/admin/creators` - Creator management
- `/dashboard/admin/verification` - Creator verification queue

#### Info Routes
- `/about` - About page
- `/terms` - Terms of service
- `/privacy` - Privacy policy
- `/contact` - Contact page

---

## API Endpoints Structure (50+ Endpoints)

### Authentication API
```
POST   /api/auth/register/customer     - Customer registration
POST   /api/auth/register/creator      - Creator registration
POST   /api/auth/login                 - User login
POST   /api/auth/logout                - User logout
POST   /api/auth/refresh-token         - Refresh JWT token
POST   /api/auth/forgot-password       - Request password reset
POST   /api/auth/reset-password        - Reset password with token
```

### Products API
```
GET    /api/products                   - List all products (paginated)
GET    /api/products/[id]              - Get product details
GET    /api/products/search            - Search products
GET    /api/products/filters           - Get available filters
POST   /api/products                   - Create product (creator only)
PUT    /api/products/[id]              - Update product (creator only)
DELETE /api/products/[id]              - Delete product (creator only)
```

### Shopping Cart API
```
GET    /api/cart                       - Get user cart
POST   /api/cart/items                 - Add item to cart
PUT    /api/cart/items/[id]            - Update cart item quantity
DELETE /api/cart/items/[id]            - Remove item from cart
POST   /api/cart/checkout              - Merge carts on login
```

### Checkout API
```
POST   /api/checkout/validate-address  - Validate shipping address
GET    /api/checkout/locations         - Get countries/states
POST   /api/checkout/create-order      - Create order
POST   /api/checkout/process-payment   - Process Stripe payment
GET    /api/checkout/guest-session     - Get guest checkout session
```

### Orders API
```
GET    /api/orders                     - List user orders
GET    /api/orders/[id]                - Get order details
PUT    /api/orders/[id]                - Update order status (admin)
POST   /api/orders/[id]/refund         - Process refund (admin)
GET    /api/orders/[id]/tracking       - Get order tracking
```

### Creator API
```
GET    /api/creator/profile            - Get creator profile
PUT    /api/creator/profile            - Update creator profile
GET    /api/creator/applications       - Get application status
POST   /api/creator/apply              - Apply as creator
POST   /api/creator/stripe/connect     - Initialize Stripe OAuth
POST   /api/creator/stripe/callback    - Handle Stripe callback
DELETE /api/creator/stripe/disconnect  - Disconnect Stripe account
```

### Commissions API
```
GET    /api/commissions                - List creator commissions
GET    /api/commissions/[id]           - Get commission details
GET    /api/admin/commissions/overview - Admin commission overview
GET    /api/admin/commissions/summary  - Commission summary stats
```

### Earnings API
```
GET    /api/earnings                   - Get creator earnings
GET    /api/earnings/history           - Commission payment history
GET    /api/admin/creators/earnings    - Admin view all earnings
GET    /api/admin/earnings/[id]        - Specific creator earnings
```

### Payouts API
```
GET    /api/payouts                    - Get creator payouts
GET    /api/admin/payouts/pending      - List pending payouts
POST   /api/admin/payouts/process      - Trigger payout batch
GET    /api/admin/payouts/history      - Payout history
```

### Admin API
```
GET    /api/admin/dashboard            - Admin dashboard stats
GET    /api/admin/creators             - List all creators
PUT    /api/admin/creators/[id]        - Update creator status
GET    /api/admin/verification         - Verification queue
POST   /api/admin/verification/[id]    - Approve/reject creator
```

---

## Database Schema (28 Tables)

### Core Tables
- `users` - User accounts (customers, creators, admins)
- `user_profiles` - Extended user profile information
- `creator_requests` - Creator application requests
- `creator_profile` - Creator-specific profiles

### Product Management
- `products` - Product listings
- `product_variants` - Product variants/options
- `product_inventory` - Stock levels
- `product_categories` - Product categorization
- `printful_sync_log` - Printful integration logs

### Shopping & Orders
- `cart_items` - Shopping cart items
- `orders` - Order records
- `marketplace_orders` - Unified order system
- `order_items` - Individual items in orders
- `guest_checkout_sessions` - Guest user sessions

### Commission & Payment
- `commissions` - Individual commission records
- `creator_commission_tracking` - Commission aggregation
- `creator_payouts` - Payout batches
- `commission_escrow` - Escrow for pending payouts
- `payment_processing` - Payment status tracking

### Admin & Verification
- `admin_verification_queue` - Pending admin approvals
- `admin_verification_logs` - Verification history

### Financial & Compliance
- `stripe_connect_accounts` - Stripe Creator accounts
- `refund_processing` - Refund records
- `transaction_logs` - All transaction history

### Configuration
- `platform_settings` - Global settings
- `commission_rates` - Commission structure
- `location_data` - Country/state mappings

---

## User Journeys

### 1. Guest Customer Journey
```
1. Browse Shop (/shop)
   ↓
2. View Product Details (/product/[id])
   ↓
3. Add to Cart (GuestCartContext)
   ↓
4. Proceed to Checkout (/checkout-unified)
   ↓
5. Enter Shipping Address
   ↓
6. Process Payment (Stripe)
   ↓
7. Create Guest Checkout Session
   ↓
8. Order Confirmation (/order-confirmation)
```

### 2. Registered Customer Journey
```
1. Login (/auth/login)
   ↓
2. Browse & Add Products to Cart
   ↓
3. Checkout (/checkout-unified)
   ↓
4. Select Saved Address or Create New
   ↓
5. Process Payment
   ↓
6. Merge Guest Cart (if exists)
   ↓
7. Order Confirmation
   ↓
8. Track Orders (/dashboard/customer/orders)
```

### 3. Creator Journey
```
1. Signup as Creator (/auth/signup/creator)
   ↓
2. Submit Creator Application
   ↓
3. Wait for Admin Approval
   ↓
4. Access Creator Dashboard (/dashboard/creator)
   ↓
5. Setup Stripe Connect (/dashboard/creator/settings/stripe)
   ↓
6. Manage Catalog (/dashboard/creator/catalog)
   ↓
7. Browse & Publish Loka Products (/dashboard/creator/loka-products)
   ↓
8. Track Earnings (/dashboard/creator/earnings)
   ↓
9. Receive Payouts (via Stripe Connect)
```

### 4. Admin Journey
```
1. Login as Admin (/auth/login)
   ↓
2. Access Admin Dashboard (/dashboard/admin)
   ↓
3. Review Creator Applications (/dashboard/admin/verification)
   ↓
4. Approve/Reject Creators
   ↓
5. Monitor Orders (/dashboard/admin/orders)
   ↓
6. Review Creator Earnings (/dashboard/admin/earnings)
   ↓
7. Process Payouts (/dashboard/admin/payouts)
   ↓
8. View Platform Statistics
```

---

## Commission & Payout Flow

```
Customer Purchase Order
    ↓
    ├─→ Order Created (marketplace_orders)
    ├─→ Payment Processed (Stripe)
    ├─→ Commission Recorded (commissions table)
    ↓
Admin Verification
    ├─→ Added to verification_queue
    ├─→ Admin Reviews Order
    ├─→ Admin Approves/Rejects
    ↓
Commission Escrow (if approved)
    ├─→ Funds held in escrow (commission_escrow)
    ├─→ Accrual period (configurable)
    ↓
Payout Processing (Daily at 9:00 AM UTC)
    ├─→ Calculate eligible commissions (≥$25)
    ├─→ Create payout batch (creator_payouts)
    ├─→ Process via Stripe Connect
    ├─→ Update payout status
    ↓
Creator Receives Funds
    ├─→ Funds transferred to Stripe Connected Account
    ├─→ Creator can withdraw to bank
    ├─→ Commission marked as paid
```

---

## Data Flow Diagrams

### Checkout Data Flow
```
Frontend (checkout-unified)
    ↓
Customer Info + Address
    ↓
Stripe Payment Intent
    ↓
API (/api/checkout/create-order)
    ├─→ Validate inventory
    ├─→ Create order record
    ├─→ Create order items
    ├─→ Record commission
    ├─→ Add to verification queue
    ↓
Backend Database Updates
    ├─→ marketplace_orders
    ├─→ order_items
    ├─→ commissions
    ├─→ admin_verification_queue
    ├─→ product_inventory (decrement)
    ↓
Frontend Confirmation
```

### Earnings Display Flow
```
Creator Dashboard (/dashboard/creator/earnings)
    ↓
API (/api/earnings)
    ↓
Database Queries
    ├─→ commissions (filter by creator_id)
    ├─→ creator_commission_tracking
    ├─→ commission_escrow
    ├─→ creator_payouts
    ↓
Real-time Statistics
    ├─→ Total commissions
    ├─→ Pending amount
    ├─→ Processing amount
    ├─→ Paid amount
    ├─→ History with dates
    ↓
Stripe Connect Status
    ├─→ Account connection status
    ├─→ Last payout date
    ├─→ Upcoming payout schedule
```

---

## Key Features

### Phase 1: Core Marketplace
- Product catalog with search/filtering
- Shopping cart (guest & authenticated)
- Unified checkout system
- Stripe payment processing
- Order management
- User authentication
- Creator application system

### Phase 2: Creator Commissions
- Commission tracking & calculation
- Creator earnings dashboard
- Stripe Connect integration
- Payout processing system
- Admin payout management
- Real-time earnings statistics
- Commission escrow system

### Future Phases
- Advanced analytics & reporting
- Bulk operations for admins
- Creator content management
- Review & rating system
- Referral program
- Subscription products
- Marketplace statistics API

---

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Stripe account (for payments)
- Printful account (for POD)
- Shopify account (for inventory)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd store.loka.media
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env.local
```

4. Run database migrations
```bash
npm run migrate
```

5. Start development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

---

## API Integration Points

### Stripe Integration
- Payment processing for customer orders
- Stripe Connect for creator payouts
- OAuth flow for account linking
- Webhook handling for payment events

### Printful Integration
- Print-on-demand product synchronization
- Real-time inventory checking
- Order forwarding to Printful
- Tracking information retrieval

### Shopify Integration
- Inventory synchronization
- Product catalog integration
- Pricing synchronization

---

## Authentication & Security

- JWT-based authentication
- Bearer token in Authorization header
- Protected routes with role-based access (Customer, Creator, Admin)
- Secure Stripe Connect OAuth flow
- Environment-based configuration
- Password hashing and reset tokens

---

## Project Structure

```
store.loka.media/
├── src/
│   ├── app/
│   │   ├── (auth)/ - Authentication pages
│   │   ├── (shop)/ - Shop pages
│   │   ├── checkout-unified/ - Checkout flow
│   │   ├── dashboard/ - User dashboards
│   │   │   ├── customer/
│   │   │   ├── creator/
│   │   │   └── admin/
│   │   └── [infopages]/ - Info pages
│   ├── components/ - Reusable components
│   ├── contexts/ - React contexts
│   ├── hooks/ - Custom hooks
│   ├── lib/ - Utilities & helpers
│   └── styles/ - Global styles
├── public/ - Static assets
├── .env.example - Environment template
└── package.json
```

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## Support

For issues and questions, please create an issue in the repository.
