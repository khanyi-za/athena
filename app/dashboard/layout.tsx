"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Camera,
  TrendingUp,
  Settings,
  Bell,
  User,
  Plus,
  MessageCircle,
  Mail,
  ChevronDown,
  Store
} from "lucide-react";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: BarChart3,
    description: "Sales metrics and quick stats"
  },
  {
    name: "Products",
    href: "/dashboard/products",
    icon: Package,
    description: "Manage your fashion catalog"
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
    description: "Process and fulfill orders"
  },
  {
    name: "Messages",
    href: "/dashboard/messages",
    icon: Mail,
    description: "Customer communications"
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: TrendingUp,
    description: "Performance insights"
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Business and account settings"
  }
];

// Mock merchants data from CSV
const merchants = [
  {
    id: "cmg0mhiky0000w4k8h8qwx34c",
    username: "tol_thema",
    displayName: "Tol'thema",
    businessType: "fashion_brand",
    location: "Johannesburg, South Africa",
    logo: "/tol_thema/tol'thema-logo.png",
    isVerified: true,
  },
  {
    id: "cmg0mhil00001w4k8qnmi1fu9",
    username: "suhu",
    displayName: "SUHU",
    businessType: "streetwear_brand",
    location: "Johannesburg, South Africa",
    logo: "/suhu/suhu-logo.png",
    isVerified: true,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [selectedMerchant, setSelectedMerchant] = useState(merchants[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <img 
                  src="/ICON_BLACK.png" 
                  alt="Yiiva" 
                  className="h-8 w-auto"
                />
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-black transition-colors">
                <Bell size={20} />
              </button>

              {/* Merchant Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors"
                >
                  <img
                    src={selectedMerchant.logo}
                    alt={selectedMerchant.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-semibold text-gray-900">{selectedMerchant.displayName}</span>
                      {selectedMerchant.isVerified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    ></div>

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Select Merchant
                          </p>
                        </div>
                        <div className="mt-2 space-y-1">
                          {merchants.map((merchant) => (
                            <button
                              key={merchant.id}
                              onClick={() => {
                                setSelectedMerchant(merchant);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                                selectedMerchant.id === merchant.id
                                  ? "bg-black text-white"
                                  : "hover:bg-gray-50 text-gray-900"
                              }`}
                            >
                              <img
                                src={merchant.logo}
                                alt={merchant.displayName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1 text-left">
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm font-semibold">{merchant.displayName}</span>
                                  {merchant.isVerified && (
                                    <svg className={`w-4 h-4 ${selectedMerchant.id === merchant.id ? "text-blue-300" : "text-blue-500"}`} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div className={`text-xs ${selectedMerchant.id === merchant.id ? "text-gray-300" : "text-gray-500"}`}>
                                  <span className="capitalize">{merchant.businessType.replace('_', ' ')}</span>
                                </div>
                                <div className={`text-xs ${selectedMerchant.id === merchant.id ? "text-gray-400" : "text-gray-400"}`}>
                                  {merchant.location}
                                </div>
                              </div>
                              {selectedMerchant.id === merchant.id && (
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex overflow-hidden">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200 flex-shrink-0">
          <div className="px-3 py-6">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const IconComponent = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "bg-black text-white"
                          : "text-gray-700 hover:text-black hover:bg-gray-50"
                      }`}
                    >
                      <IconComponent size={18} className="mr-3" />
                      <div className="flex-1">
                        <div>{item.name}</div>
                        <div className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-500'} group-hover:text-gray-600`}>
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg flex items-center transition-colors">
                <Plus size={16} className="mr-2" />
                Add Product
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg flex items-center transition-colors">
                <Camera size={16} className="mr-2" />
                Import from Instagram
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg flex items-center transition-colors">
                <MessageCircle size={16} className="mr-2" />
                Customer Support
              </button>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}