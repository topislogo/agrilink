import { pgTable, uuid, text, boolean, timestamp, decimal, integer, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// LOOKUP TABLES (Master Data)
// ============================================================================

// Locations table - Geographic master data
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  region: text('region').notNull(),
  city: text('city').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});


// Categories table - Product categories
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
});

// Delivery options table - Standard delivery methods
export const deliveryOptions = pgTable('delivery_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
});

// Payment terms table - Standard payment terms
export const paymentTerms = pgTable('payment_terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
});

// Status types table - Offer status values
export const statusTypes = pgTable('status_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
});

// Seller custom delivery options table - Seller-specific delivery methods
export const sellerCustomDeliveryOptions = pgTable('seller_custom_delivery_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('sellerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.sellerId, table.name),
]);

// Seller custom payment terms table - Seller-specific payment methods
export const sellerCustomPaymentTerms = pgTable('seller_custom_payment_terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('sellerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.sellerId, table.name),
]);

// ============================================================================
// USER MANAGEMENT SYSTEM
// ============================================================================

// Users table - Core user accounts with simplified structure
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('passwordHash').notNull(),
  userType: text('userType').notNull(), // farmer, trader, buyer, admin
  accountType: text('accountType').notNull(), // individual, business
  emailVerified: boolean('emailVerified'),
  emailVerificationToken: text('emailVerificationToken'),
  emailVerificationExpires: timestamp('emailVerificationExpires', { withTimezone: true }),
  pendingEmail: text('pendingEmail'), // Email change requests
  createdAt: timestamp('createdAt', { withTimezone: true }),
  updatedAt: timestamp('updatedAt', { withTimezone: true }),
});

// User profiles table - Extended profile information with location reference
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  locationId: uuid('locationId').references(() => locations.id),
  phone: text('phone'),
  profileImage: text('profileImage'),
  storefrontImage: text('storefrontImage'),
  website: text('website'),
  specialties: text('specialties').array(), // Array of specialties
  createdAt: timestamp('createdAt', { withTimezone: true }),
  updatedAt: timestamp('updatedAt', { withTimezone: true }),
  aboutme: text('aboutme'),
}, (table) => ({
  uniqueUserId: unique().on(table.userId),
}));

// Addresses table - User-specific addresses with location references
export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  locationId: uuid('locationId').references(() => locations.id),
  addressLine1: text('addressLine1').notNull(),
  addressLine2: text('addressLine2'),
  phoneNumber: text('phoneNumber'),
  addressType: text('addressType').default('home'),
  isDefault: boolean('isDefault').default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// User social table - Social media links
