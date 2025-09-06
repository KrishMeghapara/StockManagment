# Stock Management System

A full-stack inventory management system built with Node.js, Express, MongoDB, React, and TypeScript.

## Features

- **Authentication & Authorization** - Role-based access (Owner, Manager, Staff)
- **Product Management** - Add, edit, view products with categories and suppliers
- **Inventory Tracking** - Real-time stock levels and low stock alerts
- **Sales Management** - Create sales, generate invoices
- **Purchase Management** - Record purchases and update inventory
- **Reports & Analytics** - Sales reports, inventory reports, profit analysis
- **User Management** - Manage system users and permissions

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Express validation & rate limiting

### Frontend
- React 18 + TypeScript
- Material-UI (MUI) components
- React Router for navigation
- TanStack Query for data fetching
- Axios for API calls
- Recharts for analytics

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KrishMeghapara/StockManagment.git
   cd StockManagment
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure Backend Environment**
   ```bash
   cd Backend
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

4. **Start Development Servers**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend server on http://localhost:5173

### Default Login
- Username: `admin` (you'll need to create this user first)
- Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales & Purchases
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/purchases` - List purchases
- `POST /api/purchases` - Create purchase

## Project Structure

```
StockManagment/
├── Backend/
│   ├── config/          # Database and auth configuration
│   ├── middleware/      # Authentication and role checking
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route handlers
│   └── server.js        # Express server setup
├── Frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API and auth services
│   │   └── hooks/       # Custom React hooks
│   └── package.json
└── package.json         # Root package for scripts
```

## Development

### Backend Development
```bash
cd Backend
npm run dev  # Starts with nodemon
```

### Frontend Development
```bash
cd Frontend
npm run dev  # Starts Vite dev server
```

### Building for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.