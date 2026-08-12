# Mini ERP + CRM Operations Portal

Full-stack mini ERP/CRM portal for a wholesale/distribution company. The app covers customer CRM, products, inventory, stock movements, sales challans, invoices, purchase orders, role-based login, profile editing and image upload.

## Tech Stack
- Backend: Node.js, TypeScript, Express.js
- Frontend: React, TypeScript, Vite, CSS
- Auth: JWT-based login response with role-aware frontend access
- Demo storage: local JSON file at `server/data.json`
- Uploads: local Express static uploads folder

Note: The assignment asks for PostgreSQL/MySQL. This submitted local demo currently uses JSON storage to keep setup simple. For production, replace the store layer with PostgreSQL/MySQL using the same REST API contracts.

## Features Implemented
- Login for Admin, Sales, Warehouse and Accounts
- Frontend role-based module access
- Customer CRM: add, edit, search, filter, detail panel and follow-up notes
- Product inventory: add, edit, image upload, stock alert quantity and warehouse location
- Stock movement log: visible on dashboard and updated when confirmed challans reduce stock
- Sales challans: automatic challan number, Draft/Confirmed status, product snapshot storage, stock reduction and insufficient stock errors
- Invoices and purchase orders
- Dashboard with summary cards, low stock alerts, follow-ups and stock movement log
- Profile page with edit profile, photo upload and logout
- Demo data for customers, products, challans, invoices, purchase orders and follow-ups
- Postman collection included

## Demo Credentials
- Admin User / 123456
- Sales User / 123456
- Warehouse User / 123456
- Accounts User / 123456

Email-style login also works:
- admin@minierp.local / 123456
- sales@minierp.local / 123456
- warehouse@minierp.local / 123456
- accounts@minierp.local / 123456

## Local Setup
Install dependencies:

```bash
npm install
npm run install:all
```

Start backend:

```bash
npm run dev --workspace server
```

Start frontend:

```bash
npm run dev --workspace client
```

If Vite dev server has a local permission issue, build once and serve the built frontend:

```bash
npm run build --workspace client
npm run serve:dist --workspace client
```

Open:
- Frontend: `http://localhost:3000` or `http://127.0.0.1:3000`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

## Environment Variables
Backend:

```env
PORT=5000
JWT_SECRET=dev-secret
```

Frontend:

```env
VITE_API_URL=http://localhost:5000
```

## Easy Run Commands
Backend only:

```bash
npm run dev:server
```

Frontend dev server:

```bash
npm run dev:client
```

Build both:

```bash
npm run build
```

Serve built frontend:

```bash
npm run serve:client
```

## Main API Endpoints
- `POST /auth/login`
- `GET /dashboard`
- `GET /customers?page=1&limit=5&search=&status=All`
- `GET /customers/:id`
- `POST /customers`
- `PUT /customers/:id`
- `GET /products?page=1&limit=5&search=&category=All`
- `GET /products/:id`
- `POST /products`
- `PUT /products/:id`
- `POST /products/upload-image`
- `GET /stock-movements`
- `GET /challans?search=`
- `GET /challans/:id`
- `POST /challans`
- `GET /invoices`
- `POST /invoices`
- `GET /purchase-orders`
- `POST /purchase-orders`
- `GET /follow-ups`
- `POST /follow-ups`
- `PUT /users/:id`
- `POST /users/:id/avatar`

## Business Logic
- Confirmed challans reduce product stock.
- Stock cannot go negative.
- If stock is insufficient, API returns HTTP `400` with a clear error message.
- Challan items store product snapshot fields: product id, name, SKU, quantity and unit price.
- Stock movement records include product, quantity, movement type, reason, created by and timestamp.

## Postman
Import:

```text
postman/mini-erp-crm.postman_collection.json
```

The collection includes health, login, customers, products, challans, invoices, purchase orders and follow-ups.

## Build Verification

```bash
npm run build --workspace server
npm run build --workspace client
```

## Deployment Guide
Suggested free deployment:
- Frontend: Vercel or Netlify
- Backend: Render, Railway or Fly.io
- Database: Supabase Postgres, Neon Postgres or Render Postgres

Render backend:
- Root/app directory: `server`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Env vars: `PORT`, `JWT_SECRET`

Vercel frontend:
- Root/app directory: `client`
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Env var: `VITE_API_URL=https://your-backend-url`

## Architecture
- React frontend calls REST APIs through Axios.
- Express backend owns validation, persistence and business rules.
- Current persistence is JSON for demo speed.
- Role access is enforced in the frontend routing layer for this case study demo.

## Known Limitations
- PostgreSQL/MySQL is not wired yet; JSON storage is used for the local demo.
- Backend JWT middleware is not enforced on every protected route yet.
- Invoice export is currently text export for challans, not a true PDF.
- File uploads are local server uploads, not AWS S3.
- Frontend challan form currently creates one product line at a time; the backend API supports multiple items.

## Submission Checklist
- GitHub repository link: add after pushing to GitHub
- Live frontend URL: add after deployment
- Live backend API URL: add after deployment
- Test credentials: listed above
- Postman collection: included
- README: included
- Architecture summary: included
- Known limitations: included
