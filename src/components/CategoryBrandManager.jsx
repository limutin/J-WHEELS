import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check, Download } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Button from './ui/Button';
import Input from './ui/Input';
import { useToast } from './ui/Toast';
import { initializeAllBrands } from '../utils/initializeBrands';

const CategoryBrandManager = ({ onClose, onUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editBrandName, setEditBrandName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingBrand, setAddingBrand] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [initializingBrands, setInitializingBrands] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const handleInitializeBrands = async () => {
    if (!window.confirm('This will add 200+ motorcycle brands to your database. Continue?')) {
      return;
    }

    try {
      setInitializingBrands(true);
      showToast('Initializing brands... This may take a minute.', 'info');
      
      const result = await initializeAllBrands();
      
      await loadData();
      onUpdate();
      showToast(
        `Successfully added ${result.successCount} brands!`,
        'success'
      );
    } catch (error) {
      console.error('Error initializing brands:', error);
      showToast('Failed to initialize brands', 'error');
    } finally {
      setInitializingBrands(false);
    }
  };

  const loadData = async () => {
    try {
      // Load categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const loadedCategories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setCategories(loadedCategories);

      // Load brands
      const brandsSnapshot = await getDocs(collection(db, 'brands'));
      const loadedBrands = brandsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setBrands(loadedBrands);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    }
  };

  // Category Management
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('Category name cannot be empty', 'warning');
      return;
    }

    try {
      setAddingCategory(true);
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewCategoryName('');
      await loadData();
      onUpdate();
      showToast('Category added successfully', 'success');
    } catch (error) {
      console.error('Error adding category:', error);
      showToast('Failed to add category', 'error');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category.id);
    setEditCategoryName(category.name);
  };

  const handleSaveCategory = async (id) => {
    if (!editCategoryName.trim()) {
      showToast('Category name cannot be empty', 'warning');
      return;
    }

    try {
      setSavingCategory(true);
      await updateDoc(doc(db, 'categories', id), {
        name: editCategoryName.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditingCategory(null);
      setEditCategoryName('');
      await loadData();
      onUpdate();
      showToast('Category updated successfully', 'success');
    } catch (error) {
      console.error('Error updating category:', error);
      showToast('Failed to update category', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'categories', id));
      await loadData();
      onUpdate();
      showToast('Category deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Failed to delete category', 'error');
    }
  };

  // Brand Management
  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      showToast('Brand name cannot be empty', 'warning');
      return;
    }

    try {
      setAddingBrand(true);
      await addDoc(collection(db, 'brands'), {
        name: newBrandName.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewBrandName('');
      await loadData();
      onUpdate();
      showToast('Brand added successfully', 'success');
    } catch (error) {
      console.error('Error adding brand:', error);
      showToast('Failed to add brand', 'error');
    } finally {
      setAddingBrand(false);
    }
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand.id);
    setEditBrandName(brand.name);
  };

  const handleSaveBrand = async (id) => {
    if (!editBrandName.trim()) {
      showToast('Brand name cannot be empty', 'warning');
      return;
    }

    try {
      setSavingBrand(true);
      await updateDoc(doc(db, 'brands', id), {
        name: editBrandName.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditingBrand(null);
      setEditBrandName('');
      await loadData();
      onUpdate();
      showToast('Brand updated successfully', 'success');
    } catch (error) {
      console.error('Error updating brand:', error);
      showToast('Failed to update brand', 'error');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'brands', id));
      await loadData();
      onUpdate();
      showToast('Brand deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting brand:', error);
      showToast('Failed to delete brand', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold text-slate-900">
              Manage Categories & Brands
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Categories</h3>
              
              {/* Add New Category */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  onKeyPress={(e) => e.key === 'Enter' && !addingCategory && handleAddCategory()}
                  disabled={addingCategory}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <Button
                  variant="primary"
                  icon={addingCategory ? null : Plus}
                  onClick={handleAddCategory}
                  disabled={addingCategory}
                  className="shrink-0 min-w-[80px]"
                >
                  {addingCategory ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>

              {/* Categories List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {editingCategory === category.id ? (
                      <>
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveCategory(category.id)}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveCategory(category.id)}
                          disabled={savingCategory}
                          className="p-2 text-success hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingCategory ? (
                            <div className="w-4 h-4 border-2 border-success border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setEditCategoryName('');
                          }}
                          className="p-2 text-slate-500 hover:bg-slate-200 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-slate-900">{category.name}</span>
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-primary hover:bg-blue-100 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-danger hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No categories yet</p>
                )}
              </div>
            </div>

            {/* Brands Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Brands</h3>
                <button
                  onClick={handleInitializeBrands}
                  disabled={initializingBrands}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {initializingBrands ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding 200+ Brands...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      <span>Load All Brands</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Add New Brand */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="New brand name"
                  onKeyPress={(e) => e.key === 'Enter' && !addingBrand && handleAddBrand()}
                  disabled={addingBrand}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <Button
                  variant="primary"
                  icon={addingBrand ? null : Plus}
                  onClick={handleAddBrand}
                  disabled={addingBrand}
                  className="shrink-0 min-w-[80px]"
                >
                  {addingBrand ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>

              {/* Brands List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {editingBrand === brand.id ? (
                      <>
                        <input
                          type="text"
                          value={editBrandName}
                          onChange={(e) => setEditBrandName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveBrand(brand.id)}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveBrand(brand.id)}
                          disabled={savingBrand}
                          className="p-2 text-success hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingBrand ? (
                            <div className="w-4 h-4 border-2 border-success border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingBrand(null);
                            setEditBrandName('');
                          }}
                          className="p-2 text-slate-500 hover:bg-slate-200 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-slate-900">{brand.name}</span>
                        <button
                          onClick={() => handleEditBrand(brand)}
                          className="p-2 text-primary hover:bg-blue-100 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(brand.id)}
                          className="p-2 text-danger hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {brands.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No brands yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryBrandManager;
