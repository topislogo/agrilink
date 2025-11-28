import { db } from './index';
import { users, products, conversations, messages } from './schema';
import { eq } from 'drizzle-orm';

// Sample data for seeding the database
const sampleUsers = [
  {
    id: '851d8077-25b5-4164-9d2c-ffb7825216d5',
    email: 'traderbiz2@gmail.com',
    name: 'AgriConnect Trading',
    userType: 'trader',
    accountType: 'business',
    location: 'Yangon Region, Yangon',
    region: 'Yangon',
    phone: '+959123456789',
    businessName: 'AgriConnect Trading Co.',
    businessDescription: 'Leading agricultural trading company in Myanmar',
    verified: true,
    phoneVerified: true,
    verificationStatus: 'verified',
    verificationSubmitted: true,
    businessDetailsCompleted: true,
  },
  {
    id: 'a0ccdb64-c4de-4705-9540-dcd129ab8a6a',
    email: 'farmerbiz2@gmail.com',
    name: 'Golden Harvest Co.',
    userType: 'farmer',
    accountType: 'business',
    location: 'Mandalay Region, Mandalay',
    region: 'Mandalay',
    phone: '+959987654321',
    businessName: 'Golden Harvest Co.',
    businessDescription: 'Premium organic farming and fresh produce',
    verified: true,
    phoneVerified: true,
    verificationStatus: 'verified',
    verificationSubmitted: true,
    businessDetailsCompleted: true,
  },
  {
    id: 'af8f9dd9-eefa-4f73-b3c0-b6e1ba814afe',
    email: 'buyer1@gmail.com',
    name: 'Fresh Market Buyer',
    userType: 'buyer',
    accountType: 'individual',
    location: 'Yangon Region, Yangon',
    region: 'Yangon',
    phone: '+959555555555',
    verified: true,
    phoneVerified: true,
    verificationStatus: 'verified',
  },
];

const sampleProducts = [
  {
    id: 'c50ac524-8583-4981-b50c-58c900052909',
    sellerId: 'a0ccdb64-c4de-4705-9540-dcd129ab8a6a',
    name: 'Fresh Grapes',
    price: '2500.00',
    unit: 'kg',
    location: 'Mandalay Region, Mandalay',
    region: 'Mandalay',
    sellerType: 'farmer',
    sellerName: 'Golden Harvest Co.',
    image: 'https://images.unsplash.com/photo-1596363504924-7d8b2b0b0b0b?w=400&h=300&fit=crop',
    quantity: '100 kg',
    minimumOrder: '10 kg',
    availableQuantity: '100 kg',
    deliveryOptions: ['pickup', 'delivery'],
    paymentTerms: ['cash', 'bank_transfer'],
    category: 'fruits',
    description: 'Fresh, sweet grapes from our organic farm',
    isActive: true,
  },
  {
    id: 'b1b2b3b4-b5b6-b7b8-b9ba-bbbcbdbebfbf',
    sellerId: '851d8077-25b5-4164-9d2c-ffb7825216d5',
    name: 'Premium Rice',
    price: '1800.00',
    unit: 'kg',
    location: 'Yangon Region, Yangon',
    region: 'Yangon',
    sellerType: 'trader',
    sellerName: 'AgriConnect Trading',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
    quantity: '500 kg',
    minimumOrder: '25 kg',
    availableQuantity: '500 kg',
    deliveryOptions: ['pickup', 'delivery'],
    paymentTerms: ['cash', 'bank_transfer'],
    category: 'grains',
    description: 'High-quality premium rice from local farmers',
    isActive: true,
  },
];

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Insert users
    console.log('👥 Inserting users...');
    for (const user of sampleUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    // Insert products
    console.log('🌾 Inserting products...');
    for (const product of sampleProducts) {
      await db.insert(products).values(product).onConflictDoNothing();
    }

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
