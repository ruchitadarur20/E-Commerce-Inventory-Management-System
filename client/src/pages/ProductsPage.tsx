import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';

interface ProductsResponse {
  products: Product[];
  totalProducts: number;
  page: number;
  totalPages: number;
}

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  quantity: string;
  price: string;
  lowStockThreshold: string;
  supplier: string;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  sku: '',
  category: '',
  quantity: '',
  price: '',
  lowStockThreshold: '10',
  supplier: '',
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const FORM_FIELDS: { name: keyof ProductForm; label: string; placeholder: string; type?: string; required?: boolean }[] = [
  { name: 'name', label: 'Product Name', placeholder: 'Widget A' },
  { name: 'sku', label: 'SKU', placeholder: 'WGT-001' },
  { name: 'category', label: 'Category', placeholder: 'Electronics' },
  { name: 'quantity', label: 'Quantity', placeholder: '100', type: 'number' },
  { name: 'price', label: 'Price ($)', placeholder: '29.99', type: 'number' },
  { name: 'lowStockThreshold', label: 'Low Stock Threshold', placeholder: '10', type: 'number' },
  { name: 'supplier', label: 'Supplier', placeholder: 'ACME Corp', required: false },
];

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(EMPTY_FORM);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const fetchProducts = async (name?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (name) params.set('name', name);
      const { data } = await axiosInstance.get<ProductsResponse>(`/products?${params.toString()}`);
      setProducts(data.products);
    } catch {
      setError('Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = () => fetchProducts(searchName.trim() || undefined);

  const handleClearSearch = () => {
    setSearchName('');
    fetchProducts();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      setError('Failed to delete product.');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditOpen = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      quantity: String(product.quantity),
      price: String(product.price),
      lowStockThreshold: String(product.lowStockThreshold),
      supplier: product.supplier ?? '',
    });
    setEditFormError(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditFormError(null);
    setIsEditSubmitting(true);
    try {
      await axiosInstance.put(`/products/${editingProduct._id}`, {
        name: editForm.name.trim(),
        sku: editForm.sku.trim(),
        category: editForm.category.trim(),
        quantity: Number(editForm.quantity),
        price: Number(editForm.price),
        lowStockThreshold: Number(editForm.lowStockThreshold),
        supplier: editForm.supplier.trim() || undefined,
      });
      setEditingProduct(null);
      fetchProducts(searchName.trim() || undefined);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update product.';
      setEditFormError(msg);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/products', {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category.trim(),
        quantity: Number(form.quantity),
        price: Number(form.price),
        lowStockThreshold: Number(form.lowStockThreshold),
        supplier: form.supplier.trim() || undefined,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchProducts(searchName.trim() || undefined);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create product.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        {isAdmin && (
          <button
            onClick={() => { setShowForm((v) => !v); setFormError(null); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Add Product'}
          </button>
        )}
      </div>

      {/* Add product form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">New Product</h2>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FORM_FIELDS.map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input
                  name={field.name}
                  type={field.type ?? 'text'}
                  value={form[field.name]}
                  onChange={handleFormChange}
                  placeholder={field.placeholder}
                  required={field.required !== false}
                  min={field.type === 'number' ? '0' : undefined}
                  step={field.name === 'price' ? '0.01' : undefined}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Creating…' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit product form */}
      {editingProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Update Product</h2>
            <button
              onClick={() => setEditingProduct(null)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕ Cancel
            </button>
          </div>
          {editFormError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {editFormError}
            </div>
          )}
          <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FORM_FIELDS.map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input
                  name={field.name}
                  type={field.type ?? 'text'}
                  value={editForm[field.name]}
                  onChange={handleEditFormChange}
                  placeholder={field.placeholder}
                  required={field.required !== false}
                  min={field.type === 'number' ? '0' : undefined}
                  step={field.name === 'price' ? '0.01' : undefined}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
              <button
                type="submit"
                disabled={isEditSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
              >
                {isEditSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-5">
        <input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by name…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={handleSearch}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Search
        </button>
        {searchName && (
          <button
            onClick={handleClearSearch}
            className="text-gray-400 hover:text-gray-600 text-sm underline"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No products found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Quantity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                {isAdmin && <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isLow = product.quantity <= product.lowStockThreshold;
                return (
                  <tr key={product._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.quantity}
                      </span>
                      {isLow && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">
                          low
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">${product.price.toFixed(2)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 flex items-center gap-3">
                        <button
                          onClick={() => handleEditOpen(product)}
                          className="text-indigo-500 hover:text-indigo-700 text-xs font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