export const userSocial = pgTable('user_social', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  facebook: text('facebook'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  linkedin: text('linkedin'),
  telegram: text('telegram'),
  whatsapp: text('whatsapp'),
  tiktok: text('tiktok'),
  website: text('website'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// User verification table - Verification status and documents
export const userVerification = pgTable('user_verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  verified: boolean('verified'),
  phoneVerified: boolean('phoneVerified'),
  verificationStatus: text('verificationStatus'),
  verificationSubmitted: boolean('verificationSubmitted'),
  verificationDocuments: jsonb('verificationDocuments'),
  rejectedDocuments: jsonb('rejectedDocuments'), // Documents that were rejected by admin
  businessDetailsCompleted: boolean('businessDetailsCompleted'),
  createdAt: timestamp('createdAt', { withTimezone: true }),
  updatedAt: timestamp('updatedAt', { withTimezone: true }),
}, (table) => ({
  uniqueUserId: unique().on(table.userId),
}));

// Business details table - Business-specific information
export const businessDetails = pgTable('business_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  businessName: text('businessName'),
  businessDescription: text('businessDescription'),
  businessHours: text('businessHours'),
  businessLicenseNumber: text('businessLicenseNumber'),
  specialties: text('specialties').array(),
  policies: jsonb('policies'),
  createdAt: timestamp('createdAt', { withTimezone: true }),
  updatedAt: timestamp('updatedAt', { withTimezone: true }),
});

// Email management table - Email change requests and password resets
export const emailManagement = pgTable('email_management', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pendingEmail: text('pendingEmail'),
  passwordResetToken: text('passwordResetToken'),
  passwordResetExpires: timestamp('passwordResetExpires', { withTimezone: true }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// User ratings table - User rating aggregations
export const userRatings = pgTable('user_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  totalReviews: integer('totalReviews').default(0),
  responseTime: text('responseTime'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueUserId: unique().on(table.userId),
}));

// Note: userBusiness table removed for simplicity
// Business accounts are directly linked to users via businessDetails.userId

// Verification requests table - Verification requests and approval workflow
export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').default('pending'),
  submittedAt: timestamp('submittedAt', { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp('reviewedAt', { withTimezone: true }),
  reviewedBy: uuid('reviewedBy').references(() => users.id, { onDelete: 'set null' }),
  reviewNotes: text('reviewNotes'),
  requestType: text('requestType').default('standard'),
  userEmail: text('userEmail'),
  userName: text('userName'),
  userType: text('userType'),
  accountType: text('accountType'),
  verificationDocuments: jsonb('verificationDocuments'),
  businessInfo: jsonb('businessInfo'),
  phoneVerified: boolean('phoneVerified').default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// PRODUCT MANAGEMENT SYSTEM
// ============================================================================

// Products table - Complete product information with delivery/payment options
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('sellerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('categoryId').references(() => categories.id),
  locationId: uuid('locationId').references(() => locations.id),
  name: text('name').notNull(),
  description: text('description'),
  quantity: integer('quantity'), // Numeric quantity (e.g., 20, 50, 100)
  quantityUnit: text('quantityUnit'), // Measurement unit (e.g., "kg", "g", "lb", "tons")
  packaging: text('packaging'), // Container type (e.g., "bag", "sack", "dozen", "piece") - Optional
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  availableStock: text('availableStock'), // Text format for flexible stock description
  minimumOrder: text('minimumOrder'), // Minimum order requirement
  deliveryOptions: uuid('deliveryOptions').array(), // Array of delivery option IDs
  paymentTerms: uuid('paymentTerms').array(), // Array of payment term IDs
  sellerType: text('sellerType'), // Type of seller for delivery coordination
  sellerName: text('sellerName'), // Seller name for delivery coordination
  additionalNotes: text('additionalNotes'), // Custom delivery/payment arrangements
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// Product images table - Product photos and images
export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  imageData: text('imageData').notNull(), // Base64 or URL to image
  isPrimary: boolean('isPrimary').default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// Saved products table - User favorites and saved items (simplified)
export const savedProducts = pgTable('saved_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueUserProduct: unique().on(table.userId, table.productId),
}));

// ============================================================================
// MESSAGING SYSTEM
// ============================================================================

// Conversations table - Product-specific conversations between buyers and sellers
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('sellerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastMessage: text('lastMessage'),
  lastMessageTime: timestamp('lastMessageTime', { withTimezone: true }),
  unreadCount: integer('unreadCount').default(0),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// Messages table - Individual messages within conversations
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversationId').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('senderId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  messageType: text('messageType').default('text'),
  isRead: boolean('isRead').default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// OFFER MANAGEMENT SYSTEM
// ============================================================================

// Offers table - Main offer information with core attributes + normalized references
export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('sellerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  offerPrice: decimal('offerPrice', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  message: text('message'),
  status: text('status').default('pending'), // Production compatibility (text field)
  statusId: uuid('statusId').references(() => statusTypes.id), // Normalized reference
  expiresAt: timestamp('expiresAt', { withTimezone: true }),
  deliveryAddress: jsonb('deliveryAddress'), // Flexible delivery address storage
  deliveryOptions: text('deliveryOptions').array(), // Production compatibility (text array)
  deliveryOptionIds: uuid('deliveryOptionIds').array(), // Normalized references
  paymentTerms: text('paymentTerms').array(), // Production compatibility (text array)
  paymentTermIds: uuid('paymentTermIds').array(), // Normalized references
  conversationId: uuid('conversationId').references(() => conversations.id),
  cancelledBy: uuid('cancelledBy').references(() => users.id, { onDelete: 'set null' }),
  cancellationReason: text('cancellationReason'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

// Offer timeline table - Timeline tracking for offer status changes and events
export const offerTimeline = pgTable('offer_timeline', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: uuid('offerId').notNull().references(() => offers.id, { onDelete: 'cascade' }),
  eventType: text('eventType').notNull(), // Status changes, cancellations, deliveries, completions
  eventDescription: text('eventDescription').notNull(), // Human readable description
  eventData: jsonb('eventData'), // Flexible event-specific information
  userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }), // User who performed the action
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// Offer reviews table - Reviews and ratings for completed offers
export const offerReviews = pgTable('offer_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: uuid('offerId').notNull().references(() => offers.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  revieweeId: uuid('revieweeId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueOfferReviewer: unique().on(table.offerId, table.reviewerId),
}));

// Notifications table - In-app notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').notNull().default('in-app'),
  read: boolean('read').notNull().default(false),
  link: text('link'),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// Verification codes table for SMS verification
export const verificationCodes = pgTable('verification_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  phone: text('phone').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

// Lookup table relations
export const locationsRelations = relations(locations, ({ many }) => ({
  userProfiles: many(userProfiles),
  addresses: many(addresses),
  products: many(products),
}));


export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const deliveryOptionsRelations = relations(deliveryOptions, ({ many }) => ({
  products: many(products),
}));

export const paymentTermsRelations = relations(paymentTerms, ({ many }) => ({
  products: many(products),
}));

export const statusTypesRelations = relations(statusTypes, ({ many }) => ({
  offers: many(offers),
}));

export const sellerCustomDeliveryOptionsRelations = relations(sellerCustomDeliveryOptions, ({ one }) => ({
  seller: one(users, {
    fields: [sellerCustomDeliveryOptions.sellerId],
    references: [users.id],
  }),
}));

export const sellerCustomPaymentTermsRelations = relations(sellerCustomPaymentTerms, ({ one }) => ({
  seller: one(users, {
    fields: [sellerCustomPaymentTerms.sellerId],
    references: [users.id],
  }),
}));

// User management relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  businessDetails: one(businessDetails, { fields: [users.id], references: [businessDetails.userId] }),
  social: one(userSocial, { fields: [users.id], references: [userSocial.userId] }),
  verification: one(userVerification, { fields: [users.id], references: [userVerification.userId] }),
  emailManagement: one(emailManagement, { fields: [users.id], references: [emailManagement.userId] }),
  ratings: one(userRatings, { fields: [users.id], references: [userRatings.userId] }),
  addresses: many(addresses),
  verificationRequests: many(verificationRequests),
  verificationRequestsReviewed: many(verificationRequests, { relationName: 'reviewedBy' }),
  products: many(products),
  conversationsAsBuyer: many(conversations, { relationName: 'buyer' }),
  conversationsAsSeller: many(conversations, { relationName: 'seller' }),
  messages: many(messages),
  offersAsBuyer: many(offers, { relationName: 'buyer' }),
  offersAsSeller: many(offers, { relationName: 'seller' }),
  offersCancelled: many(offers, { relationName: 'cancelledBy' }),
  offerTimeline: many(offerTimeline),
  offerReviewsAsReviewer: many(offerReviews, { relationName: 'reviewer' }),
  offerReviewsAsReviewee: many(offerReviews, { relationName: 'reviewee' }),
  savedProducts: many(savedProducts),
  customDeliveryOptions: many(sellerCustomDeliveryOptions),
  customPaymentTerms: many(sellerCustomPaymentTerms),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
  location: one(locations, { fields: [userProfiles.locationId], references: [locations.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
  location: one(locations, { fields: [addresses.locationId], references: [locations.id] }),
}));

export const userSocialRelations = relations(userSocial, ({ one }) => ({
  user: one(users, { fields: [userSocial.userId], references: [users.id] }),
}));

export const userVerificationRelations = relations(userVerification, ({ one }) => ({
  user: one(users, { fields: [userVerification.userId], references: [users.id] }),
}));

export const businessDetailsRelations = relations(businessDetails, ({ one, many }) => ({
  user: one(users, { fields: [businessDetails.userId], references: [users.id] }),
}));

export const emailManagementRelations = relations(emailManagement, ({ one }) => ({
  user: one(users, { fields: [emailManagement.userId], references: [users.id] }),
}));

export const userRatingsRelations = relations(userRatings, ({ one }) => ({
  user: one(users, { fields: [userRatings.userId], references: [users.id] }),
}));

// userBusinessRelations removed for simplicity

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  user: one(users, { fields: [verificationRequests.userId], references: [users.id] }),
  reviewedByUser: one(users, { fields: [verificationRequests.reviewedBy], references: [users.id], relationName: 'reviewedBy' }),
}));

// Product management relations
export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, { fields: [products.sellerId], references: [users.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  location: one(locations, { fields: [products.locationId], references: [locations.id] }),
  images: many(productImages),
  savedProducts: many(savedProducts),
  conversations: many(conversations),
  offers: many(offers),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const savedProductsRelations = relations(savedProducts, ({ one }) => ({
  user: one(users, { fields: [savedProducts.userId], references: [users.id] }),
  product: one(products, { fields: [savedProducts.productId], references: [products.id] }),
}));

// Messaging relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  product: one(products, { fields: [conversations.productId], references: [products.id] }),
  buyer: one(users, { fields: [conversations.buyerId], references: [users.id], relationName: 'buyer' }),
  seller: one(users, { fields: [conversations.sellerId], references: [users.id], relationName: 'seller' }),
  messages: many(messages),
  offers: many(offers),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

// Offer management relations
export const offersRelations = relations(offers, ({ one, many }) => ({
  product: one(products, { fields: [offers.productId], references: [products.id] }),
  buyer: one(users, { fields: [offers.buyerId], references: [users.id], relationName: 'buyer' }),
  seller: one(users, { fields: [offers.sellerId], references: [users.id], relationName: 'seller' }),
  statusType: one(statusTypes, { fields: [offers.statusId], references: [statusTypes.id] }),
  conversation: one(conversations, { fields: [offers.conversationId], references: [conversations.id] }),
  cancelledByUser: one(users, { fields: [offers.cancelledBy], references: [users.id], relationName: 'cancelledBy' }),
  timeline: many(offerTimeline),
  reviews: many(offerReviews),
}));

export const offerTimelineRelations = relations(offerTimeline, ({ one }) => ({
  offer: one(offers, { fields: [offerTimeline.offerId], references: [offers.id] }),
  user: one(users, { fields: [offerTimeline.userId], references: [users.id] }),
}));

export const offerReviewsRelations = relations(offerReviews, ({ one }) => ({
  offer: one(offers, { fields: [offerReviews.offerId], references: [offers.id] }),
  reviewer: one(users, { fields: [offerReviews.reviewerId], references: [users.id], relationName: 'reviewer' }),
  reviewee: one(users, { fields: [offerReviews.revieweeId], references: [users.id], relationName: 'reviewee' }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

export type UserSocial = typeof userSocial.$inferSelect;
export type NewUserSocial = typeof userSocial.$inferInsert;

export type UserVerification = typeof userVerification.$inferSelect;
export type NewUserVerification = typeof userVerification.$inferInsert;

export type BusinessDetails = typeof businessDetails.$inferSelect;
export type NewBusinessDetails = typeof businessDetails.$inferInsert;

export type EmailManagement = typeof emailManagement.$inferSelect;
export type NewEmailManagement = typeof emailManagement.$inferInsert;

export type UserRating = typeof userRatings.$inferSelect;
export type NewUserRating = typeof userRatings.$inferInsert;

// UserBusiness types removed for simplicity

export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type NewVerificationRequest = typeof verificationRequests.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

export type SavedProduct = typeof savedProducts.$inferSelect;
export type NewSavedProduct = typeof savedProducts.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;

export type OfferTimeline = typeof offerTimeline.$inferSelect;
export type NewOfferTimeline = typeof offerTimeline.$inferInsert;

export type OfferReview = typeof offerReviews.$inferSelect;
export type NewOfferReview = typeof offerReviews.$inferInsert;

// Lookup table types
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;



export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type DeliveryOption = typeof deliveryOptions.$inferSelect;
export type NewDeliveryOption = typeof deliveryOptions.$inferInsert;

export type PaymentTerm = typeof paymentTerms.$inferSelect;
export type NewPaymentTerm = typeof paymentTerms.$inferInsert;

export type StatusType = typeof statusTypes.$inferSelect;
export type NewStatusType = typeof statusTypes.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;