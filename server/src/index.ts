import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json());
app.use((error: SyntaxError, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if ('body' in error) {
    return res.status(400).json({ message: 'Invalid JSON request body' });
  }
  return next(error);
});

const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => cb(null, uploadDir),
  filename: (_req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
  email: string;
  phone?: string;
  avatarUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: string;
  address: string;
  status: string;
  followUpDate: string;
  notes: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  imageUrl?: string;
}

interface ChallanItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName: string;
  items: ChallanItem[];
  totalQuantity: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  createdBy: string;
  createdAt: string;
}

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  timestamp: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  challanId: string;
  customerName: string;
  totalAmount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  status: 'Draft' | 'Confirmed';
  createdAt: string;
}

interface FollowUp {
  id: string;
  customerId: string;
  customerName: string;
  note: string;
  nextActionDate: string;
  createdAt: string;
}

const users: User[] = [
  { id: 'demo-admin', name: 'Admin User', email: 'admin@minierp.local', role: 'Admin' },
  { id: 'demo-sales', name: 'Sales User', email: 'sales@minierp.local', role: 'Sales' },
  { id: 'demo-warehouse', name: 'Warehouse User', email: 'warehouse@minierp.local', role: 'Warehouse' },
  { id: 'demo-accounts', name: 'Accounts User', email: 'accounts@minierp.local', role: 'Accounts' }
];

type Store = {
  customers: Customer[];
  products: Product[];
  challans: Challan[];
  stockMovements?: StockMovement[];
  invoices?: Invoice[];
  purchaseOrders?: PurchaseOrder[];
  followUps?: FollowUp[];
  users?: User[];
};

const storagePath = new URL('../data.json', import.meta.url);
const databaseUrl = process.env.DATABASE_URL;
let dbPool: { query: (text: string, params?: unknown[]) => Promise<{ rows: Array<{ data?: Store }> }> } | null = null;
let storageMode: 'json' | 'postgres' = 'json';

function readStore() {
  try {
    const raw = fs.readFileSync(storagePath, 'utf8');
    return JSON.parse(raw) as Store;
  } catch {
    return { customers: [], products: [], challans: [], stockMovements: [], invoices: [], purchaseOrders: [], followUps: [], users };
  }
}

function writeStore(store: Store) {
  fs.writeFileSync(storagePath, JSON.stringify(store, null, 2));
}

async function createPostgresPool() {
  if (!databaseUrl) return null;
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<{ Pool: new (config: Record<string, unknown>) => { query: (text: string, params?: unknown[]) => Promise<{ rows: Array<{ data?: Store }> }> } }>;
  const { Pool } = await dynamicImport('pg');
  return new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
}

function applyStore(store: Store) {
  customers = store.customers || [];
  products = store.products || [];
  challans = store.challans || [];
  stockMovements = store.stockMovements || [];
  invoices = store.invoices || [];
  purchaseOrders = store.purchaseOrders || [];
  followUps = store.followUps || [];
  users.splice(0, users.length, ...(store.users?.length ? store.users : users));
}

function currentStore(): Store {
  return { customers, products, challans, stockMovements, invoices, purchaseOrders, followUps, users };
}

async function writeStoreToPostgres(store: Store) {
  if (!dbPool) return;
  await dbPool.query(
    `insert into app_store (id, data, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (id) do update set data = excluded.data, updated_at = now()`,
    ['main', JSON.stringify(store)]
  );
}

async function initializePostgresStore() {
  if (!databaseUrl) return;
  try {
    dbPool = await createPostgresPool();
    if (!dbPool) return;
    await dbPool.query('create table if not exists app_store (id text primary key, data jsonb not null, updated_at timestamptz not null default now())');
    const result = await dbPool.query('select data from app_store where id = $1', ['main']);
    if (result.rows[0]?.data) {
      applyStore(result.rows[0].data);
    } else {
      await writeStoreToPostgres(currentStore());
    }
    storageMode = 'postgres';
    console.log('Postgres storage connected');
  } catch (error) {
    dbPool = null;
    storageMode = 'json';
    console.warn('Postgres storage unavailable, using local JSON fallback');
    console.warn(error instanceof Error ? error.message : error);
  }
}

const initialStore = readStore();
let customers = initialStore.customers.length ? initialStore.customers : [
  {
    id: randomUUID(),
    name: 'Amit Traders',
    mobile: '9876543210',
    email: 'amit@example.com',
    businessName: 'Amit Traders Pvt Ltd',
    gstNumber: '27ABCDE1234F1Z5',
    customerType: 'Wholesale',
    address: 'Mumbai',
    status: 'Active',
    followUpDate: '2026-08-15',
    notes: 'Prefer same-day delivery.'
  }
];
let products = initialStore.products.length ? initialStore.products : [
  { id: randomUUID(), name: 'Keyboard', sku: 'KB-001', category: 'Electronics', unitPrice: 1200, currentStock: 20, minStockAlert: 5, location: 'A-01' },
  { id: randomUUID(), name: 'Mouse', sku: 'MS-002', category: 'Electronics', unitPrice: 700, currentStock: 10, minStockAlert: 3, location: 'A-02' }
];
let challans = initialStore.challans;
let stockMovements = initialStore.stockMovements || [];
let invoices = initialStore.invoices || [];
let purchaseOrders = initialStore.purchaseOrders || [];
let followUps = initialStore.followUps || [];
if (initialStore.users?.length) {
  users.splice(0, users.length, ...initialStore.users);
}

