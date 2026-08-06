# 🧪 Complete QA Testing Checklist - Loka Media (store.loka.media)

This document provides an exhaustive, end-to-end Quality Assurance (QA) testing checklist for the **Loka Media** e-commerce platform. It covers all 3 user roles (**Customer/Guest**, **Creator**, and **Admin**), core integrations (Printify, Printful, Stripe, Stripe Connect), pricing engine calculations, and edge cases.

---

## 📋 Table of Contents
1. [Customer / Storefront Experience](#1-customer--storefront-experience)
2. [Cart & Unified Checkout Flow](#2-cart--unified-checkout-flow)
3. [Creator Portal & Unified Canvas Studio](#3-creator-portal--unified-canvas-studio)
4. [Admin Management Panel](#4-admin-management-panel)
5. [Pricing & Earnings Calculation Engine](#5-pricing--earnings-calculation-engine)
6. [Integrations & Third-Party APIs](#6-integrations--third-party-apis)
7. [Cross-Cutting & Edge Cases](#7-cross-cutting--edge-cases)

---

## 1. Customer / Storefront Experience

### 1.1 Homepage & Navigation
- [ ] **Header Navigation**: Verify logo click returns home, navigation links (Discover, Creators, Creator Hub, Cart badge, Auth/Account) work properly.
- [ ] **Currency Switcher**: Test switching currency dropdown (USD, EUR, GBP, etc.). Verify prices across pages update with formatted currency symbols.
- [ ] **Cart Counter Badge**: Ensure total item count updates dynamically when adding/removing items.
- [ ] **Responsive Header**: Test hamburger menu & mobile navigationdrawer on small screen devices (iOS & Android).

### 1.2 Product Catalog & Search (`/products`)
- [ ] **Product Grid Display**: Verify product title, thumbnail mockup, category tag, retail selling price, and "Designed by [Creator]" badge display accurately.
- [ ] **Search Bar**: Test searching by product title, design tags, category, and creator name.
- [ ] **Category Filters**: Filter by Apparel (Hoodies, T-Shirts), Mugs, Wall Art, Drinkware, Accessories. Ensure correct items load.
- [ ] **Sorting**: Test sorting by Price (Low to High, High to Low), Newest Arrivals, and Popularity.

### 1.3 Product Details Page (PDP) (`/products/[productId]`)
- [ ] **360° Spin / Interactive Preview**:
  - Test dragging/swiping left and right to rotate mockup angles (Front, Back, Left Sleeve, Right Sleeve).
  - Test clicking thumbnails below to jump to specific angles.
  - Verify vector outline fallback displays correctly if Printify mockup is loading.
- [ ] **Variant Selection**:
  - **Color Selector**: Click color swatches. Verify active mockup image updates to match the selected garment color.
  - **Size Selector**: Select sizes (S, M, L, XL, 2XL). Verify size-specific pricing (if any) updates dynamically.
  - **Single Selection Guard**: Ensure at least one color and one size remain selected at all times.
- [ ] **Regional Availability Indicator**:
  - Verify location indicator (e.g., "Available in US, EU, UK").
  - Test warnings if selected variant/size cannot be shipped to recipient region.
- [ ] **Add to Cart**:
  - Select Color + Size + Quantity -> Click "Add to Cart".
  - Verify toast notification appears and cart icon counter increments.

### 1.4 Creator Public Storefront (`/creator/[creatorId]`)
- [ ] **Profile Header**: Verify creator avatar, bio, banner, social links, and total product count.
- [ ] **Creator Product Grid**: Ensure only products published by this specific creator are listed.

---

## 2. Cart & Unified Checkout Flow

### 2.1 Shopping Cart (`/cart`)
- [ ] **Cart Items List**: Verify product thumbnail, title, selected size, color, unit price, quantity controls (+ / -), and item total price.
- [ ] **Quantity Updates**: Increase/decrease item quantity. Verify subtotal recalculates instantly.
- [ ] **Remove Item**: Click delete icon -> Confirm modal -> Item removed and subtotal updates.
- [ ] **Clear Cart**: Click "Clear Cart" -> Confirm modal -> Cart empties.
- [ ] **Order Summary Box**:
  - Subtotal calculation accuracy.
  - "Proceed to Checkout" button state (enabled when cart has items, disabled when empty).

### 2.2 Unified Checkout (`/checkout-unified`)

#### A. Guest vs Logged-In User Experience
- [ ] **Pre-filled Data**: If logged in, verify customer name, email, phone, and saved shipping addresses auto-populate.
- [ ] **Guest Login Option**: Verify guest users can expand "Already have an account? Login" inline.
- [ ] **Guest Account Creation Checkbox**: Check "Create an account for faster checkout". Verify password fields appear and validate (min 6 chars, password match).
- [ ] **Cart Merge Dialog**: Log in as guest with items in cart -> Verify Cart Merge dialog pops up to merge guest cart with account cart cleanly.

#### B. Shipping Address & Validation
- [ ] **Required Fields**: Validate Name, Email, Phone (min 7 digits), Address 1, City, Zip Code, Country.
- [ ] **State / Province Requirement**: State is MANDATORY for US, CA, AU, JP. Verify error toast if state is left empty.
- [ ] **Postal/Zip Code Format Validation**: Test invalid zip formats (e.g. US zip in UK format). Verify friendly error message.
- [ ] **Regional Compatibility Check**:
  - If cart contains items restricted to US and customer chooses UK address, verify red warning banner appears listing restricted items.
  - Verify "Remove" button next to restricted item allows quick removal.

#### C. Shipping Rates Calculation
- [ ] **Live Rate Fetching**: Complete shipping address -> Verify loading spinner "Calculating Shipping...".
- [ ] **Provider Grouping / Method Options**: Verify shipping rates returned from Printify/Printful API populate radio buttons (Standard, Express).
- [ ] **Itemized Breakdown**: Check itemized shipping breakdown section ("First Item Rate" vs "Additional Item Rate").

#### D. Order Summary Breakdown (CRITICAL)
- [ ] **Verify Item List**: Product names, size, color, quantity, total.
- [ ] **Subtotal**: Exact sum of cart items.
- [ ] **Platform Fee (Convenience Fee)**: Verify **4.9%** calculation (`Subtotal * 0.049`).
- [ ] **Shipping**: Selected shipping rate cost.
- [ ] **Estimated Tax**: 8% estimate or exact Printful/Printify tax amount.
- [ ] **Estimated Total Calculation**:
  $$\text{Estimated Total} = \text{Subtotal} + \text{Platform Fee (4.9\%)} + \text{Shipping} + \text{Tax}$$
- [ ] **Stripe Amount Verification**: Verify "Continue to Payment" sends the EXACT `Estimated Total` amount to Stripe.

#### E. Stripe Payment Form & Confirmation
- [ ] **Stripe Elements Render**: Card number, Expiry, CVC, Postal Code fields render without errors.
- [ ] **Failed Payment Handling**: Test invalid test card (e.g. card decline). Verify error alert appears and page remains on payment step.
- [ ] **Successful Payment Handling**: Test valid test card (`4242 4242 4242 4242`).
  - Verify backend `/api/unified-checkout/stripe/confirm-payment` is called.
  - Cart is cleared automatically.
  - Redirect to Order Complete page showing Order Number (`ORD-XXXXX`) and payment confirmation.

---

## 3. Creator Portal & Unified Canvas Studio

### 3.1 Creator Dashboard (`/dashboard/creator`)
- [ ] **Overview Metrics**: Total Sales, Total Revenue, Net Creator Earnings, Total Live Products.
- [ ] **Quick Action Links**: Create New Product, View Products, Request Payout, Connect Stripe.

### 3.2 Unified Canvas PDP / Customizer (`/dashboard/creator/canvas`)

#### A. Base Product & Variant Selection
- [ ] **Product Selection**: Select catalog apparel (Hoodie, T-Shirt) vs non-apparel (Mug, Wall Art). Verify 360 preview mode adjusts.
- [ ] **Print Provider Selector**: Switch Printify Print Providers. Verify color/size availability refreshes.
- [ ] **Color & Size Selectors**: Multi-select colors & sizes for storefront availability.

#### B. Placement & Design Upload
- [ ] **Placement Targets**: Switch targets (Front Print, Back Print, Left Sleeve, Right Sleeve, Neck Label).
- [ ] **Drag & Drop File Upload**:
  - Drag PNG/JPG/SVG/WebP image onto dropzone.
  - Verify upload progress bar and file added to "Uploaded Designs" gallery.
  - Test non-image file upload attempt (verify error toast).
- [ ] **Background Removal Tool**: Select uploaded design -> Click "Remove Background" -> Verify transparency applied.
- [ ] **Positioning Helpers**: Test "Center All", "Center Top", "Center Bottom" alignment buttons on live canvas.

#### C. Live 360° Preview & Mockups
- [ ] **Real-time Canvas**: Verify image scales, rotates, and positions accurately on the garment outline.
- [ ] **360° Spin Viewer**: Drag horizontally to preview placement from all angles.
- [ ] **Regenerate Previews**: Click "Regenerate Previews" -> Verify cooldown timer (30s) activates to prevent API rate limits.

#### D. Creator Pricing & Markup Breakdown (CRITICAL)
- [ ] **Slider & Presets**: Test slider from `Min Markup %` to `100%`. Test quick preset buttons (15%, 23%, 31%, 38%, 46%, etc.).
- [ ] **Minimum Required Markup Enforcement**:
  - Verify slider CANNOT slide below `Min Markup %` (ensures Creator Profit remains > $0.00 after Stripe fees).
- [ ] **Pricing Breakdown Card Values**:
  1. **Creator Price**: Retail Selling Price (`$16.99`).
  2. **Loka Base Cost**: Platform Base Cost (`$12.99`).
  3. **Stripe Fee (2.9% + $0.30)**: `$0.79` (`Creator Price * 0.029 + 0.30`).
  4. **Creator Markup Net Profit**:
     $$\text{Creator Profit} = (\text{Creator Price} - \text{Loka Base Cost}) - \text{Stripe Fee}$$
     *Example:* $\$16.99 - \$12.99 - \$0.79 = \mathbf{+\$3.21}$
  5. **Sub-label Text**: Verify text reads: `Calculated as Creator Price - Loka Base Cost - Stripe Fee`.

#### E. Storefront Metadata & Validation Checklist
- [ ] **Title Input**: Mandatory.
- [ ] **Description Input**: Mandatory (Minimum 20 characters length check).
- [ ] **Category Select**: Mandatory marketplace category selection.
- [ ] **Tags Input**: Test adding & removing custom search tags.
- [ ] **Validation Checklist**:
  - Variants Selected (Green Check)
  - Designs Placed (Green Check)
  - Previews Ready (Green Check)
  - Storefront Metadata Complete (Green Check)
- [ ] **Publish Action**: Click "Save & Publish Live" -> Verify product published to storefront.

### 3.3 Products Management (`/dashboard/creator/products`)
- [ ] **Product List**: View all creator products, status badges (Draft, Published, Archived).
- [ ] **Edit Product**: Click Edit -> Modify title, description, or markup -> Save changes.
- [ ] **Delete Product**: Click Delete -> Confirm modal -> Product removed from creator catalog.

### 3.4 Payouts & Earnings (`/dashboard/creator/payouts`)
- [ ] **Stripe Connect Status**:
  - Connect Stripe Account button -> Redirect to Stripe onboarding URL -> Return with success status.
  - Disconnect Stripe option.
- [ ] **Payout Request Modal**:
  - Select Payout Method (**Stripe Connect Transfer** vs **Manual Bank Transfer**).
  - Input Payout Amount (verify amount cannot exceed available balance).
  - Submit request -> Status changes to "Pending Review".

---

## 4. Admin Management Panel

### 4.1 Admin Dashboard Overview (`/dashboard/admin`)
- [ ] **Platform KPIs**: Total Platform Sales (GMV), Total Platform Revenue, Total Creators, Active Orders.

### 4.2 Product Moderation (`/dashboard/admin/products`)
- [ ] **Review Published Products**: Inspect creator submitted products.
- [ ] **Approve / Reject**: Toggle product visibility on global marketplace.

### 4.3 Commission & Financial Breakdown (`/dashboard/admin/commission`)
- [ ] **Commission Modal**: Open `CommissionBreakdownModal`. Verify breakdown per order:
  - Total Customer Paid
  - Base Manufacturing Cost (Printify/Printful)
  - Platform Fee (4.9%)
  - Creator Profit
  - Stripe Processing Fee

### 4.4 Creator Payout Approvals (`/dashboard/admin/payouts`)
- [ ] **Pending Requests List**: View creator payout requests with method (Stripe Connect / Bank Transfer).
- [ ] **Stripe Connect Transfer Approval**:
  - Click "Approve Payout" for Stripe Connect request.
  - Verify Stripe Connect Transfer API executes successfully.
  - Status updates to "Completed" and creator balance is debited.
- [ ] **Manual Bank Transfer Approval**:
  - Input Transaction Reference / Reference ID.
  - Click "Mark as Paid" -> Status updates to "Completed".
- [ ] **Reject Payout**: Rejection refunds requested amount back to creator's available balance.

---

## 5. Pricing & Earnings Calculation Engine

| Scenario | Component / Page | Expected Formula / Logic | Pass / Fail |
| :--- | :--- | :--- | :---: |
| **Creator Net Profit** | Canvas PDP / Creator Studio | `(Creator Price - Loka Base Cost) - Stripe Fee` | [ ] |
| **Stripe Fee** | Canvas PDP & Admin Modal | `Selling Price * 2.9% + $0.30` | [ ] |
| **Minimum Required Markup** | Canvas PDP Slider | `Math.ceil(((Loka Base Cost + 0.31) / 0.971) / Loka Base Cost - 1) * 100` | [ ] |
| **Customer Platform Fee** | Order Summary (Checkout) | `Subtotal * 4.9%` | [ ] |
| **Customer Total Charged** | Checkout & Stripe Payment | `Subtotal + Platform Fee + Shipping + Tax` | [ ] |

---

## 6. Integrations & Third-Party APIs

### 6.1 Printify & Printful API
- [ ] **Print Files Sync**: Verify canvas pulls variant print file dimensions & areas.
- [ ] **Live Shipping Rates API**: Verify live address payload returns accurate carrier shipping rates.
- [ ] **Order Fulfillment Push**: Place order on frontend -> Verify order details (shipping address, line items, variants) push to Printify/Printful dashboard.

### 6.2 Stripe & Stripe Connect
- [ ] **Payment Intent Creation**: Verify correct currency and exact total amount passed to PaymentIntent API.
- [ ] **Stripe Webhook Listener**: Test `payment_intent.succeeded` webhook updates backend order status from `pending_payment` to `processing`.
- [ ] **Stripe Connect Transfers**: Verify creator payout transfers log cleanly in Stripe Connect Express dashboard.

---

## 7. Cross-Cutting & Edge Cases

### 7.1 Security & Access Control
- [ ] **Role-Based Protection**: Try accessing `/dashboard/admin` as Customer or Creator -> Verify redirected to login/unauthorized.
- [ ] **Creator Resource Isolation**: Creator A cannot edit or delete Creator B's products.

### 7.2 Performance & Responsiveness
- [ ] **Mobile Touch Support**: Test dragging & zooming images on touchscreens.
- [ ] **Image Compression**: Verify high-res uploaded designs do not cause canvas browser crashes.
- [ ] **Sticky Headers & Bottom Bars**: Verify mobile checkout sticky bottom bar does not block form submit buttons.

---

### 📝 QA Execution Log Template
- **Tester Name**: ____________________
- **Date Tested**: ____________________
- **Build / Commit Hash**: ____________________
- **Total Tests Passed**: _____ / _____
- **Critical Blockers Found**: _____
