# 🌐 AgriLink Website Structure & User Flow

## 📊 Complete Sitemap

```
ROOT (/)
├── PUBLIC PAGES
│   ├── Home/Marketplace (/)
│   ├── About Us (/about)
│   ├── Contact (/contact)
│   └── FAQ (/faq)
│
├── AUTHENTICATION PAGES
│   ├── Register (/register)
│   │   └── Verify Email (/verify-email) - Waiting for email click
│   │       └── Email Verified (/verify-email) - After clicking email link
│   │
│   └── Sign In (/login)
│       └── Forgot Password (/forgot-password)
│           └── Reset Password (/reset-password)
│
├── POST LOGIN (Avatar Dropdown Menu)
│   ├── Profile (/profile) - ALL ROLES
│   │   ├── Reset Password (/reset-password)
│   │   └── Change Email (/verify-email-change)
│   │
│   ├── Dashboard (/dashboard) - ALL ROLES
│   │   ├── Add Product (/products/new) - FARMER/TRADER
│   │   ├── Edit Product (/product/[id]/edit) - FARMER/TRADER
│   │   ├── Delete Products - FARMER/TRADER
│   │   ├── View Product Details (/product/[id]) - FARMER/TRADER
│   │   │   └── Compare Prices (/products/[id]/price-comparison) - ALL ROLES
│   │
│   ├── Storefront (/seller/[id]) - FARMER/TRADER
│   ├── Public Profile (/user/[id]) - BUYER
│   │
│   ├── Messages (/messages) - ALL ROLES
│   │   └── Chat Interface (popup/modal)
│   │       └── Make Offer Form (Optional - buyer/trader only)
│   │
│   ├── Manage Offers (Optional) - Role-based view (buyer/farmer/trader)
│   │   └── Offer Details (Optional - /offers/[id])
│   │
│   └── Multi-Step Verification (/verify) - ALL ROLES
│       ├── Phone verification (SMS) - ALL users
│       ├── Identity documents upload - ALL users
│       ├── Business details (business accounts only)
│       └── AgriLink verification (admin approval) - ALL users
│
├── ADMIN AREA
│   ├── Admin Dashboard (/admin)
│   └── Admin Verification (/admin/verification)
```

## 🔄 User Journey Flows

*For detailed user journey flows, see [User Journey Flows](USER_JOURNEY_FLOWS.md)*

### Quick Reference:
- **New Visitor**: Landing → Browse → Register → Verify → Dashboard
- **Returning User**: Login → Dashboard → Browse → Offers → Chat
- **Seller**: Dashboard → Add Products → Storefront → Handle Offers → Chat
- **Admin**: Login → Dashboard → Verification → Management

---

## 📱 Responsive Design Considerations

- **Mobile First**: All pages optimized for mobile devices
- **Tablet Friendly**: Enhanced layouts for tablet viewing
- **Desktop Enhanced**: Full feature set for desktop users

## 🔒 Security & Access Control

- **Public Access**: Home, About, Contact, FAQ, Login, Register
- **Authenticated Access**: Dashboard, Profile, Messages, Products, Offers
- **Admin Only**: Admin Dashboard, Verification Panel
- **Dynamic Access**: User profiles based on ownership/permissions

## 🚀 Performance Optimization

- **Static Pages**: Home, About, Contact, FAQ
- **Dynamic Pages**: User profiles, product details, offers
- **API Routes**: All backend functionality
- **Caching Strategy**: Product listings, user profiles

## 📊 Analytics & Tracking Points

- **Page Views**: All main pages
- **User Actions**: Registration, login, product views, offers
- **Conversion Funnel**: Landing → Registration → Verification → Active User
- **Engagement**: Chat usage, offer creation, profile updates

---

*Generated: $(date)*
*Total Pages: 25 main pages + dynamic routes*
*User Types: Buyer, Seller (Farmer/Trader), Admin*
