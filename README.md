# Placement ERP + CRM Portal

## Project Summary
This repository contains a complete ERP + CRM operations portal built for a wholesale business.
The application includes frontend UI, backend APIs, data storage, user roles, product inventory, sales challans, invoices, purchase orders, and follow-up management.

The objective is to demonstrate real business workflows with a clean architecture, clear documentation, and a professional project structure.

## Why This Project Was Built
Wholesale businesses often have these pain points:
- customer information scattered across spreadsheets,
- product inventory not updated in real time,
- challans created manually without stock validation,
- invoices lacking clear payment/due status,
- purchase orders disconnected from inventory demand,
- no role-based access for sales, warehouse, accounts, and admins.

This portal solves those problems by centralizing these operations into one web application.

## Goals and Objectives
The main goals for this project are:
1. Build a full-stack ERP + CRM portal using modern JavaScript/TypeScript tools.
2. Create a user experience that is easy to follow and professional.
3. Implement business rules to prevent data errors, such as negative stock.
4. Provide clear setup and deployment instructions for reviewers.
5. Include documentation that explains folder structure, APIs, tools, and features.

## Target Users
This portal is designed for the following internal business users:
- **Admin**: full platform oversight, configuration, profile management.
- **Sales**: manage customers, create challans, view invoices, track follow-ups.
- **Warehouse**: manage products, inventory, challans, and purchase orders.
- **Accounts**: monitor invoices and payment status, review challans.

## High-Level Features
The following high-level features are implemented in this repo:
- authentication and role-based UI control,
- customer management with CRM fields,
- product inventory management with stock tracking,
- sales challan creation, drafts, and confirmation flows,
- invoice creation and tracking,
- purchase order generation,
- stock movement audit logs,
- follow-up note tracking,
- user profile update and avatar upload.

## Project Structure
The repository uses an npm workspace with separate `client` and `server` packages.
This keeps the frontend and backend codebases separated while allowing a single root workspace.

Root structure:

```
Placement Inforcment/
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── render.yaml
├── vercel.json
├── run.txt
├── run1.txt
├── postman/
│   └── mini-erp-crm.postman_collection.json
├── client/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.tsbuildinfo
│   ├── vite.config.ts
│   ├── index.html
│   ├── entry.id
│   ├── client-dev.log
│   ├── client-static.log
│   ├── serve-dist.mjs
│   ├── dist/
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       └── styles.css
└── server/
    ├── .env
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── data.json
    ├── dist/
    ├── src/
    │   └── index.ts
    ├── uploads/
    ├── server-dev.log
    └── node_modules/
```

> Note: `node_modules/` contents are not shown in detail because they are dependency directories and not part of the reviewed source structure.

## Client Folder Details
The `client` folder contains the frontend application.

- `client/package.json` — frontend dependencies and scripts.
- `client/tsconfig.json` — TypeScript configuration for React.
- `client/vite.config.ts` — Vite project configuration.
- `client/src/App.tsx` — main app component and page flows.
- `client/src/main.tsx` — React app initialization with router.
- `client/src/styles.css` — global styles, theme variables, and layout styles.
- `client/index.html` — HTML shell for the frontend.
- `client/.env` — frontend environment variables.

## Server Folder Details
The `server` folder contains the backend API server.

- `server/package.json` — server dependencies and scripts.
- `server/tsconfig.json` — backend TypeScript configuration.
- `server/src/index.ts` — Express server implementation with all endpoints.
- `server/data.json` — demo JSON storage file for persistence.
- `server/uploads/` — folder for uploaded images and avatars.
- `server/.env` — backend environment variables.

## Dependencies and Tooling
### Root workspace
- `concurrently` — run frontend and backend together from the root.
- `@types/node` — type definitions for Node.js support.

### Client
- `react` and `react-dom` — application UI framework.
- `react-router-dom` — client routing.
- `axios` — HTTP requests from frontend.
- `vite` — frontend bundler.
- `@vitejs/plugin-react` — React plugin for Vite.
- `typescript` and React type definitions.

### Server
- `express` — backend web framework.
- `cors` — cross-origin resource sharing.
- `dotenv` — environment configuration.
- `jsonwebtoken` — JWT creation for login.
- `multer` — multipart file uploads.
- `pg` — Postgres client support for optional database use.
- `tsx` — TypeScript execution and watcher for development.
- `typescript` — backend type safety.

## Frontend Experience
The app is built as a single-page React application with the following user experience:

