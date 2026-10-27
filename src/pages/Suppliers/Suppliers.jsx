import { Truck } from 'lucide-react';
import Card from '../../components/ui/Card';

const Suppliers = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
          Suppliers
        </h1>
        <p className="text-slate-600">
          Manage supplier relationships and orders
        </p>
      </div>

      <Card>
        <div className="text-center py-12">
          <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Coming Soon
          </h3>
          <p className="text-slate-600">
            Suppliers feature is under development
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Suppliers;
