import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/orders', label: 'Orders' },
];

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: brand + links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-wide select-none">
              Inventory Manager
            </Link>
            {token && (
              <div className="hidden sm:flex items-center gap-1">
                {NAV_LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      pathname === to
                        ? 'bg-indigo-900 text-white'
                        : 'text-indigo-100 hover:bg-indigo-600'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right: user info + logout */}
          {token && user && (
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-indigo-200">
                {user.name}
                <span className="ml-1 text-xs opacity-60 capitalize">({user.role})</span>
              </span>
              <button
                onClick={logout}
                className="bg-indigo-800 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
