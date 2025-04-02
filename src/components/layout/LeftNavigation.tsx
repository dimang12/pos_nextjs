'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavigation } from '@/context/NavigationContext';

const LeftNavigation = () => {
  const pathname = usePathname();
  const { isCollapsed } = useNavigation();

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/products', label: 'Products', icon: '📦' },
    { href: '/orders', label: 'Orders', icon: '🛍️' },
    { href: '/customers', label: 'Customers', icon: '👥' },
    { href: '/reports', label: 'Reports', icon: '📈' },
  ];

  return (
    <nav className={`bg-gray-800 text-white h-screen fixed left-16 w-64 top-0 z-10 transition-all duration-300 ${
      isCollapsed ? '-translate-x-full' : 'translate-x-0'
    }`}>
      <div className="p-4">
        <h1 className="text-xl font-bold">Menu</h1>
      </div>
      <ul className="mt-4">
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center px-4 py-3 hover:bg-gray-700 transition-colors ${
                pathname === item.href ? 'bg-gray-700' : ''
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default LeftNavigation; 