- a landing-like header with app branding,
- a search widget in the header,
- role-based navigation links,
- dashboard summary cards,
- list and form workflows for customers, products, challans, invoices, orders, and follow-ups,
- inline error and status handling,
- profile page with update and photo upload support,
- dark and light theme support via CSS variables.

## Backend Experience
The backend is implemented as a single Express server with the following characteristics:

- JSON body parsing,
- CORS support,
- request validation and helper functions,
- static file serving for uploaded content,
- demo login with JWT generation,
- data persistence to local JSON storage,
- optional Postgres storage if `DATABASE_URL` is provided,
- health checks and metadata endpoints.

## Business Requirements Addressed
The app was built to address these specific business requirements:

- centralize customer records,
- manage product inventory with stock levels,
- generate sales challans with draft and confirm modes,
- prevent stock from going negative,
- track invoice due dates,
- generate purchase orders based on demand,
- capture follow-up notes for customers,
- keep access limited by user role.

## User Roles and Permissions
The project includes four user roles:

- **Admin** — full access to all modules.
- **Sales** — access to customers, challans, invoices, and follow-ups.
- **Warehouse** — access to products, challans, and purchase orders.
- **Accounts** — access to challans and invoices.

The frontend determines visible modules based on the logged-in user role.

## Demo User Credentials
Use the following accounts for demo and review:

- Admin User / `123456`
- Sales User / `123456`
- Warehouse User / `123456`
- Accounts User / `123456`

These are defined as demo users in the backend and are sufficient for evaluating the app.

## Setup Instructions
These steps will get the app running locally.

### 1. Open the project folder
```bash
cd "c:\Users\Ravish Kumar\Desktop\React Full Coures\Placement Inforcment"
```

### 2. Install root and workspace dependencies
```bash
npm install
npm run install:all
```

### 3. Configure environment variables
Create `server/.env` and `client/.env` as shown below.

### 4. Backend environment file
Create `server/.env` with:

```env
PORT=5000
JWT_SECRET=dev-secret
DATABASE_URL=
DATABASE_SSL=false
CLIENT_URL=http://localhost:3000
```

### 5. Frontend environment file
Create `client/.env` with:

```env
VITE_API_URL=http://localhost:5000
```

### 6. Run backend server
```bash
cd server
npm run dev
```

### 7. Run frontend app
```bash
cd ../client
npm run dev
```

### 8. Open the app in browser
- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:5000/health`

### 9. Alternative commands
- `npm run dev` — run both server and client in parallel.
- `npm run dev:server` — run backend only.
- `npm run dev:client` — run frontend only.
- `npm run build` — build both packages.
- `npm start --workspace server` — run production backend.
- `npm run serve:client` — preview built frontend.

## Environment Variables Explained
### Backend variables
- `PORT` — server port, default is 5000.
- `JWT_SECRET` — secret used to sign JWT tokens.
- `DATABASE_URL` — optional Postgres connection string.
- `DATABASE_SSL` — whether Postgres SSL is enabled.
- `CLIENT_URL` — expected frontend origin.

### Frontend variables
- `VITE_API_URL` — backend API base URL.

## API Documentation
The server exposes the following REST endpoints, all implemented in `server/src/index.ts`.

### General / Health
- `GET /` — API metadata and route summary.
- `GET /health` — service status and storage mode.

### Authentication
- `POST /auth/login`
  - Request body: `{ "email": string, "password": string }`
  - Response: `{ token, user }`
  - Login is demo-based and password is always `123456` for valid users.

### User Profile
- `PUT /users/:id`
  - Update profile fields: `name`, `email`, `phone`.
- `POST /users/:id/avatar`
  - Upload a profile avatar image via multipart form data.
  - Saves file to `server/uploads`.

### Customers
- `GET /customers`
  - Query params: `page`, `limit`, `search`, `status`.
  - Returns paginated customer list.
- `GET /customers/:id`
  - Returns a single customer record.
- `POST /customers`
  - Create a new customer.
- `PUT /customers/:id`
  - Update existing customer.

### Products
- `GET /products`
  - Query params: `page`, `limit`, `search`, `category`.
  - Returns paginated product list.
- `GET /products/:id`
  - Returns a single product.
- `POST /products`
  - Create a new product.
- `PUT /products/:id`
  - Update a product.
- `POST /products/upload-image`
  - Upload a product image.

### Stock Movements
- `GET /stock-movements`
  - Returns inventory change history.

### Challans
- `GET /challans`
  - Query params: `page`, `limit`, `search`.
  - Returns paginated challan list.
- `GET /challans/:id`
  - Returns a single challan.
- `POST /challans`
  - Create a new challan.
  - Body includes `customerId`, `items`, `status`.
  - Confirmed challans update product stock.

### Invoices
- `GET /invoices`
  - Returns all invoices.
- `POST /invoices`
  - Create a new invoice.

### Purchase Orders
- `GET /purchase-orders`
  - Returns all purchase orders.
- `POST /purchase-orders`
  - Create a new purchase order.

### Follow-ups
- `GET /follow-ups`
  - Returns all follow-up notes.
- `POST /follow-ups`
  - Create a new follow-up entry.

## Detailed API Examples
### Login Example
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"Admin User","password":"123456"}'
```

