import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Search, Calendar, ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const ITEMS_PER_PAGE = 10;

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, [currentPage, dateFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      let salesQuery = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc')
      );

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        }
        
        if (startDate) {
          salesQuery = query(
            collection(db, 'sales'),
            where('createdAt', '>=', startDate.toISOString()),
            orderBy('createdAt', 'desc')
          );
        }
      }

      const salesSnapshot = await getDocs(salesQuery);
      const allTransactions = salesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate pagination
      const total = Math.ceil(allTransactions.length / ITEMS_PER_PAGE);
      setTotalPages(total);

      // Get current page data
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const pageData = allTransactions.slice(startIndex, endIndex);

      setTransactions(pageData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Customer', 'Items', 'Total', 'Date'];
    const rows = filteredTransactions.map(t => [
      t.transactionId || t.id,
      t.customerName,
      t.items.length,
      t.totalAmount,
      formatDate(t.createdAt)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showToast('Transactions exported successfully', 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading transactions...</p>
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
            Transaction History
          </h1>
          <p className="text-slate-600">
            View and manage all sales transactions
          </p>
        </div>
        <Button variant="primary" icon={Download} onClick={exportToCSV}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Transaction ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Items
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Total Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Payment
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <p className="text-slate-500">No transactions found</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-medium text-slate-900">
                        {transaction.transactionId || transaction.id.substring(0, 8) + '...'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {transaction.customerName}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {transaction.items?.length || 0} items
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900">
                      ₱{transaction.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="info">
                        {transaction.paymentMethod || 'Cash'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => viewDetails(transaction)}
                        className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                icon={ChevronLeft}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Transaction Details"
          size="lg"
        >
          <div className="space-y-4">
            {/* Transaction Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Transaction ID</p>
                <p className="font-mono text-sm font-medium">
                  {selectedTransaction.transactionId || selectedTransaction.id}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Date</p>
                <p className="text-sm font-medium">{formatDate(selectedTransaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Customer</p>
                <p className="text-sm font-medium">{selectedTransaction.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Payment Method</p>
                <Badge variant="info">{selectedTransaction.paymentMethod || 'Cash'}</Badge>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Items</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">
                        Product
                      </th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">
                        Qty
                      </th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">
                        Price
                      </th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransaction.items?.map((item, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="py-2 px-4 text-sm">{item.productName}</td>
                        <td className="py-2 px-4 text-sm">{item.quantity}</td>
                        <td className="py-2 px-4 text-sm">₱{item.price?.toLocaleString()}</td>
                        <td className="py-2 px-4 text-sm font-semibold">
                          ₱{item.subtotal?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">₱{selectedTransaction.subtotal?.toLocaleString()}</span>
              </div>
              {selectedTransaction.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-medium text-success">
                    -₱{selectedTransaction.discount?.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                <span>Total</span>
                <span className="text-accent">₱{selectedTransaction.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default History;
