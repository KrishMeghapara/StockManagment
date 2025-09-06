# Stock Management System Backend - MVP Implementation

## Core Files to Create:
1. **package.json** - Dependencies and scripts
2. **server.js** - Main server entry point
3. **config/database.js** - MongoDB connection
4. **config/auth.js** - JWT configuration
5. **models/User.js** - User schema with roles
6. **models/Category.js** - Product category schema
7. **models/Product.js** - Product schema
8. **models/Supplier.js** - Supplier schema
9. **models/Purchase.js** - Purchase order schema
10. **models/Sale.js** - Sales transaction schema
11. **models/StockTransaction.js** - Stock movement tracking
12. **routes/auth.js** - Authentication routes
13. **routes/products.js** - Product CRUD routes
14. **routes/categories.js** - Category CRUD routes
15. **routes/suppliers.js** - Supplier CRUD routes
16. **routes/purchases.js** - Purchase management routes
17. **routes/sales.js** - Sales management routes
18. **routes/reports.js** - Reporting endpoints
19. **middleware/auth.js** - Authentication middleware
20. **middleware/roleCheck.js** - Role-based access control

## Key Features Implementation:
- JWT-based authentication
- Role-based permissions (Owner/Manager, Staff)
- Complete CRUD operations for all entities
- Stock level tracking and low stock alerts
- Purchase order management
- Sales and invoice generation
- Reporting with filters
- Data validation and error handling

## Database Collections:
- users (authentication & roles)
- categories (product categorization)
- products (inventory items)
- suppliers (vendor management)
- purchases (purchase orders)
- sales (sales transactions)
- stockTransactions (stock movements)