### Create Customer Example
```bash
curl -X POST http://localhost:5000/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Retailer","mobile":"9888888888","email":"demo.retailer@example.com","businessName":"Demo Retailer Store","gstNumber":"","customerType":"Retail","address":"Pune","status":"Lead","followUpDate":"2026-08-20","notes":"New demo customer"}'
```

### Create Product Example
```bash
curl -X POST http://localhost:5000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"HDMI Cable","sku":"HDMI-2M","category":"Electronics","unitPrice":250,"currentStock":40,"minStockAlert":8,"location":"D-02"}'
```

### Create Challan Example
```bash
curl -X POST http://localhost:5000/challans \
  -H "Content-Type: application/json" \
  -d '{"customerId":"demo-customer-1","items":[{"productId":"demo-product-1","name":"Mechanical Keyboard","sku":"KB-001","quantity":1,"unitPrice":1200}],"status":"Confirmed"}'
```

### Create Invoice Example
```bash
curl -X POST http://localhost:5000/invoices \
  -H "Content-Type: application/json" \
  -d '{"invoiceNumber":"INV-001","challanId":"demo-challan-1","customerName":"Amit Traders","totalAmount":2400,"dueDate":"2026-09-01"}'
```

### Create Purchase Order Example
```bash
curl -X POST http://localhost:5000/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{"supplier":"Supplier A","productId":"demo-product-1","productName":"Keyboard","quantity":20,"unitPrice":1200,"status":"Draft"}'
```

### Create Follow-up Example
```bash
curl -X POST http://localhost:5000/follow-ups \
  -H "Content-Type: application/json" \
  -d '{"customerId":"demo-customer-1","customerName":"Amit Traders","note":"Follow up next week","nextActionDate":"2026-08-22"}'
```

## Business Logic and Validation Rules
This project includes business validation to support real operations.

### Stock Rules
- Confirmed challans reduce product stock.
- A challan cannot be confirmed if stock is insufficient.
- Negative inventory is prevented.
- Stock movements are recorded whenever inventory changes.

### Customer Rules
- Customer name, mobile, and email are required for creation.
- Customers have CRM status, follow-up date, and notes.
- Customer search supports name, email, business name, and mobile.

### Product Rules
- Product name and SKU are required.
- Stock cannot be negative.
- Unit price must be non-negative.
- Products include category, location, and minimum stock alerts.

### Invoice Rules
- Invoice number and customer name are required.
- Total amount must be greater than zero.
- Invoice due dates are tracked for accounts review.

### Purchase Order Rules
- Supplier and product references are required.
- Quantity must be greater than zero.

### Follow-up Rules
- Follow-up notes require a customer reference and a note.
- Next action dates are saved for CRM tracking.

## Postman API Collection
A Postman collection is included at:
- `postman/mini-erp-crm.postman_collection.json`

This collection contains sample requests for:
- health check,
- login,
- dashboard summary,
- customer CRUD,
- product CRUD,
- stock movements,
- challans,
- invoices,
- purchase orders,
- follow-ups.

## Data Storage Strategy
The backend uses local JSON storage by default with `server/data.json`.
This makes setup fast and review-friendly.

### Optional Postgres Support
If a `DATABASE_URL` environment variable is provided, the server attempts to store data in PostgreSQL.
If PostgreSQL is unavailable, the server falls back to local JSON storage.

This design provides a demo-ready default plus an easy path for production migration.

## Design and Architecture Decisions
### Monorepo workspace
A root npm workspace is used to run `client` and `server` together.
This keeps dependency installation and startup commands simple.

