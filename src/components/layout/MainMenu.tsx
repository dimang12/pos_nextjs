'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MainMenu = () => {
  const pathname = usePathname();

  const mainMenuItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/pos', label: 'POS', icon: '💳' },
    { href: '/inventory', label: 'Inventory', icon: '📦' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="w-16 bg-gray-900 text-white h-screen fixed left-0 top-0 z-20">
      <div className="p-4">
        <h1 className="text-xl font-bold text-center">POS</h1>
      </div>
      <ul className="mt-4">
        {mainMenuItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex flex-col items-center px-2 py-3 hover:bg-gray-800 transition-colors ${
                pathname === item.href ? 'bg-gray-800' : ''
              }`}
              title={item.label}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs text-center">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MainMenu; 