"use client";

import Link from "next/link";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  User, 
  Plus,
  Camera,
  ArrowRight,
  CheckCircle
} from "lucide-react";

// Mock data - in real app this would come from API
const mockStats = {
  totalSales: 15420,
  totalOrders: 127,
  totalProducts: 89,
  conversionRate: 3.2,
  recentOrders: [
    {
      id: "ORD-2024-001",
      customer: "Sarah Johnson",
      product: "Vintage Denim Jacket",
      amount: 450,
      status: "confirmed",
      date: "2024-01-15"
    },
    {
      id: "ORD-2024-002",
      customer: "Michael Chen",
      product: "Summer Dress Collection",
      amount: 680,
      status: "processing",
      date: "2024-01-15"
    },
    {
      id: "ORD-2024-003",
      customer: "Thandiwe Mthembu",
      product: "Handmade Earrings",
      amount: 120,
      status: "shipped",
      date: "2024-01-14"
    }
  ],
  topProducts: [
    {
      name: "Bohemian Summer Dresses",
      sales: 23,
      revenue: 6900,
      image: "👗"
    },
    {
      name: "Vintage Leather Jackets",
      sales: 12,
      revenue: 5400,
      image: "🧥"
    },
    {
      name: "Handmade Jewelry Set",
      sales: 34,
      revenue: 4080,
      image: "💍"
    }
  ]
};

const StatCard = ({ title, value, subtitle, trend, icon: Icon }: {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-black">{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-lg">
        <Icon size={24} className="text-gray-600" />
      </div>
    </div>
    {trend && (
      <div className="mt-4">
        <span className="text-black text-sm font-medium">{trend}</span>
      </div>
    )}
  </div>
);

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-black rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-gray-300 mb-4">
          Here's what's happening with your fashion business today
        </p>
        <div className="flex space-x-4">
          <Link
            href="/dashboard-legacy/products/new"
            className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add New Product
          </Link>
          <Link
            href="/dashboard-legacy/products"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-600 flex items-center"
          >
            <Package size={16} className="mr-2" />
            Manage My Products
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={`R${mockStats.totalSales.toLocaleString()}`}
          subtitle="This month"
          trend="+12% from last month"
          icon={DollarSign}
        />
        <StatCard
          title="Orders"
          value={mockStats.totalOrders}
          subtitle="Total orders"
          trend="+8% from last month"
          icon={ShoppingCart}
        />
        <StatCard
          title="Products"
          value={mockStats.totalProducts}
          subtitle="In catalog"
          icon={Package}
        />
        <StatCard
          title="Conversion Rate"
          value={`${mockStats.conversionRate}%`}
          subtitle="Visitors to customers"
          trend="+0.3% from last month"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockStats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <User size={16} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{order.customer}</p>
                          <p className="text-sm text-gray-500">{order.product}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">R{order.amount}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'confirmed' ? 'bg-gray-100 text-gray-800' :
                        order.status === 'processing' ? 'bg-gray-200 text-gray-800' :
                        'bg-black text-white'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/dashboard-legacy/orders"
                  className="text-black hover:text-gray-600 font-medium text-sm flex items-center"
                >
                  View all orders
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockStats.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-black text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.sales} sales • R{product.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-black">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/dashboard-legacy/analytics"
                  className="text-black hover:text-gray-600 font-medium text-sm flex items-center"
                >
                  View analytics
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard-legacy/instagram"
            className="p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-colors text-center"
          >
            <div className="mb-2 flex justify-center">
              <Camera size={24} className="text-gray-600" />
            </div>
            <h3 className="font-medium text-black">Import Instagram Posts</h3>
            <p className="text-sm text-gray-500">Turn your posts into products</p>
          </Link>
          <Link
            href="/dashboard-legacy/products/new"
            className="p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-colors text-center"
          >
            <div className="mb-2 flex justify-center">
              <Plus size={24} className="text-gray-600" />
            </div>
            <h3 className="font-medium text-black">Add New Product</h3>
            <p className="text-sm text-gray-500">Manually add a fashion item</p>
          </Link>
          <Link
            href="/dashboard-legacy/analytics"
            className="p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-colors text-center"
          >
            <div className="mb-2 flex justify-center">
              <TrendingUp size={24} className="text-gray-600" />
            </div>
            <h3 className="font-medium text-black">View Analytics</h3>
            <p className="text-sm text-gray-500">Track your performance</p>
          </Link>
        </div>
      </div>

      {/* Tips for Fashion Merchants */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
          <CheckCircle size={20} className="mr-2 text-gray-600" />
          Tips for South African Fashion Merchants
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle size={16} className="text-black mt-1" />
            <div>
              <p className="font-medium text-black">Use local sizing</p>
              <p className="text-sm text-gray-600">Include SA size charts and measurements</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle size={16} className="text-black mt-1" />
            <div>
              <p className="font-medium text-black">Highlight local materials</p>
              <p className="text-sm text-gray-600">Showcase South African fabrics and craftsmanship</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle size={16} className="text-black mt-1" />
            <div>
              <p className="font-medium text-black">Seasonal collections</p>
              <p className="text-sm text-gray-600">Plan for SA seasons (summer Dec-Feb)</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle size={16} className="text-black mt-1" />
            <div>
              <p className="font-medium text-black">Shipping times</p>
              <p className="text-sm text-gray-600">Set realistic delivery times for major cities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}