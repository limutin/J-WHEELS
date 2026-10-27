import { useState, useEffect } from 'react';
import { Store, User, Lock, Bell, Shield, Moon, Sun, Mail, Phone, MapPin } from 'lucide-react';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const Settings = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  // Shop Settings
  const [shopName, setShopName] = useState('J-Wheels POS and Inventory System');
  const [shopAddress, setShopAddress] = useState('');
  const [shopContact, setShopContact] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState('PHP');
  
  // User Profile
  const [displayName, setDisplayName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  
  // Password Change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(true);
  
  // Appearance
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [currentUser]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load shop settings
      const shopDoc = await getDoc(doc(db, 'settings', 'shop'));
      if (shopDoc.exists()) {
        const data = shopDoc.data();
        setShopName(data.name || 'J-Wheels POS and Inventory System');
        setShopAddress(data.address || '');
        setShopContact(data.contact || '');
        setShopEmail(data.email || '');
        setTaxRate(data.taxRate || 0);
        setCurrency(data.currency || 'PHP');
      }
      
      // Load user profile
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(userData.displayName || currentUser.email?.split('@')[0] || '');
          setUserEmail(userData.email || currentUser.email || '');
          setUserPhone(userData.phone || '');
          setEmailNotifications(userData.notifications?.email !== false);
          setLowStockAlerts(userData.notifications?.lowStock !== false);
          setSalesNotifications(userData.notifications?.sales !== false);
          setDarkMode(userData.preferences?.darkMode || false);
        } else {
          // Initialize user document
          setUserEmail(currentUser.email || '');
          setDisplayName(currentUser.email?.split('@')[0] || '');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShopProfile = async () => {
    try {
      setSaving(true);
      
      const shopData = {
        name: shopName,
        address: shopAddress,
        contact: shopContact,
        email: shopEmail,
        taxRate: parseFloat(taxRate),
        currency,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.uid || 'unknown'
      };
      
      await setDoc(doc(db, 'settings', 'shop'), shopData, { merge: true });
      showToast('Shop profile updated successfully', 'success');
    } catch (error) {
      console.error('Error saving shop profile:', error);
      showToast('Failed to save shop profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserProfile = async () => {
    try {
      setSaving(true);
      
      if (!currentUser) {
        showToast('No user logged in', 'error');
        return;
      }
      
      const userData = {
        displayName,
        email: userEmail,
        phone: userPhone,
        notifications: {
          email: emailNotifications,
          lowStock: lowStockAlerts,
          sales: salesNotifications
        },
        preferences: {
          darkMode
        },
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', currentUser.uid), userData, { merge: true });
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error saving user profile:', error);
      showToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all password fields', 'warning');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'warning');
        return;
      }
      
      if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'warning');
        return;
      }
      
      if (!currentUser || !currentUser.email) {
        showToast('No user logged in', 'error');
        return;
      }
      
      setChangingPassword(true);
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      showToast('Password changed successfully', 'success');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showToast('Current password is incorrect', 'error');
      } else if (error.code === 'auth/weak-password') {
        showToast('Password is too weak', 'error');
      } else {
        showToast('Failed to change password', 'error');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
          Settings
        </h1>
        <p className="text-slate-600">
          Manage your shop settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Card.Title>User Profile</Card.Title>
                  <p className="text-sm text-slate-500">Update your personal information</p>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
                <Input
                  label="Email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  disabled
                />
                <Input
                  label="Phone Number"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="+63 912 345 6789"
                />
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="primary" 
                    onClick={handleSaveUserProfile}
                    loading={saving}
                    disabled={saving}
                  >
                    Save Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    icon={Lock}
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Shop Profile */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <Card.Title>Shop Information</Card.Title>
                  <p className="text-sm text-slate-500">Update your shop details</p>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <Input
                  label="Shop Name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Your shop name"
                />
                <Input
                  label="Address"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="123 Main Street, City"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Contact Number"
                    value={shopContact}
                    onChange={(e) => setShopContact(e.target.value)}
                    placeholder="+63 912 345 6789"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    placeholder="shop@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
                    >
                      <option value="PHP">PHP (₱)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <Input
                    label="Tax Rate (%)"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="pt-2">
                  <Button 
                    variant="primary" 
                    onClick={handleSaveShopProfile}
                    loading={saving}
                    disabled={saving}
                  >
                    Save Shop Settings
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Notifications */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-success" />
                </div>
                <div>
                  <Card.Title>Notifications</Card.Title>
                  <p className="text-sm text-slate-500">Manage your notification preferences</p>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="text-slate-900 font-medium">Email Notifications</span>
                    <p className="text-xs text-slate-500 mt-1">Receive updates via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-5 h-5 text-accent focus:ring-accent border-slate-300 rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="text-slate-900 font-medium">Low Stock Alerts</span>
                    <p className="text-xs text-slate-500 mt-1">Get notified when items are low in stock</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={lowStockAlerts}
                    onChange={(e) => setLowStockAlerts(e.target.checked)}
                    className="w-5 h-5 text-accent focus:ring-accent border-slate-300 rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="text-slate-900 font-medium">Sales Notifications</span>
                    <p className="text-xs text-slate-500 mt-1">Receive alerts for new sales</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={salesNotifications}
                    onChange={(e) => setSalesNotifications(e.target.checked)}
                    className="w-5 h-5 text-accent focus:ring-accent border-slate-300 rounded"
                  />
                </label>
              </div>
              <div className="pt-4">
                <Button 
                  variant="primary" 
                  onClick={handleSaveUserProfile}
                  loading={saving}
                  disabled={saving}
                >
                  Save Preferences
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  {darkMode ? (
                    <Moon className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Sun className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <Card.Title>Appearance</Card.Title>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <span className="text-slate-700">Dark Mode</span>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => {
                    setDarkMode(e.target.checked);
                    showToast('Dark mode will be available in future update', 'info');
                  }}
                  className="w-5 h-5 text-accent focus:ring-accent border-slate-300 rounded"
                />
              </label>
              <p className="text-xs text-slate-500 mt-3">
                Toggle between light and dark theme (Coming soon)
              </p>
            </Card.Content>
          </Card>

          {/* Account Security */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <Card.Title>Security</Card.Title>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Account Status</span>
                  <span className="px-2 py-1 bg-green-100 text-success text-xs font-medium rounded">
                    Active
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Email</span>
                  <span className="font-medium text-slate-900">{userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">User ID</span>
                  <span className="font-mono text-xs text-slate-600">
                    {currentUser?.uid?.substring(0, 8)}...
                  </span>
                </div>
              </div>
              <div className="pt-4">
                <Button 
                  variant="ghost" 
                  className="w-full text-red-600 hover:bg-red-50 border-red-200"
                  icon={Lock}
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* System Info */}
          <Card>
            <Card.Header>
              <Card.Title>System Information</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Version</span>
                  <span className="font-medium text-slate-900">2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Database</span>
                  <span className="font-medium text-slate-900">Firebase</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status</span>
                  <span className="px-2 py-1 bg-green-100 text-success text-xs font-medium rounded">
                    Online
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Environment</span>
                  <span className="font-medium text-slate-900">Production</span>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Help */}
          <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
            <Card.Header>
              <Card.Title className="text-white">Need Help?</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-blue-100 text-sm mb-4">
                Check our documentation or contact support for assistance.
              </p>
              <Button 
                variant="ghost" 
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => showToast('Documentation coming soon', 'info')}
              >
                View Documentation
              </Button>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}
        title="Change Password"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              Enter your current password and choose a new password. Make sure it's at least 6 characters long.
            </p>
          </div>

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 6 characters)"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              disabled={changingPassword}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleChangePassword}
              loading={changingPassword}
              disabled={changingPassword}
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
