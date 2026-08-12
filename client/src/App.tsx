import { Link, Route, Routes } from 'react-router-dom';
import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import axios from 'axios';

const exportPdf = (challan: Challan) => {
  const content = `Challan: ${challan.challanNumber}\nCustomer: ${challan.customerName}\nStatus: ${challan.status}\n\nItems:\n${challan.items.map((item) => `- ${item.name} x ${item.quantity}`).join('\n')}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${challan.challanNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

type Role = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
type User = { id: string; name: string; role: Role; email: string; phone?: string; avatarUrl?: string };

type Customer = { id: string; name: string; mobile: string; email: string; businessName: string; gstNumber?: string; customerType: string; address: string; status: string; followUpDate: string; notes: string };
type Product = { id: string; name: string; sku: string; category: string; unitPrice: number; currentStock: number; minStockAlert: number; location: string; imageUrl?: string };
type Challan = { id: string; challanNumber: string; customerName: string; items: Array<{ productId: string; name: string; sku?: string; quantity: number; unitPrice: number }>; totalQuantity: number; status: string; createdAt: string };
type StockMovement = { id: string; productId: string; productName: string; quantityChanged: number; movementType: string; reason: string; createdBy: string; timestamp: string };
type Invoice = { id: string; invoiceNumber: string; challanId: string; customerName: string; totalAmount: number; dueDate: string; status: string; createdAt: string };
type PurchaseOrder = { id: string; supplier: string; productId: string; productName: string; quantity: number; unitPrice: number; status: string; createdAt: string };
type FollowUp = { id: string; customerId: string; customerName: string; note: string; nextActionDate: string; createdAt: string };
type DashboardSummary = { customers: number; products: number; challans: number; invoices: number; lowStockProducts: Product[]; pendingFollowUps: FollowUp[] };

type CustomerFormState = Omit<Customer, 'id'>;
type ProductFormState = Omit<Product, 'id'>;
type ChallanFormState = { customerId: string; productId: string; quantity: number; status: 'Draft' | 'Confirmed' };
type InvoiceFormState = { challanId: string; invoiceNumber: string; dueDate: string; customerName: string; totalAmount: number };
type PurchaseOrderFormState = { supplier: string; productId: string; productName: string; quantity: number; unitPrice: number; status: 'Draft' | 'Confirmed' };
type FollowUpFormState = { customerId: string; customerName: string; note: string; nextActionDate: string };

const emptyCustomerForm: CustomerFormState = { name: '', mobile: '', email: '', businessName: '', gstNumber: '', customerType: 'Retail', address: '', status: 'Lead', followUpDate: '', notes: '' };
const emptyProductForm: ProductFormState = { name: '', sku: '', category: '', unitPrice: 0, currentStock: 0, minStockAlert: 0, location: '', imageUrl: '' };

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000' });
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const toAssetUrl = (url?: string) => url ? (url.startsWith('http') ? url : `${apiBaseUrl}${url}`) : '';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loginForm, setLoginForm] = useState({ email: 'Admin User', password: '123456' });
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(emptyCustomerForm);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatus, setCustomerStatus] = useState('All');
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('All');
  const [challanSearch, setChallanSearch] = useState('');
  const [selectedChallanId, setSelectedChallanId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [challanForm, setChallanForm] = useState<ChallanFormState>({ customerId: '', productId: '', quantity: 1, status: 'Draft' });
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>({ challanId: '', invoiceNumber: '', dueDate: '', customerName: '', totalAmount: 0 });
  const [purchaseOrderForm, setPurchaseOrderForm] = useState<PurchaseOrderFormState>({ supplier: '', productId: '', productName: '', quantity: 1, unitPrice: 0, status: 'Draft' });
  const [followUpForm, setFollowUpForm] = useState<FollowUpFormState>({ customerId: '', customerName: '', note: '', nextActionDate: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const login = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError('');
      const response = await api.post('/auth/login', loginForm);
      setUser(response.data.user);
      setProfileForm({ name: response.data.user.name, email: response.data.user.email, phone: response.data.user.phone || '' });
    } catch (error) {
      setLoginError(axios.isAxiosError(error) ? (error.response?.data?.message || 'Backend is not reachable. Please start the server.') : 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email, phone: user.phone || '' });
      setProfilePhotoPreview(toAssetUrl(user.avatarUrl));
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [customerRes, productRes, challanRes, movementRes, invoiceRes, purchaseRes, followRes, dashboardRes] = await Promise.all([
        api.get('/customers'), api.get('/products'), api.get('/challans'), api.get('/stock-movements'), api.get('/invoices'), api.get('/purchase-orders'), api.get('/follow-ups'), api.get('/dashboard')
      ]);
      setCustomers(customerRes.data.items || customerRes.data);
      setProducts(productRes.data.items || productRes.data);
      setChallans(challanRes.data.items || challanRes.data);
      setStockMovements(movementRes.data);
      setInvoices(invoiceRes.data);
      setPurchaseOrders(purchaseRes.data);
      setFollowUps(followRes.data);
      setDashboard(dashboardRes.data);
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  useEffect(() => { void loadData(); }, []);

  const handleCustomerSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (editingCustomerId) await api.put(`/customers/${editingCustomerId}`, customerForm); else await api.post('/customers', customerForm);
    setCustomerForm(emptyCustomerForm); setEditingCustomerId(null); await loadData();
  };

  const handleProductSubmit = async (event: FormEvent) => {
    event.preventDefault();
    let imageUrl = '';
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await api.post('/products/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      imageUrl = response.data.imageUrl;
    }
    const payload = { ...productForm, imageUrl };
    if (editingProductId) await api.put(`/products/${editingProductId}`, payload); else await api.post('/products', payload);
    setProductForm(emptyProductForm); setEditingProductId(null); setImageFile(null); setImagePreview(''); await loadData();
  };

  const createChallan = async (event: FormEvent) => {
    event.preventDefault();
    const selectedProduct = products.find((product) => product.id === challanForm.productId);
    if (!selectedProduct) return;
    await api.post('/challans', { customerId: challanForm.customerId, items: [{ productId: selectedProduct.id, name: selectedProduct.name, sku: selectedProduct.sku, quantity: challanForm.quantity, unitPrice: selectedProduct.unitPrice }], status: challanForm.status });
    setChallanForm({ customerId: '', productId: '', quantity: 1, status: 'Draft' }); await loadData();
  };

  const createInvoice = async (event: FormEvent) => { event.preventDefault(); await api.post('/invoices', invoiceForm); setInvoiceForm({ challanId: '', invoiceNumber: '', dueDate: '', customerName: '', totalAmount: 0 }); await loadData(); };
  const createPurchaseOrder = async (event: FormEvent) => { event.preventDefault(); await api.post('/purchase-orders', purchaseOrderForm); setPurchaseOrderForm({ supplier: '', productId: '', productName: '', quantity: 1, unitPrice: 0, status: 'Draft' }); await loadData(); };
  const createFollowUp = async (event: FormEvent) => { event.preventDefault(); await api.post('/follow-ups', followUpForm); setFollowUpForm({ customerId: '', customerName: '', note: '', nextActionDate: '' }); await loadData(); };
  const updateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const response = await api.put(`/users/${user.id}`, profileForm);
    setUser(response.data);
  };
  const uploadProfilePhoto = async (file: File | null) => {
    if (!user || !file) return;
    setProfilePhotoPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/users/${user.id}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    setUser(response.data);
    setProfilePhotoPreview(toAssetUrl(response.data.avatarUrl));
  };

  const handleAutoPO = async () => {
    const lowStock = products.filter((p) => p.currentStock <= p.minStockAlert);
    if (!lowStock.length) {
      alert('All products are in safe stock levels!');
      return;
    }
    try {
      await Promise.all(
        lowStock.map((product) =>
          api.post('/purchase-orders', {
            supplier: 'Auto-Restock System',
            productId: product.id,
            productName: product.name,
            quantity: 10,
            unitPrice: product.unitPrice,
            status: 'Draft'
          })
        )
      );
      alert(`Successfully generated Draft Purchase Orders for ${lowStock.length} items!`);
      await loadData();
    } catch (e) {
      alert('Failed to generate purchase orders. Check server connection.');
    }
  };

  const startCustomerEdit = (customer: Customer) => { setEditingCustomerId(customer.id); setCustomerForm({ name: customer.name, mobile: customer.mobile, email: customer.email, businessName: customer.businessName, gstNumber: customer.gstNumber || '', customerType: customer.customerType, address: customer.address, status: customer.status, followUpDate: customer.followUpDate, notes: customer.notes }); };
  const startProductEdit = (product: Product) => { setEditingProductId(product.id); setProductForm({ name: product.name, sku: product.sku, category: product.category, unitPrice: product.unitPrice, currentStock: product.currentStock, minStockAlert: product.minStockAlert, location: product.location, imageUrl: product.imageUrl || '' }); };

  const filteredCustomers = useMemo(() => customers.filter((customer) => {
    const term = customerSearch.toLowerCase();
    const matchesSearch = [customer.name, customer.email, customer.businessName, customer.mobile].join(' ').toLowerCase().includes(term);
    const matchesStatus = customerStatus === 'All' || customer.status === customerStatus;
    return matchesSearch && matchesStatus;
  }), [customers, customerSearch, customerStatus]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const term = productSearch.toLowerCase();
    const matchesSearch = [product.name, product.sku, product.category, product.location].join(' ').toLowerCase().includes(term);
    const matchesCategory = productCategory === 'All' || product.category === productCategory;
    return matchesSearch && matchesCategory;
  }), [products, productSearch, productCategory]);

  const filteredChallans = useMemo(() => challans.filter((challan) => [challan.challanNumber, challan.customerName, challan.status].join(' ').toLowerCase().includes(challanSearch.toLowerCase())), [challans, challanSearch]);
  const selectedChallan = challans.find((challan) => challan.id === selectedChallanId) || filteredChallans[0] || null;
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || filteredCustomers[0] || null;

  const canAccess = (route: string) => {
    if (!user) return true; const allowed: Record<Role, string[]> = { Admin: ['dashboard', 'customers', 'products', 'challans', 'invoices', 'purchase-orders', 'followups'], Sales: ['dashboard', 'customers', 'challans', 'invoices', 'followups'], Warehouse: ['dashboard', 'products', 'challans', 'purchase-orders'], Accounts: ['dashboard', 'challans', 'invoices'] }; return allowed[user.role].includes(route);
  };

  return (
    <div className={`app-shell ${theme}`}>
      <header className="hero-card sticky-header">
        <Link to="/" className="logo-container">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
            <path d="M16 8L23 15H9L16 8Z" fill="white" />
            <path d="M16 24L9 17H23L16 24Z" fill="rgba(255, 255, 255, 0.85)" />
            <circle cx="16" cy="16" r="3" fill="#f97316" />
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0f172a" />
                <stop offset="1" stopColor="#1e293b" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <h1>NexusERP</h1>
            <p>Operations Portal</p>
          </div>
        </Link>

        <div className="header-search-container">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search invoices, clients, SKU... (⌘K)" readOnly />
          <span className="search-shortcut">⌘K</span>
        </div>

        <div className="user-status-widget">
          <div className="header-actions-group">
            <button className="notification-button" type="button" title="Notifications" onClick={() => setShowNotifications((value) => !value)}>
              <span>🔔</span>
              <b>3</b>
            </button>
            {user ? (
              <Link to="/profile" className="user-profile-avatar" title={`${user.name} (${user.role})`}>
                {user.avatarUrl ? <img src={toAssetUrl(user.avatarUrl)} alt={user.name} /> : user.name.charAt(0).toUpperCase()}
              </Link>
            ) : (
              <button className="user-profile-avatar guest avatar-action" type="button" title="Guest Mode" onClick={() => {
                const el = document.getElementById('login-section-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>👤</button>
            )}
            {!user ? (
              <button className="signin-button" type="button" onClick={() => {
                const el = document.getElementById('login-section-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>Sign In</button>
            ) : (
              <div className="user-badge"><span>{user.role}</span></div>
            )}
            {user ? (
              <button className="logout-button" type="button" onClick={() => {
                setUser(null);
                setProfileForm({ name: '', email: '', phone: '' });
                setProfilePhotoPreview('');
              }}>Logout</button>
            ) : null}
            <button className="theme-toggle-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Switch theme">
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            {showNotifications ? (
              <div className="notification-panel">
                <strong>Notifications Dashboard</strong>
                <p>3 operational items need your attention today.</p>
                <Link to="/dashboard" onClick={() => setShowNotifications(false)}>Open Dashboard</Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <nav>
        <Link to="/">🏠 Home</Link>
        <Link to="/dashboard">📊 Dashboard</Link>
        <Link to="/customers">👥 CRM Customers</Link>
        <Link to="/products">📦 SKU Products</Link>
        <Link to="/challans">🧾 Challans</Link>
        <Link to="/invoices">💰 Invoices</Link>
        <Link to="/purchase-orders">🚚 Purchase Orders</Link>
        <Link to="/followups">📞 Follow-ups</Link>
        <Link to="/profile">👤 Profile</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage user={user} loginForm={loginForm} setLoginForm={setLoginForm} login={login} loginError={loginError} isLoggingIn={isLoggingIn} apiStatus={apiStatus} customers={customers} products={products} challans={challans} invoices={invoices} followUps={followUps} stockMovements={stockMovements} dashboard={dashboard} />} />
        <Route path="/dashboard" element={canAccess('dashboard') ? <DashboardView customers={customers} products={products} challans={challans} invoices={invoices} followUps={followUps} stockMovements={stockMovements} dashboard={dashboard} /> : <AccessDenied />} />
        <Route path="/customers" element={canAccess('customers') ? <CustomersView customers={filteredCustomers} customerSearch={customerSearch} setCustomerSearch={setCustomerSearch} customerStatus={customerStatus} setCustomerStatus={setCustomerStatus} customerForm={customerForm} setCustomerForm={setCustomerForm} editingCustomerId={editingCustomerId} onSubmit={handleCustomerSubmit} startEdit={startCustomerEdit} selectedCustomer={selectedCustomer} setSelectedCustomerId={setSelectedCustomerId} followUpForm={followUpForm} setFollowUpForm={setFollowUpForm} onFollowUpSubmit={createFollowUp} /> : <AccessDenied />} />
        <Route path="/products" element={canAccess('products') ? <ProductsView products={filteredProducts} productSearch={productSearch} setProductSearch={setProductSearch} productCategory={productCategory} setProductCategory={setProductCategory} productForm={productForm} setProductForm={setProductForm} editingProductId={editingProductId} onSubmit={handleProductSubmit} startEdit={startProductEdit} imagePreview={imagePreview} setImageFile={setImageFile} setImagePreview={setImagePreview} /> : <AccessDenied />} />
        <Route path="/challans" element={canAccess('challans') ? <ChallansView challans={filteredChallans} challanSearch={challanSearch} setChallanSearch={setChallanSearch} customers={customers} products={products} challanForm={challanForm} setChallanForm={setChallanForm} onSubmit={createChallan} selectedChallan={selectedChallan} setSelectedChallanId={setSelectedChallanId} /> : <AccessDenied />} />
        <Route path="/invoices" element={canAccess('invoices') ? <InvoicesView invoices={invoices} challans={challans} invoiceForm={invoiceForm} setInvoiceForm={setInvoiceForm} onSubmit={createInvoice} /> : <AccessDenied />} />
        <Route path="/purchase-orders" element={canAccess('purchase-orders') ? <PurchaseOrdersView purchaseOrders={purchaseOrders} products={products} purchaseOrderForm={purchaseOrderForm} setPurchaseOrderForm={setPurchaseOrderForm} onSubmit={createPurchaseOrder} onAutoPO={handleAutoPO} /> : <AccessDenied />} />
        <Route path="/followups" element={canAccess('followups') ? <FollowUpsView followUps={followUps} customers={customers} followUpForm={followUpForm} setFollowUpForm={setFollowUpForm} onSubmit={createFollowUp} /> : <AccessDenied />} />
        <Route path="/profile" element={user ? <ProfileView user={user} profileForm={profileForm} setProfileForm={setProfileForm} onSubmit={updateProfile} onPhotoUpload={uploadProfilePhoto} profilePhotoPreview={profilePhotoPreview} /> : <AccessDenied />} />
      </Routes>
      <footer className="app-footer">
        <div className="footer-content" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%', textAlign: 'left', paddingBottom: '30px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="footer-brand" style={{ flex: '1', minWidth: '250px' }}>
            <strong style={{ fontSize: '1.4rem', color: '#fff' }}>NexusERP</strong>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enterprise operations, stock distribution & unified CRM cockpit.</p>
          </div>
          <div className="footer-links-col" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Company</strong>
            <a href="#about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>About Us</a>
            <a href="#privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>Privacy Policy</a>
            <a href="#terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>Terms of Service</a>
            <a href="#contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>Contact Desk</a>
          </div>
          <div className="footer-socials-col" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Connect With Us</strong>
            <div className="social-links" style={{ display: 'flex', gap: '12px' }}>
              <a href="#linkedin" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>🔗 LinkedIn</a>
              <a href="#twitter" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>🐦 Twitter</a>
              <a href="#youtube" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>📺 YouTube</a>
            </div>
          </div>
        </div>
        <p style={{ margin: '24px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>© 2026 MiniERP + CRM Operations Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}

function HomePage({ user, loginForm, setLoginForm, login, loginError, isLoggingIn, apiStatus, customers, products, challans, invoices, followUps, stockMovements, dashboard }: { user: User | null; loginForm: { email: string; password: string }; setLoginForm: (value: { email: string; password: string }) => void; login: () => Promise<void>; loginError: string; isLoggingIn: boolean; apiStatus: 'checking' | 'online' | 'offline'; customers: Customer[]; products: Product[]; challans: Challan[]; invoices: Invoice[]; followUps: FollowUp[]; stockMovements: StockMovement[]; dashboard: DashboardSummary | null }) {
  const [showFollowPopup, setShowFollowPopup] = useState(true);
  const lowStockProducts = products.filter((product) => product.currentStock <= product.minStockAlert);
  const invoiceValue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const confirmedChallans = challans.filter((challan) => challan.status === 'Confirmed').length;
  const activeCustomers = customers.filter((customer) => customer.status === 'Active').length;
  const upcomingFollowUps = followUps
    .slice()
    .sort((a, b) => (a.nextActionDate || '').localeCompare(b.nextActionDate || ''))
    .slice(0, 3);
  const activityItems = [
    ...stockMovements.slice(0, 2).map((item) => ({ label: item.productName, meta: `${item.movementType} stock movement - Qty ${item.quantityChanged}`, tone: item.movementType === 'OUT' ? 'danger' : 'green' })),
    ...followUps.slice(0, 2).map((item) => ({ label: item.customerName, meta: `Follow-up due ${item.nextActionDate || 'soon'}`, tone: 'blue' })),
    ...invoices.slice(0, 2).map((item) => ({ label: item.invoiceNumber, meta: `${item.status} invoice - Rs ${item.totalAmount.toLocaleString()}`, tone: 'warm' }))
  ].slice(0, 5);

  const featureCards = [
    { icon: 'CRM', title: 'Customer CRM', text: 'Lead pipeline, customer notes, status tracking and next-action planning.', action: 'Explore ->', url: '/customers', tone: 'orange' },
    { icon: 'SKU', title: 'Inventory Control', text: 'Stock levels, warehouse locations, low-stock alerts and product edits.', action: 'Manage ->', url: '/products', tone: 'blue' },
    { icon: 'CH', title: 'Sales Challans', text: 'Create challans, confirm quantities and export clean delivery records.', action: 'Explore ->', url: '/challans', tone: 'green' },
    { icon: 'INV', title: 'Invoices & Orders', text: 'Generate invoices, track dues and keep billing operations organized.', action: 'Manage ->', url: '/invoices', tone: 'pink' }
  ];

  const modules = [
    { icon: 'CRM', label: 'CRM', url: '/customers' },
    { icon: 'SKU', label: 'Inventory', url: '/products' },
    { icon: 'CH', label: 'Challans', url: '/challans' },
    { icon: 'INV', label: 'Invoices', url: '/invoices' },
    { icon: 'PO', label: 'Purchase Orders', url: '/purchase-orders' },
    { icon: 'FU', label: 'Follow-ups', url: '/followups' }
  ];

  const workflowSteps = [
    { step: '01', title: 'Capture lead', text: 'Sales team adds customer details, GST, type, status and follow-up notes.' },
    { step: '02', title: 'Reserve stock', text: 'Warehouse checks SKU quantity, location and low-stock alert thresholds.' },
    { step: '03', title: 'Confirm challan', text: 'Confirmed challans reduce stock and create movement logs automatically.' },
    { step: '04', title: 'Bill & collect', text: 'Accounts tracks invoices, dues, purchase orders and payment status.' }
  ];

  const roleHighlights = [
    { role: 'Admin', title: 'Full control', text: 'Manage every module, monitor dashboard, edit users and review operations.' },
    { role: 'Sales', title: 'CRM focused', text: 'Create customers, schedule follow-ups and generate challans for orders.' },
    { role: 'Warehouse', title: 'Inventory ready', text: 'Track stock, location, purchase orders and outgoing challan impact.' },
    { role: 'Accounts', title: 'Billing view', text: 'Review invoices, challans and payment-facing business records.' }
  ];

  const proofCards = [
    { label: 'Backend API', value: apiStatus === 'online' ? 'Live' : apiStatus === 'checking' ? 'Check' : 'Offline', text: apiStatus === 'online' ? 'Frontend is connected with Express APIs' : 'Start backend on port 5000 to connect data' },
    { label: 'Demo Records', value: String(customers.length + products.length + challans.length + invoices.length + followUps.length), text: 'Customers, products, invoices, challans and follow-ups loaded' },
    { label: 'Roles', value: '4', text: 'Admin, Sales, Warehouse and Accounts access modes' }
  ];

  const controlTower = [
    { title: 'CRM Pipeline', value: String(dashboard?.customers ?? customers.length), meta: `${activeCustomers} active customers in CRM`, tone: 'warm' },
    { title: 'Stock Guard', value: String(lowStockProducts.length).padStart(2, '0'), meta: 'Low stock products need attention', tone: 'danger' },
    { title: 'Challan Flow', value: String(dashboard?.challans ?? challans.length), meta: `${confirmedChallans} confirmed records`, tone: 'blue' },
    { title: 'Billing Desk', value: `Rs ${invoiceValue.toLocaleString()}`, meta: 'Tracked invoice value', tone: 'green' }
  ];

  return (
    <div className="home-page">
      <aside className={`followup-corner-popup ${showFollowPopup ? 'is-open' : 'is-collapsed'}`}>
        {showFollowPopup ? (
          <>
            <div className="followup-popup-head">
              <div>
                <span className="section-label">Follow-ups</span>
                <strong>{followUps.length} pending callbacks</strong>
              </div>
              <button type="button" aria-label="Hide follow-ups" onClick={() => setShowFollowPopup(false)}>x</button>
            </div>
            <div className="followup-popup-list">
              {upcomingFollowUps.length ? upcomingFollowUps.map((item) => (
                <Link key={item.id} to="/followups" className="followup-popup-item">
                  <span>{item.customerName.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{item.customerName}</strong>
                    <p>{item.note}</p>
                    <small>{item.nextActionDate}</small>
                  </div>
                </Link>
              )) : (
                <div className="followup-popup-empty">
                  <strong>No callbacks waiting</strong>
                  <p>New CRM follow-ups will appear here automatically.</p>
                </div>
              )}
            </div>
            <div className="followup-popup-actions">
              <Link to="/followups">Open Follow-ups</Link>
              <Link to="/customers">Add CRM Note</Link>
            </div>
          </>
        ) : (
          <button type="button" className="followup-reopen" onClick={() => setShowFollowPopup(true)}>
            <span>{followUps.length}</span>
            Follow-ups
          </button>
        )}
      </aside>

      <section className="erp-hero">
        <div className="hero-copy">
          <span className="hero-kicker">Wholesale ERP + CRM Workspace</span>
          <h2>Run your wholesale operations from one smart workspace</h2>
          <p>
            Manage leads, inventory, challans, invoices and follow-ups in one connected portal built for daily business teams.
          </p>
          <div className={`api-live-badge status-${apiStatus}`}>
            <span></span>
            {apiStatus === 'online' ? `Backend connected: ${apiBaseUrl}` : apiStatus === 'checking' ? 'Checking backend connection...' : `Backend offline: start API on ${apiBaseUrl}`}
          </div>
          <div className="hero-actions">
            <Link to="/dashboard" className="btn primary-cta">Open Dashboard</Link>
            {!user && <button className="secondary" onClick={() => {
              const el = document.getElementById('login-section-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>Quick Sign In</button>}
          </div>
          <div className="hero-trust-row">
            <a href="#login-section-card">JWT login</a>
            <Link to="/challans">Stock-safe challans</Link>
            <Link to="/dashboard">Demo data ready</Link>
          </div>
          <div className="hero-stats">
            <Link to="/customers"><strong>{dashboard?.customers ?? customers.length}</strong><span>CRM Customers</span></Link>
            <Link to="/products"><strong>{products.length}</strong><span>SKU Products</span></Link>
            <Link to="/products"><strong>{lowStockProducts.length}</strong><span>Stock Alerts</span></Link>
          </div>
        </div>
        <div className="hero-dashboard-preview">
          <div className="preview-topbar">
            <span></span><span></span><span></span>
            <Link to="/dashboard">Live Operations</Link>
          </div>
          <div className="preview-grid">
            <Link to="/invoices" className="preview-card highlight"><span>Invoice Value</span><strong>Rs {invoiceValue.toLocaleString()}</strong></Link>
            <Link to="/customers" className="preview-card"><span>Customers</span><strong>{customers.length}</strong></Link>
            <Link to="/challans" className="preview-card"><span>Challans</span><strong>{challans.length}</strong></Link>
            <Link to="/products" className="preview-card alert"><span>Low Stock</span><strong>{lowStockProducts.length}</strong></Link>
          </div>
          <div className="preview-chart">
            <i style={{ height: '42%' }}></i>
            <i style={{ height: '66%' }}></i>
            <i style={{ height: '52%' }}></i>
            <i style={{ height: '82%' }}></i>
            <i style={{ height: '58%' }}></i>
            <i style={{ height: '74%' }}></i>
          </div>
          <div className="preview-list">
            <Link to="/invoices"><span>{invoices[0]?.invoiceNumber || 'Invoice pipeline'}</span><b>{invoices[0]?.status || 'Ready'}</b></Link>
            <Link to="/products"><span>{lowStockProducts[0]?.sku || 'Stock guard'}</span><b className="danger">{lowStockProducts.length ? 'Low' : 'Safe'}</b></Link>
            <Link to="/followups"><span>{followUps[0]?.customerName || 'Follow-up queue'}</span><b>{followUps[0]?.nextActionDate || 'Open'}</b></Link>
          </div>
        </div>
      </section>

      <section className="home-command-center">
        <div className="command-panel command-main">
          <div className="section-heading compact">
            <span className="section-label">Command Center</span>
            <h3>Live business snapshot</h3>
            <p>Important ERP counters update from backend APIs when the server is running.</p>
          </div>
          <div className="command-metrics">
            <div><span>Customers</span><strong>{customers.length}</strong></div>
            <div><span>Products</span><strong>{products.length}</strong></div>
            <div><span>Invoices</span><strong>{invoices.length}</strong></div>
            <div><span>Follow-ups</span><strong>{followUps.length}</strong></div>
          </div>
        </div>
        <div className="command-panel activity-panel">
          <div className="activity-title">
            <span className="section-label">Recent Activity</span>
            <Link to="/dashboard">View all {'->'}</Link>
          </div>
          {activityItems.length ? activityItems.map((item, index) => (
            <div key={`${item.label}-${index}`} className={`activity-row tone-${item.tone}`}>
              <span></span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.meta}</p>
              </div>
            </div>
          )) : <p className="empty-activity">Start backend to load CRM, stock and invoice activity.</p>}
        </div>
      </section>

      <section className="module-strip" aria-label="ERP modules">
        {modules.map((item) => (
          <Link key={item.label} to={item.url} className="module-pill">
            <span>{item.icon}</span>
            <b>{item.label}</b>
          </Link>
        ))}
      </section>

      <section className="proof-strip">
        {proofCards.map((item) => (
          <article key={item.label} className="proof-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="control-tower-section">
        <div className="control-copy">
          <span className="section-label">Live Control Tower</span>
          <h3>One page view for sales, warehouse and accounts teams</h3>
          <p>Use the portal like a daily operations cockpit: identify leads, detect stock risk, confirm challans and keep invoices moving.</p>
          <Link to="/dashboard" className="control-link">Review dashboard {'->'}</Link>
        </div>
        <div className="control-board">
          {controlTower.map((item) => (
            <article key={item.title} className={`control-tile tone-${item.tone}`}>
              <span>{item.title}</span>
              <strong>{item.value}</strong>
              <p>{item.meta}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading">
          <span className="section-label">Business Flow</span>
          <h3>From CRM lead to invoice in one connected workflow</h3>
          <p>Every module mirrors a real wholesale operation: customer follow-up, stock control, delivery challan and billing.</p>
        </div>
        <div className="workflow-grid">
          {workflowSteps.map((item) => (
            <article key={item.step} className="workflow-card">
              <b>{item.step}</b>
              <h4>{item.title}</h4>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="welcome-section card" id="login-section-card">
        <div className="welcome-copy">
          <span className="section-label">Role Based Access</span>
          <h3>{user ? `Welcome back, ${user.name}!` : 'Choose your workspace role'}</h3>
          <p>
            Login flows are mapped to business responsibility: Admin, Sales, Warehouse and Finance users see the modules they need.
          </p>
          {user && (
            <div style={{ marginTop: '20px' }}>
              <Link to="/dashboard" className="btn">Open Dashboard</Link>
            </div>
          )}
        </div>
        {!user ? (
          <div className="login-box">
            <div className="login-title-row">
              <h4>Secure Sign In</h4>
              <p>Select a role, then authenticate with the prepared demo credentials.</p>
            </div>
            <div className="role-grid">
              {[
                { key: 'Admin', icon: 'AD', name: 'Administrator', desc: 'Complete system control, dashboard and user module access.', email: 'Admin User' },
                { key: 'Sales', icon: 'SE', name: 'Sales Executive', desc: 'Manage customer accounts, leads, follow-ups and challans.', email: 'Sales User' },
                { key: 'Warehouse', icon: 'WH', name: 'Warehouse Team', desc: 'Review SKU inventory stock status, locations and purchase orders.', email: 'Warehouse User' },
                { key: 'Accounts', icon: 'FN', name: 'Finance & Bills', desc: 'Review invoices, compile reports and verify payments.', email: 'Accounts User' }
              ].map((role) => (
                <button
                  key={role.key}
                  type="button"
                  className={`role-card-button ${loginForm.email.startsWith(role.key) ? 'active-role' : ''}`}
                  onClick={() => setLoginForm({ email: role.email, password: '123456' })}
                >
                  <div className="role-card-icon">{role.icon}</div>
                  <div className="role-card-header"><span>{role.name}</span></div>
                  <div className="role-card-desc">{role.desc}</div>
                  <span className="role-card-cta">Sign In</span>
                </button>
              ))}
            </div>
            <div className="login-input-group">
              <span>@</span>
              <input
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="Username or email"
                required
              />
            </div>
            <div className="login-input-group">
              <span>Key</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Password"
                required
              />
            </div>
            {loginError ? <div className="form-error">{loginError}</div> : null}
            <button onClick={() => void login()} disabled={isLoggingIn}>{isLoggingIn ? 'Signing in...' : 'Authenticate & Login'}</button>
          </div>
        ) : (
          <div className="welcome-summary card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div className="user-avatar-circle" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                {user.avatarUrl ? <img src={toAssetUrl(user.avatarUrl)} alt={user.name} /> : user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{user.name}</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Logged in as {user.role}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Your workspace permissions allow you to update and create entries within assigned ERP sections.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/dashboard" className="btn">Go to dashboard</Link>
            </div>
          </div>
        )}
      </section>

      <section className="feature-grid">
        {featureCards.map((feature) => (
          <article key={feature.title} className={`feature-card tone-${feature.tone}`}>
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
            <Link to={feature.url} className="feature-action-link">{feature.action}</Link>
          </article>
        ))}
      </section>

      <section className="role-showcase">
        <div className="section-heading compact">
          <span className="section-label">Team Workspaces</span>
          <h3>Role-wise portal experience</h3>
        </div>
        <div className="role-showcase-grid">
          {roleHighlights.map((item) => (
            <article key={item.role} className="role-showcase-card">
              <span>{item.role.slice(0, 2).toUpperCase()}</span>
              <div>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="promo-section">
        <div className="promo-card">
          <h3>Why operations love this workspace</h3>
          <p>
            By connecting customer CRM with inventories and actual sales bills, we prevent data duplication and speed up delivery validation cycles.
          </p>
        </div>
        <div className="promo-card accent">
          <h3>Engineered for wholesale distribution</h3>
          <p>
            Scale transactions, assign tasks, and monitor delivery timelines across warehouse stations with unified operations logging.
          </p>
        </div>
      </section>
    </div>
  );
}

function AccessDenied() { return <div className="card"><h3>Access denied</h3><p>Your role does not have permission to view this module.</p></div>; }

function DashboardView({ customers, products, challans, invoices, followUps, stockMovements, dashboard }: { customers: Customer[]; products: Product[]; challans: Challan[]; invoices: Invoice[]; followUps: FollowUp[]; stockMovements: StockMovement[]; dashboard: DashboardSummary | null }) {
  const lowStockProducts = products.filter((product) => product.currentStock <= product.minStockAlert);
  const totalValue = products.reduce((sum, product) => sum + product.currentStock * product.unitPrice, 0);
  const stats = [
    { icon: '👥', label: 'Active Leads', value: dashboard?.customers ?? customers.length, note: 'Active CRM relationships', tone: 'green' },
    { icon: '📞', label: 'Follow-ups', value: followUps.length, note: 'Pending scheduled actions', tone: 'yellow' },
    { icon: '🚨', label: 'Alerts', value: lowStockProducts.length, note: 'Low stock items need attention', tone: 'red' },
    { icon: '🧾', label: 'Invoices', value: dashboard?.invoices ?? invoices.length, note: 'Pending and paid invoices', tone: 'blue' }
  ];
  return <div className="grid dashboard-grid">{stats.map((stat) => <div key={stat.label} className={`card stat-card tone-${stat.tone}`}><div className="stat-icon" style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div><p style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0' }}>{stat.value}</p><h3>{stat.label}</h3><small>{stat.note}</small></div>)}<div className="card wide-card"><h3>Inventory overview</h3><div className="chart-row">{products.slice(0, 5).map((product) => <div key={product.id} className="chart-item"><div className="chart-label"><strong>{product.name}</strong><span>{product.currentStock}</span></div><div className="chart-bar"><div style={{ width: `${Math.min(100, product.currentStock * 5)}%` }} /></div></div>)}</div><p className="summary-text">Estimated stock value: Rs {totalValue.toLocaleString()}</p></div><div className="card wide-card"><h3>Low stock alerts</h3>{lowStockProducts.length ? lowStockProducts.map((product) => <div key={product.id} className="alert-item"><strong>{product.name}</strong><span>Stock: {product.currentStock} | Min: {product.minStockAlert}</span></div>) : <p>No low stock products.</p>}</div><div className="card wide-card"><h3>Stock movement log</h3>{stockMovements.length ? stockMovements.slice(0, 6).map((item) => <div key={item.id} className="alert-item"><strong>{item.productName}</strong><span>{item.movementType} - Qty {item.quantityChanged} - {item.reason}</span></div>) : <p>No stock movements yet.</p>}</div><div className="card wide-card"><h3>Upcoming follow-ups</h3>{followUps.length ? followUps.slice(0, 4).map((item) => <div key={item.id} className="alert-item"><strong>{item.customerName}</strong><span>{item.nextActionDate}</span></div>) : <p>No follow-ups scheduled.</p>}</div></div>;
}
function CustomersView({ customers, customerSearch, setCustomerSearch, customerStatus, setCustomerStatus, customerForm, setCustomerForm, editingCustomerId, onSubmit, startEdit, selectedCustomer, setSelectedCustomerId, followUpForm, setFollowUpForm, onFollowUpSubmit }: { customers: Customer[]; customerSearch: string; setCustomerSearch: (value: string) => void; customerStatus: string; setCustomerStatus: (value: string) => void; customerForm: CustomerFormState; setCustomerForm: (value: CustomerFormState) => void; editingCustomerId: string | null; onSubmit: (event: FormEvent) => Promise<void>; startEdit: (customer: Customer) => void; selectedCustomer: Customer | null; setSelectedCustomerId: (value: string) => void; followUpForm: FollowUpFormState; setFollowUpForm: (value: FollowUpFormState) => void; onFollowUpSubmit: (event: FormEvent) => Promise<void> }) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const followUpGroups = useMemo(() => {
    const groups: Record<string, Customer[]> = {};
    customers.forEach((c) => {
      if (c.followUpDate) {
        if (!groups[c.followUpDate]) groups[c.followUpDate] = [];
        groups[c.followUpDate].push(c);
      }
    });
    return groups;
  }, [customers]);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>Customers</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className={viewMode === 'list' ? '' : 'secondary'} onClick={() => setViewMode('list')}>📋 List CRM</button>
          <button type="button" className={viewMode === 'calendar' ? '' : 'secondary'} onClick={() => setViewMode('calendar')}>📅 Follow-Up Schedule</button>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <>
          <div className="filters-row">
            <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search customer" />
            <select value={customerStatus} onChange={(e) => setCustomerStatus(e.target.value)}>
              <option value="All">All statuses</option>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <form onSubmit={onSubmit} className="stacked-form">
            <input required value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="Customer name" />
            <input required value={customerForm.mobile} onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })} placeholder="Mobile" />
            <input required value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="Email" />
            <input value={customerForm.businessName} onChange={(e) => setCustomerForm({ ...customerForm, businessName: e.target.value })} placeholder="Business name" />
            <input value={customerForm.gstNumber} onChange={(e) => setCustomerForm({ ...customerForm, gstNumber: e.target.value })} placeholder="GST number" />
            <input value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} placeholder="Address" />
            <input value={customerForm.followUpDate} onChange={(e) => setCustomerForm({ ...customerForm, followUpDate: e.target.value })} placeholder="Follow-up date (YYYY-MM-DD)" />
            <textarea value={customerForm.notes} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} placeholder="Notes" />
            <button type="submit">{editingCustomerId ? 'Update Customer' : 'Add Customer'}</button>
          </form>
          <div className="list-stack">
            {customers.map((customer) => (
              <div key={customer.id} className="list-item" onClick={() => setSelectedCustomerId(customer.id)}>
                <div>
                  <strong>{customer.name}</strong>
                  <div>{customer.email} - {customer.mobile}</div>
                </div>
                <button className="secondary" onClick={(e) => { e.stopPropagation(); startEdit(customer); }}>Edit</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="crm-scheduler" style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>🗓️ Active Follow-Up Callback Pipeline</h3>
          {Object.keys(followUpGroups).length === 0 ? (
            <p>No follow-ups scheduled at this time.</p>
          ) : (
            Object.keys(followUpGroups).sort().map((date) => (
              <div key={date} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--color-primary-light)', marginBottom: '8px' }}>🗓️ Callbacks for: {date}</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {followUpGroups[date].map((c) => (
                    <div key={c.id} className="scheduler-item" onClick={() => setSelectedCustomerId(c.id)} style={{ cursor: 'pointer', padding: '12px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>👤 {c.name}</span> - <small style={{ color: 'var(--text-secondary)' }}>{c.businessName || 'No business details'}</small>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>👉 <b>Action Note:</b> {c.notes || 'No notes.'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {selectedCustomer ? (
        <div className="detail-card">
          <h3>{selectedCustomer.name}</h3>
          <p><strong>Business:</strong> {selectedCustomer.businessName}</p>
          <p><strong>Status:</strong> {selectedCustomer.status}</p>
          <p><strong>Follow-up:</strong> {selectedCustomer.followUpDate}</p>
          <p><strong>Notes:</strong> {selectedCustomer.notes}</p>
          <form onSubmit={onFollowUpSubmit} className="stacked-form">
            <input value={followUpForm.note} onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })} placeholder="Add follow-up note" />
            <input value={followUpForm.nextActionDate} onChange={(e) => setFollowUpForm({ ...followUpForm, nextActionDate: e.target.value })} placeholder="Next action date" />
            <button type="submit">Save follow-up</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ProductsView({ products, productSearch, setProductSearch, productCategory, setProductCategory, productForm, setProductForm, editingProductId, onSubmit, startEdit, imagePreview, setImageFile, setImagePreview }: { products: Product[]; productSearch: string; setProductSearch: (value: string) => void; productCategory: string; setProductCategory: (value: string) => void; productForm: ProductFormState; setProductForm: (value: ProductFormState) => void; editingProductId: string | null; onSubmit: (event: FormEvent) => Promise<void>; startEdit: (product: Product) => void; imagePreview: string; setImageFile: (value: File | null) => void; setImagePreview: (value: string) => void }) {
  return <div className="card"><h2>Products</h2><div className="filters-row"><input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search product" /><select value={productCategory} onChange={(e) => setProductCategory(e.target.value)}><option value="All">All categories</option><option value="Electronics">Electronics</option><option value="Stationery">Stationery</option></select></div><form onSubmit={onSubmit} className="stacked-form"><input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Product name" /><input required value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="SKU" /><input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} placeholder="Category" /><input type="number" value={productForm.unitPrice} onChange={(e) => setProductForm({ ...productForm, unitPrice: Number(e.target.value) })} placeholder="Unit price" /><input type="number" value={productForm.currentStock} onChange={(e) => setProductForm({ ...productForm, currentStock: Number(e.target.value) })} placeholder="Current stock" /><input type="number" value={productForm.minStockAlert} onChange={(e) => setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })} placeholder="Min stock alert" /><input value={productForm.location} onChange={(e) => setProductForm({ ...productForm, location: e.target.value })} placeholder="Location" /><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] || null; setImageFile(file); setImagePreview(file ? URL.createObjectURL(file) : ''); }} />{imagePreview ? <img src={imagePreview} alt="Preview" className="preview-image" /> : null}<button type="submit">{editingProductId ? 'Update Product' : 'Add Product'}</button></form><div className="list-stack">{products.map((product) => <div key={product.id} className="list-item"><div><strong>{product.name}</strong><div>{product.sku} - Stock: {product.currentStock}</div></div><button className="secondary" onClick={() => startEdit(product)}>Edit</button></div>)}</div></div>;
}

function ChallansView({ challans, challanSearch, setChallanSearch, customers, products, challanForm, setChallanForm, onSubmit, selectedChallan, setSelectedChallanId }: { challans: Challan[]; challanSearch: string; setChallanSearch: (value: string) => void; customers: Customer[]; products: Product[]; challanForm: ChallanFormState; setChallanForm: (value: ChallanFormState) => void; onSubmit: (event: FormEvent) => Promise<void>; selectedChallan: Challan | null; setSelectedChallanId: (value: string) => void }) {
  return <div className="card"><h2>Challans</h2><input value={challanSearch} onChange={(e) => setChallanSearch(e.target.value)} placeholder="Search challan" /><form onSubmit={onSubmit} className="stacked-form"><select value={challanForm.customerId} onChange={(e) => setChallanForm({ ...challanForm, customerId: e.target.value })} required><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select><select value={challanForm.productId} onChange={(e) => setChallanForm({ ...challanForm, productId: e.target.value })} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input type="number" min="1" value={challanForm.quantity} onChange={(e) => setChallanForm({ ...challanForm, quantity: Number(e.target.value) })} /><select value={challanForm.status} onChange={(e) => setChallanForm({ ...challanForm, status: e.target.value as 'Draft' | 'Confirmed' })}><option value="Draft">Draft</option><option value="Confirmed">Confirmed</option></select><button type="submit">Create Challan</button></form><div className="split-grid"><div className="list-stack">{challans.map((challan) => <div key={challan.id} className="list-item" onClick={() => setSelectedChallanId(challan.id)}><div><strong>{challan.challanNumber}</strong><div>{challan.customerName} - {challan.status}</div></div><span>{challan.totalQuantity} qty</span></div>)}</div><div className="detail-card">{selectedChallan ? <><h3>{selectedChallan.challanNumber}</h3><p><strong>Customer:</strong> {selectedChallan.customerName}</p><p><strong>Status:</strong> {selectedChallan.status}</p><p><strong>Created:</strong> {selectedChallan.createdAt}</p><button onClick={() => exportPdf(selectedChallan)}>Export as text</button><ul>{selectedChallan.items.map((item, index) => <li key={`${item.productId}-${index}`}>{item.name} - Qty {item.quantity} - Rs {item.unitPrice}</li>)}</ul></> : <p>No challan selected</p>}</div></div></div>;
}

function InvoicesView({ invoices, challans, invoiceForm, setInvoiceForm, onSubmit }: { invoices: Invoice[]; challans: Challan[]; invoiceForm: InvoiceFormState; setInvoiceForm: Dispatch<SetStateAction<InvoiceFormState>>; onSubmit: (event: FormEvent) => Promise<void> }) {
  const selectedChallan = useMemo(() => challans.find((c) => c.id === invoiceForm.challanId), [invoiceForm.challanId, challans]);
  
  const calculations = useMemo(() => {
    if (!selectedChallan) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = selectedChallan.items.reduce((sum, item) => sum + item.quantity * (item.unitPrice || 0), 0);
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [selectedChallan]);

  useEffect(() => {
    if (selectedChallan) {
      setInvoiceForm((form) => ({
        ...form,
        customerName: selectedChallan.customerName,
        totalAmount: calculations.total
      }));
    }
  }, [selectedChallan, calculations.total, setInvoiceForm]);

  return (
    <div className="card">
      <h2>Invoices</h2>
      <form onSubmit={onSubmit} className="stacked-form">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Select Sales Challan</label>
        <select value={invoiceForm.challanId} onChange={(e) => setInvoiceForm({ ...invoiceForm, challanId: e.target.value })} required>
          <option value="">Select challan</option>
          {challans.map((challan) => <option key={challan.id} value={challan.id}>{challan.challanNumber} ({challan.customerName})</option>)}
        </select>
        
        <input value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} placeholder="Invoice number (e.g. INV-1001)" required />
        <input value={invoiceForm.customerName} onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })} placeholder="Customer name" required readOnly />

        {selectedChallan && (
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', margin: '8px 0', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Subtotal:</span>
              <span>Rs {calculations.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>GST (18% Total):</span>
              <span>Rs {calculations.tax.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '6px', color: 'var(--color-success)' }}>
              <span>Grand Total (Ledger Auto-Set):</span>
              <span>Rs {calculations.total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <input type="number" value={invoiceForm.totalAmount} onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: Number(e.target.value) })} placeholder="Total amount" required />
        <input value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} placeholder="Due date (YYYY-MM-DD)" />
        <button type="submit">Create invoice</button>
      </form>
      <div className="list-stack">{invoices.map((invoice) => <div key={invoice.id} className="list-item"><div><strong>{invoice.invoiceNumber}</strong><div>{invoice.customerName} - {invoice.status}</div></div><span>Rs {invoice.totalAmount}</span></div>)}</div>
    </div>
  );
}

function PurchaseOrdersView({ purchaseOrders, products, purchaseOrderForm, setPurchaseOrderForm, onSubmit, onAutoPO }: { purchaseOrders: PurchaseOrder[]; products: Product[]; purchaseOrderForm: PurchaseOrderFormState; setPurchaseOrderForm: (value: PurchaseOrderFormState) => void; onSubmit: (event: FormEvent) => Promise<void>; onAutoPO?: () => Promise<void> }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>Purchase Orders</h2>
        {onAutoPO && (
          <button type="button" className="secondary" onClick={() => void onAutoPO()} style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)', color: '#fff', border: 'none' }}>
            ⚡ Auto-PO Generator (Low Stock)
          </button>
        )}
      </div>
      <form onSubmit={onSubmit} className="stacked-form">
        <input value={purchaseOrderForm.supplier} onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, supplier: e.target.value })} placeholder="Supplier" required />
        <select value={purchaseOrderForm.productId} onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, productId: e.target.value, productName: products.find((product) => product.id === e.target.value)?.name || '' })} required>
          <option value="">Select product</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
        <input type="number" value={purchaseOrderForm.quantity} onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, quantity: Number(e.target.value) })} placeholder="Quantity" required />
        <input type="number" value={purchaseOrderForm.unitPrice} onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, unitPrice: Number(e.target.value) })} placeholder="Unit price" required />
        <select value={purchaseOrderForm.status} onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, status: e.target.value as 'Draft' | 'Confirmed' })}>
          <option value="Draft">Draft</option>
          <option value="Confirmed">Confirmed</option>
        </select>
        <button type="submit">Create purchase order</button>
      </form>
      <div className="list-stack">{purchaseOrders.map((order) => <div key={order.id} className="list-item"><div><strong>{order.supplier}</strong><div>{order.productName} - Qty {order.quantity}</div></div><span>{order.status}</span></div>)}</div>
    </div>
  );
}

function FollowUpsView({ followUps, customers, followUpForm, setFollowUpForm, onSubmit }: { followUps: FollowUp[]; customers: Customer[]; followUpForm: FollowUpFormState; setFollowUpForm: (value: FollowUpFormState) => void; onSubmit: (event: FormEvent) => Promise<void> }) { return <div className="card"><h2>Follow-ups</h2><form onSubmit={onSubmit} className="stacked-form"><select value={followUpForm.customerId} onChange={(e) => { const selected = customers.find((customer) => customer.id === e.target.value); setFollowUpForm({ ...followUpForm, customerId: e.target.value, customerName: selected?.name || '' }); }} required><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select><input value={followUpForm.note} onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })} placeholder="Follow-up note" required /><input value={followUpForm.nextActionDate} onChange={(e) => setFollowUpForm({ ...followUpForm, nextActionDate: e.target.value })} placeholder="Next action date" required /><button type="submit">Save follow-up</button></form><div className="list-stack">{followUps.map((item) => <div key={item.id} className="list-item"><div><strong>{item.customerName}</strong><div>{item.note}</div></div><span>{item.nextActionDate}</span></div>)}</div></div>; }

function ProfileView({ user, profileForm, setProfileForm, onSubmit, onPhotoUpload, profilePhotoPreview }: { user: User; profileForm: { name: string; email: string; phone: string }; setProfileForm: (value: { name: string; email: string; phone: string }) => void; onSubmit: (event: FormEvent) => Promise<void>; onPhotoUpload: (file: File | null) => Promise<void>; profilePhotoPreview: string }) {
  return (
    <div className="profile-layout">
      <section className="card profile-card">
        <div className="profile-photo">
          {profilePhotoPreview ? <img src={profilePhotoPreview} alt={user.name} /> : <span>{user.name.charAt(0).toUpperCase()}</span>}
        </div>
        <h2>{user.name}</h2>
        <p>{user.role} workspace access</p>
        <label className="photo-upload-button">
          Upload Photo
          <input type="file" accept="image/*" onChange={(event) => void onPhotoUpload(event.target.files?.[0] || null)} />
        </label>
      </section>

      <section className="card profile-form-card">
        <h2>Edit Profile</h2>
        <p className="muted-copy">Update your name, email, phone and profile photo. Changes are saved in the backend data store.</p>
        <form className="stacked-form" onSubmit={onSubmit}>
          <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Full name" required />
          <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Email address" required />
          <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone number" />
          <button type="submit">Save Profile</button>
        </form>
      </section>
    </div>
  );
}

export default App;

