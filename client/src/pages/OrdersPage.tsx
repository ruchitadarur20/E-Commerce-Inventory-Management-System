import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import type { Order, Product } from '../types';

interface OrdersResponse {
  count: number;
  orders: Order[];
}

interface ProductsResponse {
  products: Product[];
}

interface OrderItemDraft {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const STATUS_BADGE: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  // Order form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [skuInput, setSkuInput] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [itemError, setItemError] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<OrderItemDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get<OrdersResponse>('/orders');
      setOrders(data.orders);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setIsLoading(false);
    }
  };

  const openForm = async () => {
    setShowForm(true);
    if (availableProducts.length === 0) {
      try {
        const { data } = await axiosInstance.get<ProductsResponse>('/products?limit=500');
        setAvailableProducts(data.products);
      } catch {
        // non-fatal — SKU lookup will just return "not found"
      }
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setCustomerName('');
    setCustomerEmail('');
    setSkuInput('');
    setQtyInput('1');
    setDraftItems([]);
    setItemError(null);
    setFormError(null);
  };

  const handleAddItem = () => {
    setItemError(null);
    const qty = parseInt(qtyInput, 10);
    if (!skuInput.trim() || isNaN(qty) || qty < 1) {
      setItemError('Enter a valid SKU and a quantity ≥ 1.');
      return;
    }

    const product = availableProducts.find(
      (p) => p.sku.toLowerCase() === skuInput.trim().toLowerCase()
    );
    if (!product) {
      setItemError(`No product found with SKU "${skuInput.trim()}".`);
      return;
    }

    const totalQtyInDraft = draftItems.find((i) => i.productId === product._id)?.quantity ?? 0;
    if (product.quantity < totalQtyInDraft + qty) {
      setItemError(`Only ${product.quantity - totalQtyInDraft} unit(s) available.`);
      return;
    }

    setDraftItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        { productId: product._id, sku: product.sku, name: product.name, quantity: qty, unitPrice: product.price },
      ];
    });
    setSkuInput('');
    setQtyInput('1');
  };

  const removeDraftItem = (productId: string) => {
    setDraftItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const draftTotal = draftItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const handlePlaceOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (draftItems.length === 0) {
      setFormError('Add at least one item before placing the order.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/orders', {
        customer: { name: customerName.trim(), email: customerEmail.trim() },
        items: draftItems.map((i) => ({ product: i.productId, quantity: i.quantity, price: i.unitPrice })),
      });
      closeForm();
      fetchOrders();
      // Refresh available products so stock counts stay accurate
      const { data } = await axiosInstance.get<ProductsResponse>('/products?limit=500');
      setAvailableProducts(data.products);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to place order.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={showForm ? closeForm : openForm}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ Create Order'}
        </button>
      </div>

      {/* Create order form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">New Order</h2>
          <form onSubmit={handlePlaceOrder} className="space-y-5">
            {/* Customer info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Email</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Add item by SKU */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Add Item by SKU</label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                  placeholder="e.g. WGT-001"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36"
                />
                <input
                  type="number"
                  min="1"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  placeholder="Qty"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-20"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Add Item
                </button>
              </div>
              {itemError && <p className="text-red-500 text-xs mt-1.5">{itemError}</p>}
            </div>

            {/* Draft items table */}
            {draftItems.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">SKU</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Product</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Qty</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Unit Price</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Subtotal</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {draftItems.map((item) => (
                      <tr key={item.productId} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{item.sku}</td>
                        <td className="px-3 py-2 text-gray-800">{item.name}</td>
                        <td className="px-3 py-2 text-gray-800">{item.quantity}</td>
                        <td className="px-3 py-2 text-gray-800">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeDraftItem(item.productId)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-200 text-right text-sm font-semibold text-gray-800">
                  Order Total: ${draftTotal.toFixed(2)}
                </div>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {formError}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Placing…' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      {/* Orders table */}
      {isLoading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No orders yet.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.customer.name}</p>
                    <p className="text-xs text-gray-400">{order.customer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">${order.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
