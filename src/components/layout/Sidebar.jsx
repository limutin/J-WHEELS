import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  Truck,
  BarChart3,
  Settings,
} from 'lucide-react';
import logo from '../../assets/logo.jpg';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Inventory', icon: Package, path: '/inventory' },
    { name: 'Sales / POS', icon: ShoppingCart, path: '/sales' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Suppliers', icon: Truck, path: '/suppliers' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src={logo} alt="J-Wheels Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-slate-900">J-Wheels</h1>
            <p className="text-xs text-slate-500">POS & Inventory</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-accent text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs font-medium text-primary mb-1">Need help?</p>
          <p className="text-xs text-slate-600">Check our documentation</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