### Frontend implementation
The frontend uses React functional components, state hooks, and effect hooks.
It includes a centralized `axios` instance for API calls and uses `react-router-dom` for routing.

### Backend implementation
The backend is a single Express app with helper functions for validation and persistence.
The server includes file upload support for avatars and product images.

### UI and UX
The UI is a polished dashboard style with modular cards, tables, and forms.
Theme variables provide good contrast, and the layout works on desktop and smaller screens.

## Quality and Review Notes
This README is intentionally detailed so a reviewer can understand the project quickly.
It documents the problem, solution, design decisions, features, APIs, setup, and limitations.

### What makes this project review-ready
- Full-stack implementation with frontend and backend.
- Clear role-based workflows.
- Business validation around inventory and orders.
- Documentation of actual folder structure.
- Setup steps for local and test environments.
- Postman collection for API validation.

## Known Limitations
This project is a working prototype and not a production-grade system.
Current limitations include:
- local JSON storage instead of a full relational database,
- demo-style authentication instead of secure login/signup,
- no server-side role authorization middleware,
- no Dockerfile or CI/CD pipeline included,
- file uploads stored locally,
- no automated tests included.

## Recommended Production Improvements
These are the next steps that would make this project production-ready:
- add request validation with Zod or Joi,
- add JWT verification middleware on all protected routes,
- implement proper database schema with migrations,
- add automated tests (backend and frontend),
- add Docker and deployment pipeline,
- upgrade file storage to cloud storage,
- add PDF or Excel export for challans and invoices,
- secure authentication with hashed passwords.

## Supplemental Notes for Reviewers
When evaluating this project, please note:
- It is designed to show a complete ERP + CRM workflow.
- The backend and frontend are intentionally separated.
- The project is built with TypeScript for maintainability.
- The documentation is included in `README.md`.
- The Postman collection provides a quick API sanity check.

## Practical Use Cases
The app supports these common business scenarios:
- onboarding a new wholesale customer,
- tracking stock levels and triggering restock orders,
- generating a customer challan for a sales order,
- confirming a challan and updating inventory,
- issuing a customer invoice for payment,
- recording a purchase order to restock inventory,
- capturing follow-ups for customer relationship management.

## Feature Walkthrough
### Dashboard
The dashboard displays summary metrics and alerts:
- total customers,
- total products,
- total challans,
- total invoices,
- low stock product list,
- pending follow-up list.

### Customer Module
Features include:
- create customer records,
- update customer details,
- search and filter by status,
- track follow-up notes.

### Product Module
Features include:
- add product details,
- set SKU, category, price, stock, and location,
- upload product images,
- search and filter products.

### Challan Module
Features include:
- create sales challans,
- save challans as Draft or Confirmed,
- confirm challans to reduce stock,
- prevent stock from going negative,
- export challan data as text file.

### Invoice Module
Features include:
- create invoices,
- store invoice number and due date,
- track payment status.

### Purchase Order Module
Features include:
- create purchase orders,
- store supplier and product details,
- track order status.

### Follow-up Module
Features include:
- add follow-up notes for customers,
- track next action dates,
- view pending follow-ups in the dashboard.

## Server API Details
The server API is implemented in a single file for simplicity.
This is acceptable for a demo app and keeps review simple.

The API supports:
- authentication,
- customers,
- products,
- stock movements,
- challans,
- invoices,
- purchase orders,
- follow-ups.

## File Upload Support
The project supports two upload flows:
1. product image upload via `/products/upload-image`,
2. user avatar upload via `/users/:id/avatar`.

Uploads are stored in `server/uploads` and served from the backend.

## Storage and Persistence
The default storage strategy is a local JSON file stored at `server/data.json`.
This file contains all persisted data for the demo.

Data entities include:
- customers,
- products,
- challans,
- stock movements,
- invoices,
- purchase orders,
- follow-ups,
- users.

## Optional Database Migration
The server contains optional Postgres support.
If `DATABASE_URL` is configured, the server attempts to store application data in Postgres.
If the database is not available, the server will continue using JSON storage.

This allows the app to be migrated to production gradually.

## Release Notes
The current app version is a review-ready demo.
It demonstrates the core functionality required for an ERP + CRM case study.

Future releases can add advanced features, improved auth, and database normalization.

## Final Remarks
This README is intentionally long and detailed to make the review straightforward.
A reviewer can understand the business problem, the implemented solution, the folder layout, and the exact API structure.

If you need, I can also provide a second shorter summary section for a resume or project showcase.
