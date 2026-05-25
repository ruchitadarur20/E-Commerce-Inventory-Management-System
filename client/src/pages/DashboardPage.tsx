import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import type { Product, Order } from '../types';

interface ProductsResponse {
  products: Product[];
  totalProducts: number;
}

interface OrdersResponse {
  count: number;
  orders: Order[];
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  accent: 'indigo' | 'emerald' | 'amber';
}

function StatCard({ label, value, accent }: StatCardProps) {
  const styles = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`rounded-xl border p-6 ${styles[accent]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-5xl font-bold mt-2 tabular-nums">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, ordRes] = await Promise.all([
          axiosInstance.get<ProductsResponse>('/products?limit=500'),
          axiosInstance.get<OrdersResponse>('/orders'),
        ]);
        setProducts(prodRes.data.products);
        setOrders(ordRes.data.orders);
      } catch {
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const lowStockItems = products.filter((p) => p.quantity <= p.lowStockThreshold);

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total Products" value={products.length} accent="indigo" />
        <StatCard label="Total Orders" value={orders.length} accent="emerald" />
        <StatCard label="Low Stock Items" value={lowStockItems.length} accent="amber" />
      </div>

      {/* Low stock table */}
      {lowStockItems.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Low Stock Alert
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Quantity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((p) => (
                  <tr key={p._id} className="border-b border-gray-100 last:border-0 hover:bg-amber-50/40">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category}</td>
                    <td className="px-4 py-3">
                      <span className="text-red-600 font-semibold">{p.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !isLoading && products.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-5 py-4 text-sm font-medium">
            All products are sufficiently stocked.
          </div>
        )
      )}
    </div>
  );
}
