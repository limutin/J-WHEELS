import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, Package, DollarSign } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const Reports = () => {
  const [dateRange, setDateRange] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    itemsSold: 0,
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Get date range
      const { startDate, endDate } = getDateRangeFilter();
      
      // Load sales transactions
      const salesQuery = query(
        collection(db, 'sales'),
        where('createdAt', '>=', startDate.toISOString()),
        where('createdAt', '<=', endDate.toISOString()),
        orderBy('createdAt', 'asc')
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      const transactions = salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process data
      processSalesData(transactions);
      processCategoryData(transactions);
      processTopProducts(transactions);
      calculateMetrics(transactions);
      
    } catch (error) {
      console.error('Error loading report data:', error);
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate = new Date();
    const endDate = now;

    switch (dateRange) {
      case 'daily':
        // Last 7 days
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        // Last 4 weeks
        startDate.setDate(now.getDate() - 27);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        // Last 12 months
        startDate.setMonth(now.getMonth() - 11);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setDate(now.getDate() - 6);
    }

    return { startDate, endDate };
  };

  const processSalesData = (transactions) => {
    const groupedData = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      let key;

      switch (dateRange) {
        case 'daily':
          // Group by day
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'weekly':
          // Group by week
          const weekNum = Math.ceil((date.getDate()) / 7);
          key = `Week ${weekNum}`;
          break;
        case 'monthly':
          // Group by month
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        default:
          key = date.toLocaleDateString();
      }

      if (!groupedData[key]) {
        groupedData[key] = { name: key, sales: 0, profit: 0 };
      }

      const revenue = transaction.totalAmount || 0;
      const cost = transaction.items?.reduce((sum, item) => 
        sum + (item.costPrice * item.quantity), 0) || 0;
      const profit = revenue - cost;

      groupedData[key].sales += revenue;
      groupedData[key].profit += profit;
    });

    const chartData = Object.values(groupedData);
    setSalesData(chartData);
  };

  const processCategoryData = (transactions) => {
    const categoryTotals = {};

    transactions.forEach(transaction => {
      transaction.items?.forEach(item => {
        const category = item.category || 'Other';
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += item.subtotal || 0;
      });
    });

    // Convert to percentage-based pie chart data
    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    
    const colors = [
      '#1E3A8A', '#F97316', '#16A34A', '#EAB308', '#8B5CF6',
      '#EC4899', '#06B6D4', '#64748B', '#F59E0B', '#10B981'
    ];

    const pieData = Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value: total > 0 ? Math.round((value / total) * 100) : 0,
        actualValue: value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.actualValue - a.actualValue)
      .slice(0, 8); // Top 8 categories

    setCategoryData(pieData);
  };

  const processTopProducts = (transactions) => {
    const productStats = {};

    transactions.forEach(transaction => {
      transaction.items?.forEach(item => {
        const productName = item.productName;
        if (!productStats[productName]) {
          productStats[productName] = {
            name: productName,
            sold: 0,
            revenue: 0
          };
        }
        productStats[productName].sold += item.quantity;
        productStats[productName].revenue += item.subtotal || 0;
      });
    });

    const topList = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setTopProducts(topList);
  };

  const calculateMetrics = (transactions) => {
    let totalRevenue = 0;
    let totalCost = 0;
    let itemsSold = 0;

    transactions.forEach(transaction => {
      totalRevenue += transaction.totalAmount || 0;
      
      transaction.items?.forEach(item => {
        totalCost += (item.costPrice || 0) * (item.quantity || 0);
        itemsSold += item.quantity || 0;
      });
    });

    const totalProfit = totalRevenue - totalCost;

    setMetrics({
      totalRevenue,
      totalProfit,
      itemsSold
    });
  };

  const getPeriodLabel = () => {
    switch (dateRange) {
      case 'daily':
        return 'Last 7 Days';
      case 'weekly':
        return 'Last 4 Weeks';
      case 'monthly':
        return 'Last 12 Months';
      default:
        return 'This Week';
    }
  };

  const exportReport = () => {
    try {
      // Prepare CSV data
      const headers = ['Period', 'Sales', 'Profit'];
      const rows = salesData.map(item => [
        item.name,
        item.sales.toFixed(2),
        item.profit.toFixed(2)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      showToast('Report exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export report', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
            Reports & Analytics
          </h1>
          <p className="text-slate-600">
            Track performance and make data-driven decisions
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" icon={Download} onClick={exportReport}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-700">Time Period:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange('daily')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                dateRange === 'daily'
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setDateRange('weekly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                dateRange === 'weekly'
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setDateRange('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                dateRange === 'monthly'
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900">₱{metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-2">{getPeriodLabel()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Profit</p>
              <p className="text-3xl font-bold text-slate-900">₱{metrics.totalProfit.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-2">
                {metrics.totalRevenue > 0 
                  ? `${((metrics.totalProfit / metrics.totalRevenue) * 100).toFixed(1)}% margin`
                  : 'No sales data'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Items Sold</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.itemsSold.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-2">
                {salesData.length > 0 ? `Across ${salesData.length} periods` : 'No data'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Profit Trend */}
        <Card>
          <Card.Header>
            <Card.Title>Sales & Profit Trend ({getPeriodLabel()})</Card.Title>
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
                  formatter={(value) => `₱${value.toLocaleString()}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#1E3A8A"
                  strokeWidth={3}
                  name="Sales"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#F97316"
                  strokeWidth={3}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
            {salesData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No sales data available for this period</p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Sales by Category */}
        <Card>
          <Card.Header>
            <Card.Title>Sales by Category</Card.Title>
          </Card.Header>
          <Card.Content>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `₱${props.payload.actualValue.toLocaleString()}`, 
                    `${value}%`
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {categoryData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No category data available</p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card>
        <Card.Header>
          <Card.Title>Top Selling Products</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Product Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Units Sold
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Revenue
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <p className="text-slate-500">No product sales data available</p>
                    </td>
                  </tr>
                ) : (
                  topProducts.map((product, index) => (
                    <tr
                      key={product.name}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {product.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {product.sold} units
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900">
                        ₱{product.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-success">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Top {index + 1}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Reports;
