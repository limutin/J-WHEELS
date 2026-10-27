import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, Upload, X } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import CategoryBrandManager from '../../components/CategoryBrandManager';

// Motor Parts Categories
const MOTOR_CATEGORIES = [
  { value: 'engine', label: 'Engine Parts' },
  { value: 'transmission', label: 'Transmission' },
  { value: 'brake', label: 'Brake System' },
  { value: 'suspension', label: 'Suspension & Steering' },
  { value: 'electrical', label: 'Electrical System' },
  { value: 'cooling', label: 'Cooling System' },
  { value: 'exhaust', label: 'Exhaust System' },
  { value: 'fuel', label: 'Fuel System' },
  { value: 'filters', label: 'Filters & Fluids' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'body', label: 'Body Parts' },
  { value: 'interior', label: 'Interior Parts' },
  { value: 'wheels', label: 'Wheels & Tires' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
];

const inventorySchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  description: z.string().optional(),
});

// Sample data - replace with Firestore data
const sampleInventory = [
  {
    id: '1',
    name: 'Engine Oil 10W-40',
    sku: 'EO-10W40-001',
    category: 'filters',
    brand: 'Shell',
    quantity: 45,
    costPrice: 250,
    sellingPrice: 350,
    reorderThreshold: 20,
    status: 'In Stock',
    imageUrl: null,
    description: 'Premium synthetic engine oil',
  },
  {
    id: '2',
    name: 'Brake Pads Set',
    sku: 'BP-STD-002',
    category: 'brake',
    brand: 'Bendix',
    quantity: 12,
    costPrice: 800,
    sellingPrice: 1200,
    reorderThreshold: 15,
    status: 'Low Stock',
    imageUrl: null,
    description: 'Front brake pads for most vehicles',
  },
  {
    id: '3',
    name: 'Air Filter',
    sku: 'AF-UNI-003',
    category: 'filters',
    brand: 'K&N',
    quantity: 0,
    costPrice: 150,
    sellingPrice: 250,
    reorderThreshold: 10,
    status: 'Out of Stock',
    imageUrl: null,
    description: 'Universal air filter',
  },
];

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [categories, setCategories] = useState(MOTOR_CATEGORIES);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inventorySchema),
  });

  // Load inventory and settings from Firestore
  useEffect(() => {
    loadInventory();
    loadSettings();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const items = inventorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInventory(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
      showToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Load categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      if (categoriesSnapshot.docs.length > 0) {
        const loadedCategories = categoriesSnapshot.docs
          .map(doc => ({
            value: doc.id,
            label: doc.data().name,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
        setCategories(loadedCategories);
      } else {
        // Initialize with default categories
        await initializeDefaultCategories();
      }

      // Load brands
      const brandsSnapshot = await getDocs(collection(db, 'brands'));
      if (brandsSnapshot.docs.length > 0) {
        const loadedBrands = brandsSnapshot.docs
          .map(doc => ({
            value: doc.id,
            label: doc.data().name,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
        setBrands(loadedBrands);
      } else {
        // Initialize with default brands
        await initializeDefaultBrands();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const initializeDefaultCategories = async () => {
    try {
      for (const category of MOTOR_CATEGORIES) {
        await addDoc(collection(db, 'categories'), {
          name: category.label,
          createdAt: new Date().toISOString(),
        });
      }
      await loadSettings();
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  };

  const initializeDefaultBrands = async () => {
    try {
      // Comprehensive list of motorcycle parts brands
      const defaultBrands = [
        // Major Motorcycle Manufacturers
        'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'KTM',
        'Ducati', 'BMW Motorrad', 'Harley-Davidson', 'Triumph', 'Royal Enfield',
        'Aprilia', 'Husqvarna', 'Beta', 'Gas Gas', 'Sherco',
        
        // Engine & Performance Parts
        'NGK', 'Denso', 'Bosch', 'Champion', 'Autolite',
        'Wiseco', 'JE Pistons', 'CP Pistons', 'Vertex', 'ProX',
        'Hot Cams', 'Web Cam', 'Kibblewhite', 'Cometic', 'Athena',
        
        // Oil & Lubricants
        'Motul', 'Shell', 'Castrol', 'Mobil 1', 'Liqui Moly',
        'Bel-Ray', 'Maxima', 'Motorex', 'Yamalube', 'Honda GN4',
        
        // Brake Systems
        'Brembo', 'Nissin', 'EBC', 'Galfer', 'Ferodo',
        'Bendix', 'Akebono', 'TRW', 'SBS', 'Braking',
        
        // Filters
        'K&N', 'HiFlo Filtro', 'Twin Air', 'Uni Filter', 'No Toil',
        'BMC', 'DNA', 'Pipercross', 'Moose Racing', 'Maxima',
        
        // Tires
        'Michelin', 'Pirelli', 'Dunlop', 'Bridgestone', 'Metzeler',
        'Continental', 'Shinko', 'IRC', 'Maxxis', 'Kenda',
        
        // Chain & Sprockets
        'DID', 'RK', 'EK', 'Regina', 'Renthal',
        'JT Sprockets', 'Vortex', 'Sunstar', 'PBR', 'Afam',
        
        // Suspension
        'Ohlins', 'WP Suspension', 'Showa', 'Fox Racing', 'KYB',
        'Traxxion', 'Race Tech', 'Hyperpro', 'Progressive', 'Elka',
        
        // Clutch
        'FCC', 'Barnett', 'EBC', 'Hinson', 'Rekluse',
        'Wiseco', 'DP Brakes', 'Magura', 'Tusk', 'ProX',
        
        // Electrical
        'Denso', 'NGK', 'Bosch', 'Yuasa', 'Shorai',
        'Ballistic', 'Antigravity', 'Motobatt', 'JMT', 'MotoMaster',
        
        // Exhaust Systems
        'Akrapovic', 'Yoshimura', 'FMF', 'Pro Circuit', 'Two Brothers Racing',
        'Arrow', 'SC Project', 'Termignoni', 'LeoVince', 'Vance & Hines',
        
        // Cables & Controls
        'Motion Pro', 'Venhill', 'Magura', 'Barnett', 'Pro Taper',
        'Renthal', 'TAG Metals', 'Works Connection', 'Moose Racing', 'Tusk',
        
        // Bearings & Seals
        'All Balls Racing', 'SKF', 'Koyo', 'NTN', 'Timken',
        'Pivot Works', 'Hot Rods', 'Pro X', 'Moose Racing', 'Tusk',
        
        // Gaskets & Engine Parts
        'Cometic', 'Athena', 'Vesrah', 'Moose Racing', 'Hot Rods',
        'Wiseco', 'ProX', 'Vertex', 'Namura', 'Mitaka',
        
        // Body & Plastics
        'Acerbis', 'Polisport', 'UFO', 'Cycra', 'Maier',
        'Racetech', 'Moose Racing', 'Tusk', 'Works Connection', 'TMD',
        
        // Lighting
        'Baja Designs', 'Cyclops', 'Trail Tech', 'Denali', 'Rigid',
        'LED Concepts', 'Custom Dynamics', 'Kuryakyn', 'Moose Racing', 'Tusk',
        
        // Handlebars & Grips
        'Renthal', 'Pro Taper', 'TAG Metals', 'Answer', 'Easton',
        'ODI', 'Pro Grip', 'Scott', 'Spider Grips', 'Moose Racing',
        
        // Air Filters & Intake
        'K&N', 'Twin Air', 'No Toil', 'Uni Filter', 'Maxima',
        'DNA', 'BMC', 'Pipercross', 'Moose Racing', 'Tusk',
        
        // Cooling System
        'Engine Ice', 'Water Wetter', 'Evans', 'Motul', 'Maxima',
        'Mishimoto', 'Fluidyne', 'Moose Racing', 'Tusk', 'Trail Tech',
        
        // Fuel System
        'Mikuni', 'Keihin', 'FCR', 'PWK', 'DynoJet',
        'Lectron', 'Boyesen', 'Vortex', 'ProX', 'All Balls Racing',
        
        // Tools & Maintenance
        'Motion Pro', 'Tusk', 'Bikemaster', 'Park Tool', 'Beta Tools',
        'Maxima', 'Motul', 'Bel-Ray', 'PJ1', 'WD-40',
        
        // Generic & Other
        'OEM', 'Genuine Parts', 'Aftermarket', 'Racing Parts',
        'Performance Parts', 'Heavy Duty', 'Premium', 'Standard', 'Other'
      ];

      for (const brand of defaultBrands) {
        await addDoc(collection(db, 'brands'), {
          name: brand,
          createdAt: new Date().toISOString(),
        });
      }
      await loadSettings();
    } catch (error) {
      console.error('Error initializing brands:', error);
    }
  };

  // Filter and search
  useEffect(() => {
    let filtered = inventory;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((item) => item.status.toLowerCase() === filterStatus);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === filterCategory);
    }

    // Filter by brand
    if (filterBrand !== 'all') {
      filtered = filtered.filter((item) => item.brand === filterBrand);
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInventory(filtered);
  }, [inventory, searchTerm, filterStatus, filterCategory, filterBrand]);

  const getStockStatus = (quantity) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 10) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusBadge = (status) => {
    const variants = {
      'In Stock': 'success',
      'Low Stock': 'warning',
      'Out of Stock': 'danger',
    };
    return variants[status] || 'info';
  };

  const getCategoryLabel = (categoryValue) => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const getBrandLabel = (brandValue) => {
    const brand = brands.find(b => b.value === brandValue);
    return brand ? brand.label : brandValue;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image size should be less than 5MB', 'warning');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImageToStorage = async (file, itemId) => {
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${itemId}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `inventory/${filename}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const deleteImageFromStorage = async (imageUrl) => {
    try {
      if (!imageUrl) return;
      
      // Extract the file path from the Firebase Storage URL
      // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
      const matches = imageUrl.match(/\/o\/(.+?)\?/);
      if (matches && matches[1]) {
        const filePath = decodeURIComponent(matches[1]);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        console.log('Image deleted successfully:', filePath);
      }
    } catch (error) {
      // Don't throw error if file doesn't exist or already deleted
      if (error.code === 'storage/object-not-found') {
        console.log('Image already deleted or does not exist');
      } else {
        console.error('Error deleting image:', error);
      }
    }
  };

  const handleAddEdit = async (data) => {
    try {
      setSaving(true);
      
      let imageUrl = editingItem?.imageUrl || null;
      
      // Upload new image to Firebase Storage if a new file was selected
      if (imageFile) {
        const tempId = editingItem?.id || `temp_${Date.now()}`;
        imageUrl = await uploadImageToStorage(imageFile, tempId);
        
        // Delete old image if updating and there was a previous image
        if (editingItem?.imageUrl && editingItem.imageUrl !== imageUrl) {
          await deleteImageFromStorage(editingItem.imageUrl);
        }
      }
      
      const itemData = {
        ...data,
        costPrice: parseFloat(data.costPrice),
        sellingPrice: parseFloat(data.sellingPrice),
        quantity: parseInt(data.quantity),
        status: getStockStatus(parseInt(data.quantity)),
        imageUrl: imageUrl,
        description: data.description || '',
        updatedAt: new Date().toISOString(),
      };

      if (editingItem) {
        // Update existing item in Firestore
        const itemRef = doc(db, 'inventory', editingItem.id);
        await updateDoc(itemRef, itemData);
        
        // Update local state
        setInventory((prev) =>
          prev.map((item) => (item.id === editingItem.id ? { ...item, ...itemData } : item))
        );
        showToast('Item updated successfully', 'success');
      } else {
        // Add new item to Firestore
        const newItemData = {
          ...itemData,
          createdAt: new Date().toISOString(),
        };
        
        const docRef = await addDoc(collection(db, 'inventory'), newItemData);
        
        // If we uploaded with a temp ID, we need to upload again with the real ID
        if (imageFile && imageUrl) {
          const finalImageUrl = await uploadImageToStorage(imageFile, docRef.id);
          await updateDoc(docRef, { imageUrl: finalImageUrl });
          newItemData.imageUrl = finalImageUrl;
          
          // Delete temp image
          await deleteImageFromStorage(imageUrl);
        }
        
        // Update local state
        const newItem = {
          id: docRef.id,
          ...newItemData,
        };
        setInventory((prev) => [...prev, newItem]);
        showToast('Item added successfully', 'success');
      }

      closeModal();
    } catch (error) {
      console.error('Error saving item:', error);
      showToast('Failed to save item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setImagePreview(item.imageUrl);
    reset(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        // Get the item to find the image URL
        const item = inventory.find(i => i.id === id);
        
        // Delete from Firestore first
        await deleteDoc(doc(db, 'inventory', id));
        
        // Update local state
        setInventory((prev) => prev.filter((item) => item.id !== id));
        
        // Delete image from storage if exists (don't wait for it)
        if (item?.imageUrl) {
          deleteImageFromStorage(item.imageUrl).catch(err => {
            console.error('Failed to delete image, but item was deleted:', err);
          });
        }
        
        showToast('Item deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Failed to delete item', 'error');
      }
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setImagePreview(null);
    setImageFile(null);
    reset({
      name: '',
      category: '',
      brand: '',
      costPrice: 0,
      sellingPrice: 0,
      quantity: 0,
      description: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setImagePreview(null);
    setImageFile(null);
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
            Inventory Management
          </h1>
          <p className="text-slate-600">
            Manage your products and track stock levels
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="ghost" 
            icon={Filter} 
            onClick={() => setIsSettingsModalOpen(true)}
          >
            Manage Categories & Brands
          </Button>
          <Button variant="primary" icon={Plus} onClick={openAddModal}>
            Add New Item
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading inventory...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <Card>
            <div className="flex flex-col gap-4">
              {/* Search Row */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Dropdowns Row */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Category Filter */}
                <div className="w-full md:w-1/3">
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
                <div className="w-full md:w-1/3">
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

                {/* Clear Filters Button */}
                <div className="w-full md:w-1/3">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCategory('all');
                      setFilterBrand('all');
                      setFilterStatus('all');
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('in stock')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'in stock'
                      ? 'bg-success text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => setFilterStatus('low stock')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'low stock'
                      ? 'bg-warning text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setFilterStatus('out of stock')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'out of stock'
                      ? 'bg-danger text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Out of Stock
                </button>
              </div>
            </div>
          </Card>

      {/* Inventory Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Image
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Product
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Brand
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Stock
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Cost
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Price
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Profit
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No items found</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{item.name}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {getCategoryLabel(item.category)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">{getBrandLabel(item.brand)}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{item.quantity}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      ₱{item.costPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900">
                      ₱{item.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold ${
                          (item.sellingPrice - item.costPrice) > 0 ? 'text-success' : 'text-danger'
                        }`}>
                          ₱{(item.sellingPrice - item.costPrice).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({item.costPrice > 0 ? (((item.sellingPrice - item.costPrice) / item.costPrice) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadge(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-danger hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit(handleAddEdit)} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Product Image
            </label>
            <div className="flex items-start gap-4">
              {/* Image Preview */}
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center relative">
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 p-1 bg-danger rounded-full text-white hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <Package className="w-12 h-12 text-slate-400" />
                )}
              </div>
              
              {/* Upload Button */}
              <div className="flex-1">
                <label className="btn btn-ghost border border-slate-300 cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  Recommended: 500x500px, Max 5MB (JPG, PNG, WebP)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name"
              placeholder="Brake Pads Set"
              error={errors.name?.message}
              {...register('name')}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Brand
              </label>
              <select
                {...register('brand')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                  errors.brand ? 'border-danger' : 'border-slate-300'
                }`}
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.value} value={brand.value}>
                    {brand.label}
                  </option>
                ))}
              </select>
              {errors.brand && (
                <p className="mt-1 text-sm text-danger">{errors.brand.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                {...register('category')}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                  errors.category ? 'border-danger' : 'border-slate-300'
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-danger">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost Price (₱)"
              type="number"
              step="0.01"
              placeholder="250.00"
              error={errors.costPrice?.message}
              {...register('costPrice', { valueAsNumber: true })}
            />
            <Input
              label="Selling Price (₱)"
              type="number"
              step="0.01"
              placeholder="350.00"
              error={errors.sellingPrice?.message}
              {...register('sellingPrice', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              placeholder="45"
              error={errors.quantity?.message}
              {...register('quantity', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              placeholder="Additional product details..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving} disabled={saving}>
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category & Brand Management Modal */}
      {isSettingsModalOpen && (
        <CategoryBrandManager
          onClose={() => setIsSettingsModalOpen(false)}
          onUpdate={loadSettings}
        />
      )}
    </div>
  );
};

export default Inventory;
