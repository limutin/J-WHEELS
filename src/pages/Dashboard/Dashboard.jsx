import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { DollarSign, Package, AlertTriangle, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    salesChange: 0,
    lowStockCount: 0,
    stockChange: 0,
    inventoryValue: 0,
    valueChange: 0,
    totalOrders: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all necessary data in parallel
      await Promise.all([
        loadMetrics(),
        loadSalesData(),
        loadTopProducts(),
        loadRecentTransactions(),
        loadLowStockItems(),
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get yesterday's date range for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get sales for today
      const todaySalesQuery = query(
        collection(db, 'sales'),
        where('createdAt', '>=', today.toISOString()),
        where('createdAt', '<', tomorrow.toISOString())
      );
      const todaySalesSnapshot = await getDocs(todaySalesQuery);
      const todayTotal = todaySalesSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().totalAmount || 0),
        0
      );

      // Get sales for yesterday
      const yesterdaySalesQuery = query(
        collection(db, 'sales'),
        where('createdAt', '>=', yesterday.toISOString()),
        where('createdAt', '<', today.toISOString())
      );
      const yesterdaySalesSnapshot = await getDocs(yesterdaySalesQuery);
      const yesterdayTotal = yesterdaySalesSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().totalAmount || 0),
        0
      );

      const salesChange = yesterdayTotal > 0 
        ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 
        : 0;

      // Get inventory data
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const inventoryItems = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const lowStockCount = inventoryItems.filter(
        item => item.quantity <= 10
      ).length;

      const inventoryValue = inventoryItems.reduce(
        (sum, item) => sum + (item.quantity * item.costPrice || 0),
        0
      );

      // Get total orders count
      const ordersSnapshot = await getDocs(collection(db, 'sales'));

      setMetrics({
        totalSales: todayTotal,
        salesChange: salesChange.toFixed(1),
        lowStockCount,
        stockChange: 0, // Can be calculated with historical data
        inventoryValue,
        valueChange: 0, // Can be calculated with historical data
        totalOrders: ordersSnapshot.size,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadSalesData = async () => {
    try {
      // Get sales for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const salesQuery = query(
        collection(db, 'sales'),
        where('createdAt', '>=', sevenDaysAgo.toISOString()),
        orderBy('createdAt', 'asc')
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      
      // Group sales by day
      const salesByDay = {};
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      salesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = new Date(data.createdAt);
        const dayKey = dayNames[date.getDay()];
        
        if (!salesByDay[dayKey]) {
          salesByDay[dayKey] = 0;
        }
        salesByDay[dayKey] += data.totalAmount || 0;
      });

      // Create chart data for last 7 days
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = dayNames[date.getDay()];
        chartData.push({
          name: dayName,
          sales: salesByDay[dayName] || 0,
        });
      }

      setSalesData(chartData);
    } catch (error) {
      console.error('Error loading sales data:', error);
      // Fallback to sample data
      setSalesData([
        { name: 'Mon', sales: 0 },
        { name: 'Tue', sales: 0 },
        { name: 'Wed', sales: 0 },
        { name: 'Thu', sales: 0 },
        { name: 'Fri', sales: 0 },
        { name: 'Sat', sales: 0 },
        { name: 'Sun', sales: 0 },
      ]);
    }
  };

  const loadTopProducts = async () => {
    try {
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const products = inventorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by quantity sold (if tracked) or by revenue
      const sorted = products
        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        .slice(0, 5)
        .map(product => ({
          name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
          sales: product.quantity || 0,
          revenue: (product.quantity || 0) * (product.sellingPrice || 0),
        }));

      setTopProducts(sorted);
    } catch (error) {
      console.error('Error loading top products:', error);
      setTopProducts([]);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const salesQuery = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      const transactions = salesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customer: data.customerName || 'Walk-in Customer',
          items: data.items?.length || 0,
          total: data.totalAmount || 0,
          date: new Date(data.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
        };
      });

      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
      setRecentTransactions([]);
    }
  };

  const loadLowStockItems = async () => {
    try {
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const items = inventorySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.quantity <= 10)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);

      setLowStockItems(items);
    } catch (error) {
      console.error('Error loading low stock items:', error);
      setLowStockItems([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600">
          Welcome back! Here's what's happening with your shop today.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales Today */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Sales Today</p>
              <p className="text-3xl font-bold text-slate-900">
                ₱{metrics.totalSales.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {metrics.salesChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-danger" />
                )}
                <span className={`text-sm font-medium ${metrics.salesChange >= 0 ? 'text-success' : 'text-danger'}`}>
                  {metrics.salesChange >= 0 ? '+' : ''}{metrics.salesChange}%
                </span>
                <span className="text-sm text-slate-500">vs yesterday</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Low Stock Items</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.lowStockCount}</p>
              <div className="flex items-center gap-1 mt-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-sm text-slate-500">Needs attention</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
          </div>
        </Card>

        {/* Total Inventory Value */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Inventory Value</p>
              <p className="text-3xl font-bold text-slate-900">
                ₱{metrics.inventoryValue.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm text-slate-500">Total stock value</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Total Orders */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.totalOrders}</p>
              <div className="flex items-center gap-1 mt-2">
                <ShoppingCart className="w-4 h-4 text-accent" />
                <span className="text-sm text-slate-500">All time</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <Card.Header>
            <Card.Title>Sales Trend (Last 7 Days)</Card.Title>
          </Card.Header>
          <Card.Content>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => ['₱' + value.toLocaleString(), 'Sales']}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ fill: '#F97316', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* Top Products */}
        <Card>
          <Card.Header>
            <Card.Title>Top Products (By Stock)</Card.Title>
          </Card.Header>
          <Card.Content>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="sales" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No products available
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Recent Transactions and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <Card.Header>
            <Card.Title>Recent Transactions</Card.Title>
          </Card.Header>
          <Card.Content>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{transaction.customer}</p>
                      <p className="text-sm text-slate-500">
                        {transaction.items} items • {transaction.date}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      ₱{transaction.total.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                No transactions yet
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <Card.Header>
            <Card.Title>Low Stock Alert</Card.Title>
          </Card.Header>
          <Card.Content>
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {item.brand} • SKU: {item.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-danger">
                        {item.quantity}
                      </p>
                      <p className="text-xs text-slate-500">
                        units left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                All items are well stocked
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
