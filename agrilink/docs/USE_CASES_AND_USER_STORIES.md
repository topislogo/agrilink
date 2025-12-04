# 📊 AgriLink - Use Cases and User Stories

**Project:** AgriLink Agricultural Marketplace Platform  
**Document Type:** Use Cases and User Stories  
**Version:** 1.0  
**Date:** January 2025  
**Prepared by:** Development Team  
**Reviewed by:** Project Stakeholders  

---

## 📖 Table of Contents

1. [Introduction](#1-introduction)
2. [Actor Definitions](#2-actor-definitions)
3. [Use Case Diagrams](#3-use-case-diagrams)
4. [Detailed Use Cases](#4-detailed-use-cases)
5. [User Stories](#5-user-stories)
6. [Acceptance Criteria](#6-acceptance-criteria)
7. [User Journey Maps](#7-user-journey-maps)

---

## 1. Introduction

### 1.1 Purpose
This document defines the use cases and user stories for AgriLink, providing a comprehensive view of how users interact with the system and what functionality they expect.

### 1.2 Scope
The document covers all major user interactions and system behaviors required for the agricultural marketplace platform.

### 1.3 Document Structure
- **Use Cases:** Detailed system interactions
- **User Stories:** User-centered feature descriptions
- **Acceptance Criteria:** Testable conditions for each story
- **User Journeys:** End-to-end user experiences

---

## 2. Actor Definitions

### 2.1 Primary Actors

#### 2.1.1 Farmer
- **Description:** Agricultural producer who grows crops and sells them
- **Goals:** List products, manage inventory, communicate with buyers
- **Characteristics:** May have limited technical knowledge, values simplicity
- **Public Presence:** Storefront page (not profile page)

#### 2.1.2 Trader
- **Description:** Agricultural product trader who buys and sells products
- **Goals:** List products, manage multiple transactions, build relationships
- **Characteristics:** Business-oriented, needs efficiency and analytics
- **Public Presence:** Storefront page (not profile page)

#### 2.1.3 Buyer
- **Description:** Individual or business purchasing agricultural products
- **Goals:** Find products, compare prices, make purchases, communicate with sellers
- **Characteristics:** Price-conscious, needs product information and seller trust
- **Public Presence:** Public profile page accessible from chat interfaces

#### 2.1.4 Administrator
- **Description:** Platform manager responsible for verification and oversight
- **Goals:** Verify users, manage platform, monitor activity, ensure quality
- **Characteristics:** Technical knowledge, needs comprehensive tools

### 2.2 Secondary Actors

#### 2.2.1 Email Service
- **Description:** External email delivery service
- **Role:** Sends verification emails and notifications

#### 2.2.2 SMS Service
- **Description:** External SMS delivery service
- **Role:** Sends verification codes and notifications

#### 2.2.3 File Storage Service
- **Description:** External cloud storage service
- **Role:** Stores images and documents

---

## 3. Use Case Diagrams

### 3.1 Overall System Use Case Diagram

```
                    AgriLink Agricultural Marketplace
                              |
        ┌─────────────────────┼─────────────────────┐
        |                     |                     |
    Farmer                Trader                Buyer
        |                     |                     |
        ├─ Register           ├─ Register           ├─ Register
        ├─ Login              ├─ Login              ├─ Login
        ├─ Create Profile     ├─ Create Profile     ├─ Create Profile
        ├─ Verify Account     ├─ Verify Account     ├─ Verify Account
        ├─ List Products      ├─ List Products      ├─ Browse Products
        ├─ Manage Inventory   ├─ Manage Inventory   ├─ Search Products
        ├─ View Offers       ├─ View Offers        ├─ Make Offers
        ├─ Respond to Offers ├─ Respond to Offers  ├─ Chat with Sellers
        ├─ Manage Storefront ├─ Manage Storefront ├─ Public Profile
        └─ View Analytics    └─ View Analytics    └─ Leave Reviews
                              |
                        Administrator
                              |
                              ├─ Manage Users
                              ├─ Verify Accounts
                              ├─ Review Documents
                              ├─ Monitor Platform
                              └─ Generate Reports
```

### 3.2 User Registration and Authentication Use Cases

```
    User Registration and Authentication
              |
    ┌─────────┼─────────┐
    |         |         |
Register   Login    Password
    |         |         |
    ├─ Email  ├─ Email  ├─ Reset
    ├─ Phone  ├─ Pass  ├─ Change
    ├─ Profile ├─ Token └─ Verify
    └─ Verify └─ Logout
```

### 3.3 Product Management Use Cases

```
    Product Management
              |
    ┌─────────┼─────────┐
    |         |         |
  Create    Search    Manage
    |         |         |
    ├─ Basic  ├─ Text   ├─ Edit
    ├─ Images ├─ Filter ├─ Update
    ├─ Pricing ├─ Sort  ├─ Delete
    └─ Details └─ View  └─ Archive
```

### 3.4 Communication Use Cases

```
    Communication System
              |
    ┌─────────┼─────────┐
    |         |         |
  Send      Receive    Manage
Message    Message   Conversation
    |         |         |
    ├─ Text   ├─ Real-time ├─ Archive
    ├─ File   ├─ Status   ├─ Delete
    └─ Emoji  └─ History  └─ Search
```

---

## 4. Detailed Use Cases

### 4.1 UC-001: User Registration

#### 4.1.1 Use Case Information
- **Use Case ID:** UC-001
- **Use Case Name:** User Registration
- **Primary Actor:** New User (Farmer/Trader/Buyer)
- **Secondary Actor:** Email Service
- **Preconditions:** User has valid email address
- **Postconditions:** User account created, verification email sent

#### 4.1.2 Main Flow
1. User navigates to registration page
2. User selects user type (Farmer/Trader/Buyer)
3. User selects account type (Individual/Business)
4. User enters email address
5. User enters password
6. User enters name
7. User selects location
8. User clicks "Register" button
9. System validates input data
10. System creates user account
11. System sends verification email
12. System displays success message

#### 4.1.3 Alternative Flows
- **A1:** Invalid email format
  - System displays error message
  - User corrects email address
- **A2:** Email already exists
  - System displays error message
  - User uses different email or logs in
- **A3:** Weak password
  - System displays password requirements
  - User enters stronger password

#### 4.1.4 Exception Flows
- **E1:** Email service unavailable
  - System displays error message
  - User can retry later
- **E2:** System error
  - System displays error message
  - User can retry registration

### 4.2 UC-002: Product Listing

#### 4.2.1 Use Case Information
- **Use Case ID:** UC-002
- **Use Case Name:** Product Listing
- **Primary Actor:** Seller (Farmer/Trader)
- **Secondary Actor:** File Storage Service
- **Preconditions:** User is logged in and verified
- **Postconditions:** Product listed and visible to buyers

#### 4.2.2 Main Flow
1. Seller navigates to "Add Product" page
2. Seller enters product name
3. Seller selects product category
4. Seller enters product description
5. Seller sets product price
6. Seller specifies quantity and unit
7. Seller sets minimum order quantity
8. Seller uploads product images
9. Seller selects delivery options
10. Seller sets payment terms
11. Seller clicks "List Product" button
12. System validates product data
13. System saves product listing
14. System displays success message

#### 4.2.3 Alternative Flows
- **A1:** Invalid image format
  - System displays error message
  - Seller uploads valid images
- **A2:** Missing required fields
  - System highlights missing fields
  - Seller completes required information

### 4.3 UC-003: Product Search and Discovery

#### 4.3.1 Use Case Information
- **Use Case ID:** UC-003
- **Use Case Name:** Product Search and Discovery
- **Primary Actor:** Buyer
- **Preconditions:** User is on marketplace page
- **Postconditions:** User finds relevant products

#### 4.3.2 Main Flow
1. Buyer navigates to marketplace
2. Buyer enters search terms
3. Buyer applies filters (category, location, price)
4. Buyer selects sorting option
5. System displays filtered results
6. Buyer browses product listings
7. Buyer clicks on product of interest
8. System displays product details

#### 4.3.3 Alternative Flows
- **A1:** No search results
  - System displays "No results found"
  - Buyer adjusts search criteria
- **A2:** Too many results
  - Buyer applies additional filters
  - Buyer refines search terms

### 4.4 UC-004: Make Offer

#### 4.4.1 Use Case Information
- **Use Case ID:** UC-004
- **Use Case Name:** Make Offer
- **Primary Actor:** Buyer
- **Preconditions:** User is logged in and viewing product
- **Postconditions:** Offer submitted to seller

#### 4.4.2 Main Flow
1. Buyer views product details
2. Buyer clicks "Make Offer" button
3. Buyer enters offer price
4. Buyer specifies quantity
5. Buyer enters offer message
6. Buyer selects delivery address
7. Buyer chooses delivery options
8. Buyer selects payment terms
9. Buyer sets offer expiration
10. Buyer clicks "Submit Offer" button
11. System validates offer data
12. System creates offer
13. System notifies seller
14. System displays success message

### 4.5 UC-005: Respond to Offer

#### 4.5.1 Use Case Information
- **Use Case ID:** UC-005
- **Use Case Name:** Respond to Offer
- **Primary Actor:** Seller (Farmer/Trader)
- **Preconditions:** Seller has received offer
- **Postconditions:** Offer status updated, buyer notified

#### 4.5.2 Main Flow
1. Seller receives offer notification
2. Seller views offer details
3. Seller reviews offer terms
4. Seller decides on response (Accept/Reject/Counter)
5. Seller enters response message
6. Seller clicks response button
7. System updates offer status
8. System notifies buyer
9. System displays confirmation

### 4.6 UC-006: User Verification

#### 4.6.1 Use Case Information
- **Use Case ID:** UC-006
- **Use Case Name:** User Verification
- **Primary Actor:** Administrator
- **Secondary Actor:** User
- **Preconditions:** User has submitted verification request
- **Postconditions:** User verification status updated

#### 4.6.2 Main Flow
1. Administrator logs into admin panel
2. Administrator views pending verifications
3. Administrator selects verification request
4. Administrator reviews user documents
5. Administrator checks user information
6. Administrator makes decision (Approve/Reject)
7. Administrator adds review notes
8. Administrator submits decision
9. System updates user verification status
10. System notifies user of decision

---

## 5. User Stories

### 5.1 User Management Stories

#### 5.1.1 Registration Stories
- **US-001:** As a farmer, I want to register with my email and phone number so that I can start selling my products
- **US-002:** As a trader, I want to register as a business account so that I can represent my company
- **US-003:** As a buyer, I want to register quickly so that I can start browsing products
- **US-004:** As a user, I want to verify my email address so that I can secure my account

#### 5.1.2 Profile Management Stories
- **US-005:** As a seller, I want to create a detailed profile so that buyers can trust me
- **US-006:** As a user, I want to upload a profile picture so that others can recognize me
- **US-007:** As a business user, I want to add my business details so that I can build credibility
- **US-008:** As a user, I want to manage multiple addresses so that I can specify delivery locations

#### 5.1.3 Verification Stories
- **US-009:** As a user, I want to verify my phone number so that others can trust my identity
- **US-010:** As a seller, I want to upload identity documents so that I can get verified
- **US-011:** As a business user, I want to upload business licenses so that I can get business verification
- **US-012:** As a user, I want to track my verification status so that I know what's needed

### 5.2 Product Management Stories

#### 5.2.1 Product Listing Stories
- **US-013:** As a farmer, I want to list my crops with photos so that buyers can see the quality
- **US-014:** As a trader, I want to set custom prices so that I can be competitive
- **US-015:** As a seller, I want to specify quantity units so that buyers understand what they're buying
- **US-016:** As a seller, I want to set minimum order quantities so that I can manage my business efficiently

#### 5.2.2 Product Discovery Stories
- **US-017:** As a buyer, I want to search for specific products so that I can find what I need
- **US-018:** As a buyer, I want to filter products by location so that I can find local sellers
- **US-019:** As a buyer, I want to sort products by price so that I can find the best deals
- **US-020:** As a buyer, I want to save products to favorites so that I can review them later

#### 5.2.3 Storefront Stories
- **US-021:** As a farmer/trader, I want to have a storefront page so that buyers can see all my products
- **US-022:** As a farmer/trader, I want to customize my delivery options so that I can offer flexible service
- **US-023:** As a farmer/trader, I want to set custom payment terms so that I can manage my cash flow
- **US-023a:** As a farmer/trader, I want my storefront to be my public presence (not a profile page)

#### 5.2.4 Buyer Public Profile Stories
- **US-023b:** As a buyer, I want to have a public profile so that sellers can access it from chat messages
- **US-023c:** As a buyer, I want my profile to be accessible via profile icons in chat messages
- **US-023d:** As a buyer, I want my profile to show my verification status and transaction history

### 5.3 Communication Stories

#### 5.3.1 Messaging Stories
- **US-024:** As a buyer, I want to message sellers so that I can ask questions about products
- **US-025:** As a seller, I want to respond to buyer messages so that I can provide good service
- **US-026:** As a user, I want to see message status so that I know if my message was read
- **US-027:** As a user, I want to organize conversations by product so that I can keep track of discussions

#### 5.3.2 Chat Interface Stories
- **US-028:** As a user, I want to see real-time messages so that I can have instant communication
- **US-029:** As a user, I want to see verification status in chat so that I can trust the other party
- **US-030:** As a user, I want to manage my conversations so that I can keep my inbox organized
- **US-030a:** As a user, I want to click on buyer profile icons in chat to view their public profiles

### 5.4 Offer Management Stories

#### 5.4.1 Offer Creation Stories
- **US-031:** As a buyer, I want to make offers on products so that I can negotiate prices
- **US-032:** As a buyer, I want to specify delivery preferences so that I can get products conveniently
- **US-033:** As a buyer, I want to add messages to offers so that I can explain my requirements
- **US-034:** As a buyer, I want to set offer expiration so that I can manage my negotiations

#### 5.4.2 Offer Management Stories
- **US-035:** As a seller, I want to view incoming offers so that I can respond to buyers
- **US-036:** As a seller, I want to accept offers so that I can complete sales
- **US-037:** As a seller, I want to reject offers so that I can decline unsuitable offers
- **US-038:** As a buyer, I want to modify offers so that I can adjust my requirements

### 5.5 Administrative Stories

#### 5.5.1 Verification Management Stories
- **US-039:** As an admin, I want to review verification requests so that I can maintain platform quality
- **US-040:** As an admin, I want to approve verifications so that I can verify legitimate users
- **US-041:** As an admin, I want to reject verifications so that I can prevent fraud
- **US-042:** As an admin, I want to add review notes so that I can document my decisions

#### 5.5.2 Platform Management Stories
- **US-043:** As an admin, I want to view platform statistics so that I can monitor growth
- **US-044:** As an admin, I want to manage user accounts so that I can maintain platform integrity
- **US-045:** As an admin, I want to generate reports so that I can analyze platform performance

---

## 6. Acceptance Criteria

### 6.1 User Registration Acceptance Criteria

#### 6.1.1 Registration Form
- **AC-001:** User can select user type from dropdown (Farmer, Trader, Buyer)
- **AC-002:** User can select account type (Individual, Business)
- **AC-003:** Email field validates format and uniqueness
- **AC-004:** Password field enforces complexity rules
- **AC-005:** Location field provides dropdown selection
- **AC-006:** Form shows validation errors in real-time
- **AC-007:** Success message displays after registration
- **AC-008:** Verification email sent within 30 seconds

#### 6.1.2 Email Verification
- **AC-009:** Verification email contains secure token
- **AC-010:** Token expires after 24 hours
- **AC-011:** User can resend verification email
- **AC-012:** Account activated after email verification
- **AC-013:** User redirected to login after verification

### 6.2 Product Listing Acceptance Criteria

#### 6.2.1 Product Form
- **AC-014:** Product name field accepts 3-100 characters
- **AC-015:** Category selection required
- **AC-016:** Price field accepts decimal values
- **AC-017:** Quantity field accepts positive numbers
- **AC-018:** Image upload supports JPEG, PNG, WebP formats
- **AC-019:** Maximum 5 images per product
- **AC-020:** Image size limited to 5MB each

#### 6.2.2 Product Display
- **AC-021:** Products display in grid layout
- **AC-022:** Product cards show image, name, price, seller
- **AC-023:** Seller verification status visible
- **AC-024:** Products sortable by price, date, rating
- **AC-025:** Pagination shows 20 products per page

### 6.3 Messaging Acceptance Criteria

#### 6.3.1 Message Sending
- **AC-026:** Messages send in real-time
- **AC-027:** Message status shows sent/delivered/read
- **AC-028:** Messages limited to 1000 characters
- **AC-029:** Empty messages prevented
- **AC-030:** Messages persist in database

#### 6.3.2 Chat Interface
- **AC-031:** Chat window opens as modal
- **AC-032:** Messages display with timestamps
- **AC-033:** User profiles show in chat header
- **AC-034:** Verification status visible
- **AC-035:** Chat scrolls to latest message

### 6.4 Offer Management Acceptance Criteria

#### 6.4.1 Offer Creation
- **AC-036:** Offer price must be positive number
- **AC-037:** Offer quantity cannot exceed available stock
- **AC-038:** Delivery address required
- **AC-039:** Offer expiration date required
- **AC-040:** Offer message limited to 500 characters

#### 6.4.2 Offer Response
- **AC-041:** Seller can accept/reject/counter offers
- **AC-042:** Response notifications sent to buyer
- **AC-043:** Offer status updated immediately
- **AC-044:** Offer timeline maintained
- **AC-045:** Counter-offers create new offer

---

## 7. User Journey Maps

### 7.1 New Farmer Journey

```
Registration → Email Verification → Profile Setup → Phone Verification → 
Document Upload → Admin Review → Product Listing → Receive Offers → 
Respond to Offers → Complete Transactions → Receive Reviews
```

**Key Touchpoints:**
- Registration form completion
- Email verification process
- Profile creation with business details
- Document upload for verification
- First product listing
- First offer received
- First transaction completed

### 7.2 New Buyer Journey

```
Registration → Email Verification → Profile Setup → Browse Products → 
Search/Filter → View Product Details → Make Offer → Chat with Seller → 
Negotiate → Accept Offer → Complete Transaction → Leave Review
```

**Key Touchpoints:**
- Product discovery and search
- Product detail review
- Offer creation and submission
- Communication with seller
- Transaction completion
- Review submission

### 7.3 Administrator Journey

```
Login → View Dashboard → Review Verification Requests → Check Documents → 
Make Decision → Add Notes → Notify User → Monitor Platform → Generate Reports
```

**Key Touchpoints:**
- Daily verification review
- Document verification process
- Decision making and documentation
- Platform monitoring
- Report generation

---

## 📋 Use Case Summary

| Category | Use Cases | User Stories | Acceptance Criteria |
|----------|-----------|--------------|-------------------|
| **User Management** | 6 | 12 | 13 |
| **Product Management** | 8 | 15 | 11 |
| **Communication** | 4 | 7 | 10 |
| **Offer Management** | 5 | 8 | 10 |
| **Administrative** | 3 | 7 | 5 |
| **Total** | **26** | **49** | **49** |

---

## 📚 Appendices

### Appendix A: Use Case Templates
- Standard use case format
- Actor definitions
- Flow descriptions
- Exception handling

### Appendix B: User Story Templates
- As a [user type], I want [functionality] so that [benefit]
- Acceptance criteria format
- Definition of done

### Appendix C: Journey Map Templates
- User journey stages
- Touchpoint identification
- Pain point analysis
- Opportunity identification

---

**Document Approval:**
- Prepared by: Development Team
- Reviewed by: UX Designers
- Approved by: Product Owner
- Date: January 2025

---

*This document defines the use cases and user stories for the AgriLink agricultural marketplace platform.*
