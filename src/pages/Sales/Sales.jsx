import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, Banknote } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState('Walk-in Customer');
  const [discount, setDiscount] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadBrands(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const items = inventorySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(item => item.quantity > 0); // Only show items in stock
      setProducts(items);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('Failed to load products', 'error');
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const cats = categoriesSnapshot.docs
        .map(doc => ({
          value: doc.id,
          label: doc.data().name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const brandsSnapshot = await getDocs(collection(db, 'brands'));
      const brnds = brandsSnapshot.docs
        .map(doc => ({
          value: doc.id,
          label: doc.data().name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setBrands(brnds);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const getCategoryLabel = (categoryId) => {
    const category = categories.find(cat => cat.value === categoryId);
    return category ? category.label : categoryId;
  };

  const getBrandLabel = (brandId) => {
    const brand = brands.find(b => b.value === brandId);
    return brand ? brand.label : brandId;
  };

  const filteredProducts = products.filter((product) => {
    // Search filter
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBrandLabel(product.brand).toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    
    // Brand filter
    const matchesBrand = filterBrand === 'all' || product.brand === filterBrand;
    
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(
          cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
      } else {
        showToast('Not enough stock', 'warning');
      }
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1,
        price: product.sellingPrice 
      }]);
    }
  };

  const updateQuantity = (id, delta) => {
    const item = cart.find((item) => item.id === id);
    const product = products.find((p) => p.id === id);
    
    if (!item || !product) return;
    
    const newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else if (newQuantity <= product.quantity) {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      showToast('Not enough stock', 'warning');
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  // Generate custom transaction ID: JW-YYYYMMDD-XXXX
  const generateTransactionId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
    return `JW-${year}${month}${day}-${random}`;
  };

  const handleInitiateSale = () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'warning');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleCompleteSale = async () => {
    try {
      setProcessing(true);
      setShowConfirmModal(false);

      // Generate custom transaction ID
      const transactionId = generateTransactionId();

      // Create sale record
      const saleData = {
        transactionId,
        customerName: customer,
        items: cart.map(item => ({
          productName: item.name,
          brand: getBrandLabel(item.brand),
          category: getCategoryLabel(item.category),
          quantity: item.quantity,
          price: item.price,
          costPrice: item.costPrice,
          subtotal: item.price * item.quantity,
        })),
        subtotal,
        discount: discountAmount,
        totalAmount: total,
        paymentMethod: 'cash',
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.uid || 'unknown',
      };

      // Save to Firestore
      await addDoc(collection(db, 'sales'), saleData);

      // Update inventory quantities
      for (const item of cart) {
        const itemRef = doc(db, 'inventory', item.id);
        await updateDoc(itemRef, {
          quantity: increment(-item.quantity),
          updatedAt: new Date().toISOString(),
        });
      }

      showToast(`Sale completed! Transaction ID: ${transactionId}`, 'success');
      
      // Reset
      setCart([]);
      setDiscount(0);
      setCustomer('Walk-in Customer');
      
      // Reload products to update stock
      await loadProducts();
    } catch (error) {
      console.error('Error completing sale:', error);
      showToast('Failed to complete sale', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
          Point of Sale
        </h1>
        <p className="text-slate-600">
          Process sales and manage transactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filters */}
          <Card>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-lg"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Category Filter */}
                <div className="flex-1">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="flex-1">
                  <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
                  >
                    <option value="all">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand.value} value={brand.value}>
                        {brand.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                    setFilterBrand('all');
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 whitespace-nowrap"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No products found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md hover:border-accent transition-all"
                onClick={() => addToCart(product)}
              >
                  <div className="space-y-3">
                    <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingCart className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mb-2">
                        {getBrandLabel(product.brand)}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-accent">
                          ₱{product.sellingPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">
                          Stock: {product.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
              </Card>
            ))
            )}
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="space-y-4">
          {/* Customer Selection */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Customer</h3>
            </div>
            <Input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Customer name"
            />
          </Card>

          {/* Cart */}
          <Card className="flex flex-col h-[500px]">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Cart</h3>
              <span className="text-sm text-slate-500">({cart.length} items)</span>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 text-sm mb-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        ₱{item.price.toLocaleString()} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 w-6 h-6 flex items-center justify-center text-danger hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              {/* Discount */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 flex-1">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right"
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">₱{subtotal.toLocaleString()}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Discount ({discount}%)</span>
                  <span className="font-medium text-success">
                    -₱{discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-3">
                <span>Total</span>
                <span className="text-accent">₱{total.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Payment Method - Removed Card Option */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <Banknote className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Payment Method</h3>
            </div>
            <div className="px-4 py-3 rounded-lg border-2 border-accent bg-orange-50 text-accent font-semibold text-center">
              <Banknote className="w-6 h-6 mx-auto mb-1" />
              <span>Cash Payment</span>
            </div>
          </Card>

          {/* Complete Sale Button */}
          <Button
            variant="primary"
            className="w-full py-4 text-lg"
            onClick={handleInitiateSale}
            disabled={cart.length === 0 || processing}
            loading={processing}
          >
            {processing ? 'Processing...' : `Complete Sale - ₱${total.toLocaleString()}`}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Sale"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 mb-2">
              Are you sure you want to complete this sale?
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Customer:</span>
                <span className="font-medium">{customer}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Items:</span>
                <span className="font-medium">{cart.length} product(s)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">₱{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Discount:</span>
                  <span className="font-medium text-success">-₱{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-orange-300 pt-2 mt-2">
                <span>Total:</span>
                <span className="text-accent">₱{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCompleteSale}
              disabled={processing}
              loading={processing}
            >
              {processing ? 'Processing...' : 'Confirm Sale'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sales;