function persistStore() {
  const store = currentStore();
  writeStore(store);
  if (dbPool) {
    void writeStoreToPostgres(store).catch((error) => console.warn('Postgres save failed:', error instanceof Error ? error.message : error));
  }
}

function isNonEmpty(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
}

function badRequest(res: express.Response, message: string) {
  return res.status(400).json({ message });
}

function matchesQuery(values: Array<string | undefined>, query: string) {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return values.join(' ').toLowerCase().includes(normalized);
}

app.get('/', (_req, res) => {
  res.json({
    name: 'Mini ERP + CRM Operations Portal API',
    status: 'running',
    storage: storageMode,
    frontendUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    docs: {
      health: '/health',
      dashboard: '/dashboard',
      login: 'POST /auth/login',
      customers: '/customers',
      products: '/products',
      challans: '/challans',
      invoices: '/invoices',
      purchaseOrders: '/purchase-orders',
      followUps: '/follow-ups'
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', storage: storageMode });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const loginText = String(email || '').toLowerCase();
  const matchedUser = users.find((user) => user.name.toLowerCase().includes(loginText) || user.email.toLowerCase() === loginText);

  if (!matchedUser || password !== '123456') {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: matchedUser.id, role: matchedUser.role, name: matchedUser.name }, jwtSecret, { expiresIn: '8h' });
  return res.json({ token, user: matchedUser });
});

app.put('/users/:id', (req, res) => {
  const userIndex = users.findIndex((entry) => entry.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { name, email, phone } = req.body as Partial<User>;
  users[userIndex] = {
    ...users[userIndex],
    name: name || users[userIndex].name,
    email: email || users[userIndex].email,
    phone
  };
  persistStore();
  return res.json(users[userIndex]);
});

app.post('/users/:id/avatar', upload.single('avatar'), (req: express.Request, res: express.Response) => {
  const userIndex = users.findIndex((entry) => entry.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No avatar uploaded' });
  }

  users[userIndex].avatarUrl = `/uploads/${req.file.filename}`;
  persistStore();
  return res.json(users[userIndex]);
});

app.get('/customers', (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(20, Number(req.query.limit || 5)));
  const search = String(req.query.search || '');
  const status = String(req.query.status || '');
  const filtered = customers.filter((customer) =>
    matchesQuery([customer.name, customer.email, customer.businessName, customer.mobile], search) &&
    (!status || status === 'All' || customer.status === status)
  );
  const start = (page - 1) * limit;
  res.json({ items: filtered.slice(start, start + limit), total: filtered.length, page, limit });
});

app.get('/customers/:id', (req, res) => {
  const customer = customers.find((entry) => entry.id === req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  return res.json(customer);
});

app.post('/customers', (req, res) => {
  if (!isNonEmpty(req.body.name)) return badRequest(res, 'Customer name is required');
  if (!isNonEmpty(req.body.mobile)) return badRequest(res, 'Mobile number is required');
  if (!isNonEmpty(req.body.email)) return badRequest(res, 'Email is required');
  const customer: Customer = { id: randomUUID(), ...req.body };
  customers.push(customer);
  persistStore();
  res.status(201).json(customer);
});

app.put('/customers/:id', (req, res) => {
  const customerIndex = customers.findIndex((entry) => entry.id === req.params.id);
  if (customerIndex === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  customers[customerIndex] = { ...customers[customerIndex], ...req.body };
  persistStore();
  return res.json(customers[customerIndex]);
});

app.get('/products', (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(20, Number(req.query.limit || 5)));
  const search = String(req.query.search || '');
  const category = String(req.query.category || '');
  const filtered = products.filter((product) =>
    matchesQuery([product.name, product.sku, product.category, product.location], search) &&
    (!category || category === 'All' || product.category === category)
  );
  const start = (page - 1) * limit;
  res.json({ items: filtered.slice(start, start + limit), total: filtered.length, page, limit });
});

app.get('/products/:id', (req, res) => {
  const product = products.find((entry) => entry.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  return res.json(product);
});

app.post('/products', (req, res) => {
  if (!isNonEmpty(req.body.name)) return badRequest(res, 'Product name is required');
  if (!isNonEmpty(req.body.sku)) return badRequest(res, 'SKU is required');
  if (Number(req.body.currentStock) < 0) return badRequest(res, 'Current stock cannot be negative');
  if (Number(req.body.unitPrice) < 0) return badRequest(res, 'Unit price cannot be negative');
  const product: Product = { id: randomUUID(), ...req.body };
  products.push(product);
  persistStore();
  res.status(201).json(product);
});

app.post('/products/upload-image', upload.single('image'), (req: express.Request, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({ imageUrl });
});

app.put('/products/:id', (req, res) => {
  const productIndex = products.findIndex((entry) => entry.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  products[productIndex] = { ...products[productIndex], ...req.body };
  persistStore();
  return res.json(products[productIndex]);
});

app.get('/challans', (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(20, Number(req.query.limit || 5)));
  const search = String(req.query.search || '');
  const filtered = challans.filter((challan) => matchesQuery([challan.challanNumber, challan.customerName, challan.status], search));
  const start = (page - 1) * limit;
  res.json({ items: filtered.slice(start, start + limit), total: filtered.length, page, limit });
});

app.get('/challans/:id', (req, res) => {
  const challan = challans.find((entry) => entry.id === req.params.id);
  if (!challan) return res.status(404).json({ message: 'Challan not found' });
  return res.json(challan);
});

app.get('/stock-movements', (_req, res) => {
  res.json(stockMovements);
});

app.get('/invoices', (_req, res) => {
  res.json(invoices);
});

app.post('/invoices', (req, res) => {
  if (!isNonEmpty(req.body.invoiceNumber)) return badRequest(res, 'Invoice number is required');
  if (!isNonEmpty(req.body.customerName)) return badRequest(res, 'Customer name is required');
  if (Number(req.body.totalAmount) <= 0) return badRequest(res, 'Total amount must be greater than zero');
  const invoice: Invoice = {
    id: randomUUID(),
    status: 'Pending',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  invoices.push(invoice);
  persistStore();
  return res.status(201).json(invoice);
});

app.get('/purchase-orders', (_req, res) => {
  res.json(purchaseOrders);
});

app.post('/purchase-orders', (req, res) => {
  if (!isNonEmpty(req.body.supplier)) return badRequest(res, 'Supplier is required');
  if (!isNonEmpty(req.body.productId)) return badRequest(res, 'Product is required');
  if (Number(req.body.quantity) <= 0) return badRequest(res, 'Quantity must be greater than zero');
  const order: PurchaseOrder = {
    id: randomUUID(),
    status: 'Draft',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  purchaseOrders.push(order);
  persistStore();
  return res.status(201).json(order);
});

app.get('/follow-ups', (_req, res) => {
  res.json(followUps);
});

app.post('/follow-ups', (req, res) => {
  if (!isNonEmpty(req.body.customerId)) return badRequest(res, 'Customer is required');
  if (!isNonEmpty(req.body.note)) return badRequest(res, 'Follow-up note is required');
  const followUp: FollowUp = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  followUps.push(followUp);
  persistStore();
  return res.status(201).json(followUp);
});

app.get('/dashboard', (_req, res) => {
  const lowStockProducts = products.filter((product) => product.currentStock <= product.minStockAlert);
  const pendingFollowUps = followUps.filter((item) => item.nextActionDate);
  res.json({
    customers: customers.length,
    products: products.length,
    challans: challans.length,
    invoices: invoices.length,
    lowStockProducts,
    pendingFollowUps
  });
});

app.post('/challans', (req, res) => {
  const { customerId, items, status = 'Draft' } = req.body as { customerId: string; items: ChallanItem[]; status?: Challan['status'] };
  if (!isNonEmpty(customerId)) return badRequest(res, 'Customer is required');
  if (!Array.isArray(items) || items.length === 0) return badRequest(res, 'At least one product item is required');
  if (!['Draft', 'Confirmed', 'Cancelled'].includes(status)) return badRequest(res, 'Invalid challan status');
  const customer = customers.find((entry) => entry.id === customerId);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  for (const item of items) {
    if (!isNonEmpty(item.productId)) return badRequest(res, 'Product is required');
    if (Number(item.quantity) <= 0) return badRequest(res, 'Quantity must be greater than zero');
  }

  const totalQuantity = items.reduce((sum: number, item: ChallanItem) => sum + item.quantity, 0);
  const challan: Challan = {
    id: randomUUID(),
    challanNumber: `CHL-${Date.now()}`,
    customerId,
    customerName: customer.name,
    items,
    totalQuantity,
    status,
    createdBy: 'Sales User',
    createdAt: new Date().toISOString()
  };

  if (status === 'Confirmed') {
    for (const item of items) {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (product.currentStock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      product.currentStock -= item.quantity;
      stockMovements.push({ id: randomUUID(), productId: product.id, productName: product.name, quantityChanged: item.quantity, movementType: 'OUT', reason: 'Sales challan confirmed', createdBy: 'Sales User', timestamp: new Date().toISOString() });
    }
  }

  challans.push(challan);
  persistStore();
  return res.status(201).json(challan);
});

async function startServer() {
  await initializePostgresStore();
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Backend may already be running on http://localhost:${port}`);
      process.exit(1);
    }
    throw error;
  });
}

void startServer();
