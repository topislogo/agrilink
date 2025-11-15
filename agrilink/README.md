# AgriLink Marketplace

> **Agricultural Marketplace Platform - Connecting Farmers, Traders, and Buyers**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)

A comprehensive agricultural marketplace platform built with Next.js, featuring user verification, product management, and real-time communication.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Verification System**: Phone, email, and document verification with admin approval
- **Product Management**: Create, edit, and manage agricultural products
- **Image Storage**: AWS S3 with CloudFront CDN for fast image delivery
- **Real-time Chat**: In-app messaging between buyers and sellers
- **Admin Dashboard**: Comprehensive admin panel for user and content management
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL
- **Storage**: AWS S3 with CloudFront CDN
- **Authentication**: JWT tokens
- **Email**: Resend
- **SMS**: Twilio
- **Deployment**: Vercel

## 📚 Documentation

### Setup Guides
- [Environment Variables Guide](docs/ENVIRONMENT_VARIABLES_GUIDE.md) - Complete environment setup
- [CloudFront Setup Guide](docs/cloudfront-setup.md) - AWS S3 + CloudFront CDN setup
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Step-by-step deployment to Vercel

### Requirements
- [Business Requirements](docs/BUSINESS_REQUIREMENTS_DOCUMENT.md)
- [Functional Requirements](docs/FUNCTIONAL_REQUIREMENTS.md)
- [System Requirements](docs/SYSTEM_REQUIREMENTS_SPECIFICATION.md)
- [Use Cases & User Stories](docs/USE_CASES_AND_USER_STORIES.md)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- AWS account (for S3 + CloudFront)
- Resend account (for emails)
- Twilio account (for SMS)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/agrilink-marketplace.git
   cd agrilink-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

See [Environment Variables Guide](docs/ENVIRONMENT_VARIABLES_GUIDE.md) for complete setup.

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/agrilink_db"

# Security
JWT_SECRET="your-128-character-jwt-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AWS S3 + CloudFront
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="eu-central-1"
AWS_S3_BUCKET="your-s3-bucket"
NEXT_PUBLIC_CLOUDFRONT_DOMAIN="your-cloudfront-domain"

# Email & SMS
RESEND_API_KEY="your-resend-key"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard pages
│   ├── dashboard/         # User dashboard
│   ├── login/             # Authentication pages
│   ├── register/          # User registration
│   └── ...
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── AdminDashboard.tsx
│   ├── ProductCard.tsx
│   └── ...
├── lib/                  # Utility libraries
│   ├── db/               # Database configuration
│   ├── s3-upload.ts      # AWS S3 upload service
│   ├── cloudfront-utils.ts
│   └── ...
└── services/             # Business logic services
    ├── api.ts
    ├── offers.ts
    └── ...
```

## 🚀 Deployment

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy!

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

### AWS Setup
1. Create S3 bucket
2. Set up CloudFront distribution
3. Configure Origin Access Control
4. Update S3 bucket policy

See [CloudFront Setup Guide](docs/cloudfront-setup.md) for detailed instructions.

## 🧪 Testing

### Demo Accounts
See [Demo Accounts](docs/DEMO_ACCOUNTS.pdf) for test user credentials.

### Test Features
- User registration and verification
- Product creation and management
- Image upload and display
- Admin panel functionality
- Real-time messaging

## 📊 Performance

### CloudFront CDN
- **Image Loading**: 10-50ms globally
- **Cache Hit Ratio**: 95%+ for static assets
- **Cost Savings**: ~80% reduction in S3 request costs

### Database Optimization
- Indexed queries for fast lookups
- Connection pooling for scalability
- Optimized migrations

## 🔒 Security

- JWT-based authentication
- Input validation and sanitization
- HTTPS enforcement
- S3 bucket access restrictions
- CloudFront Origin Access Control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Create a GitHub issue
- **Email**: support@agrilink.com

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced search and filtering
- [ ] Payment integration
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] API documentation

---
## 🔗 Links

- **GitHub Repository**: [https://github.com/topislogo/agrilink-app](https://github.com/topislogo/agrilink-app)

Built with ❤️ for the agricultural community
