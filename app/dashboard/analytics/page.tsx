"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  Heart,
  Bookmark,
  Search,
  Globe,
  Camera,
  MapPin,
  Users,
  Package,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  Download,
} from "lucide-react";

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalRevenue: 45820,
    totalOrders: 234,
    conversionRate: 3.8,
    averageOrderValue: 1956,
    trends: {
      revenue: +12.5,
      orders: +8.3,
      conversionRate: +0.4,
      averageOrderValue: +5.2,
    },
  },
  realtimeSales: [
    { time: "00:00", sales: 0 },
    { time: "03:00", sales: 0 },
    { time: "06:00", sales: 450 },
    { time: "09:00", sales: 1200 },
    { time: "12:00", sales: 2800 },
    { time: "15:00", sales: 3200 },
    { time: "18:00", sales: 4100 },
    { time: "21:00", sales: 2600 },
    { time: "Now", sales: 1800 },
  ],
  trafficSources: [
    { source: "Yiiva App Direct", visits: 4520, percentage: 45, conversions: 172 },
    { source: "Instagram", visits: 3200, percentage: 32, conversions: 102 },
    { source: "Google Search", visits: 1800, percentage: 18, conversions: 51 },
    { source: "Direct/Other", visits: 500, percentage: 5, conversions: 9 },
  ],
  topProducts: [
    {
      id: 1,
      name: "The Bonang Dress",
      image: "dress",
      views: 2845,
      purchases: 47,
      likes: 892,
      bookmarks: 234,
      revenue: 89253,
      conversionRate: 1.65,
      searchAppearances: 1247,
    },
    {
      id: 2,
      name: "Vintage Leather Jacket",
      image: "jacket",
      views: 2103,
      purchases: 28,
      likes: 567,
      bookmarks: 189,
      revenue: 24920,
      conversionRate: 1.33,
      searchAppearances: 892,
    },
    {
      id: 3,
      name: "Handmade Beaded Necklace",
      image: "necklace",
      views: 1876,
      purchases: 56,
      likes: 1023,
      bookmarks: 312,
      revenue: 10080,
      conversionRate: 2.98,
      searchAppearances: 1056,
    },
    {
      id: 4,
      name: "The Zola Kimono",
      image: "kimono",
      views: 1654,
      purchases: 34,
      likes: 678,
      bookmarks: 201,
      revenue: 32300,
      conversionRate: 2.06,
      searchAppearances: 743,
    },
    {
      id: 5,
      name: "Suhu Logo SweatPant",
      image: "sweatpant",
      views: 1432,
      purchases: 41,
      likes: 445,
      bookmarks: 156,
      revenue: 36859,
      conversionRate: 2.86,
      searchAppearances: 628,
    },
  ],
  customerGeography: [
    { city: "Johannesburg", customers: 89, percentage: 38, orders: 156 },
    { city: "Cape Town", customers: 67, percentage: 28, orders: 121 },
    { city: "Durban", customers: 34, percentage: 14, orders: 58 },
    { city: "Pretoria", customers: 28, percentage: 12, orders: 47 },
    { city: "Other Cities", customers: 19, percentage: 8, orders: 32 },
  ],
  customerBehavior: {
    averageSessionDuration: "4m 32s",
    bounceRate: 32.5,
    pagesPerSession: 5.8,
    returningCustomers: 42,
    peakShoppingHours: [
      { hour: "09:00-12:00", percentage: 28 },
      { hour: "12:00-15:00", percentage: 35 },
      { hour: "15:00-18:00", percentage: 25 },
      { hour: "18:00-21:00", percentage: 12 },
    ],
    deviceBreakdown: [
      { device: "Mobile", percentage: 78, users: 1845 },
      { device: "Desktop", percentage: 18, users: 426 },
      { device: "Tablet", percentage: 4, users: 95 },
    ],
  },
  searchAnalytics: {
    totalSearches: 8234,
    topSearchTerms: [
      { term: "dresses", count: 1245, conversions: 89 },
      { term: "vintage", count: 892, conversions: 56 },
      { term: "handmade jewelry", count: 678, conversions: 78 },
      { term: "summer clothing", count: 567, conversions: 34 },
      { term: "leather jacket", count: 445, conversions: 28 },
    ],
  },
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7days");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Get top product by metric
  const getMostLiked = () => mockAnalytics.topProducts.reduce((a, b) => (a.likes > b.likes ? a : b));
  const getMostBookmarked = () => mockAnalytics.topProducts.reduce((a, b) => (a.bookmarks > b.bookmarks ? a : b));
  const getMostViewed = () => mockAnalytics.topProducts.reduce((a, b) => (a.views > b.views ? a : b));
  const getMostSearched = () => mockAnalytics.topProducts.reduce((a, b) => (a.searchAppearances > b.searchAppearances ? a : b));

  const mostLiked = getMostLiked();
  const mostBookmarked = getMostBookmarked();
  const mostViewed = getMostViewed();
  const mostSearched = getMostSearched();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Analytics</h1>
          <p className="text-gray-600">Track your performance and customer insights</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          <button className="px-4 py-2 text-black border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center transition-colors">
            <Download size={16} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black mb-1">R{mockAnalytics.overview.totalRevenue.toLocaleString()}</p>
          <div className="flex items-center text-sm">
            {mockAnalytics.overview.trends.revenue > 0 ? (
              <>
                <ArrowUpRight size={16} className="text-green-600 mr-1" />
                <span className="text-green-600 font-medium">+{mockAnalytics.overview.trends.revenue}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight size={16} className="text-red-600 mr-1" />
                <span className="text-red-600 font-medium">{mockAnalytics.overview.trends.revenue}%</span>
              </>
            )}
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Orders</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black mb-1">{mockAnalytics.overview.totalOrders}</p>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-600 mr-1" />
            <span className="text-green-600 font-medium">+{mockAnalytics.overview.trends.orders}%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Percent size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black mb-1">{mockAnalytics.overview.conversionRate}%</p>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-600 mr-1" />
            <span className="text-green-600 font-medium">+{mockAnalytics.overview.trends.conversionRate}%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-black mb-1">R{mockAnalytics.overview.averageOrderValue}</p>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-600 mr-1" />
            <span className="text-green-600 font-medium">+{mockAnalytics.overview.trends.averageOrderValue}%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>
      </div>

      {/* Real-time Sales Graph */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-black flex items-center">
              <Activity size={20} className="mr-2" />
              Real-time Sales Today
            </h2>
            <p className="text-sm text-gray-600">Live sales performance throughout the day</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between space-x-2">
            {mockAnalytics.realtimeSales.map((data, index) => {
              const maxSales = Math.max(...mockAnalytics.realtimeSales.map((d) => d.sales));
              const height = (data.sales / maxSales) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden relative group">
                    <div
                      className="w-full bg-gradient-to-t from-black to-gray-700 transition-all duration-500 hover:from-gray-800"
                      style={{ height: `${height}%`, minHeight: height > 0 ? "8px" : "0" }}
                    >
                      <div className="absolute top-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-white font-bold">R{data.sales}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{data.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Traffic Sources & Customer Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-black mb-2 flex items-center">
            <Globe size={20} className="mr-2" />
            Traffic Sources
          </h2>
          <p className="text-sm text-gray-600 mb-6">Where your customers are coming from</p>
          <div className="space-y-4">
            {mockAnalytics.trafficSources.map((source, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {source.source.includes("Instagram") && <Camera size={16} className="text-pink-500" />}
                    {source.source.includes("Google") && <Search size={16} className="text-blue-500" />}
                    {source.source.includes("Yiiva") && <Package size={16} className="text-black" />}
                    {source.source.includes("Direct") && <Globe size={16} className="text-gray-500" />}
                    <span className="text-sm font-medium text-gray-900">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-black">{source.visits.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{source.conversions} conversions</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-black to-gray-700 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${source.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{source.percentage}% of total traffic</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Geography */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-black mb-2 flex items-center">
            <MapPin size={20} className="mr-2" />
            Customer Geography
          </h2>
          <p className="text-sm text-gray-600 mb-6">Where your customers are located</p>
          <div className="space-y-4">
            {mockAnalytics.customerGeography.map((location, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-900">{location.city}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-black">{location.customers} customers</p>
                    <p className="text-xs text-gray-500">{location.orders} orders</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${location.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{location.percentage}% of customer base</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-black mb-2 flex items-center">
          <BarChart3 size={20} className="mr-2" />
          Product Performance Analysis
        </h2>
        <p className="text-sm text-gray-600 mb-6">Detailed insights on your top products</p>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Product
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Views
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Purchases
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Conv. Rate
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Likes
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Bookmarks
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Search Appearances
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockAnalytics.topProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black">{product.name}</p>
                        <p className="text-xs text-gray-500">Rank #{index + 1}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Eye size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{product.views.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <ShoppingCart size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{product.purchases}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {product.conversionRate}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Heart size={14} className="text-red-400" />
                      <span className="text-sm font-medium text-gray-900">{product.likes.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Bookmark size={14} className="text-blue-400" />
                      <span className="text-sm font-medium text-gray-900">{product.bookmarks}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Search size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{product.searchAppearances.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-bold text-black">R{product.revenue.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Highlighted Product Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Most Liked */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl shadow-sm border border-red-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Heart size={24} className="text-red-500" />
            </div>
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Most Liked</span>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">{mostLiked.name}</h3>
          <p className="text-3xl font-bold text-red-600 mb-2">{mostLiked.likes.toLocaleString()}</p>
          <p className="text-sm text-gray-600">likes on Yiiva app</p>
        </div>

        {/* Most Bookmarked */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Bookmark size={24} className="text-blue-500" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Most Wishlisted</span>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">{mostBookmarked.name}</h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">{mostBookmarked.bookmarks}</p>
          <p className="text-sm text-gray-600">bookmarks on Yiiva app</p>
        </div>

        {/* Most Viewed */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Eye size={24} className="text-purple-500" />
            </div>
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Most Viewed</span>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">{mostViewed.name}</h3>
          <p className="text-3xl font-bold text-purple-600 mb-2">{mostViewed.views.toLocaleString()}</p>
          <p className="text-sm text-gray-600">views on Yiiva app</p>
        </div>

        {/* Most Searched */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Search size={24} className="text-green-500" />
            </div>
            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Most Searched</span>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">{mostSearched.name}</h3>
          <p className="text-3xl font-bold text-green-600 mb-2">{mostSearched.searchAppearances.toLocaleString()}</p>
          <p className="text-sm text-gray-600">search appearances</p>
        </div>
      </div>

      {/* Customer Behavior & Search Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Behavior */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-black mb-2 flex items-center">
            <Users size={20} className="mr-2" />
            Customer Behavior
          </h2>
          <p className="text-sm text-gray-600 mb-6">How customers interact with your store</p>

          <div className="space-y-6">
            {/* Session Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Avg. Session Duration</p>
                <p className="text-2xl font-bold text-black">{mockAnalytics.customerBehavior.averageSessionDuration}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Pages per Session</p>
                <p className="text-2xl font-bold text-black">{mockAnalytics.customerBehavior.pagesPerSession}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Bounce Rate</p>
                <p className="text-2xl font-bold text-black">{mockAnalytics.customerBehavior.bounceRate}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Returning Customers</p>
                <p className="text-2xl font-bold text-black">{mockAnalytics.customerBehavior.returningCustomers}%</p>
              </div>
            </div>

            {/* Peak Shopping Hours */}
            <div>
              <h3 className="text-sm font-semibold text-black mb-3 flex items-center">
                <Clock size={16} className="mr-2" />
                Peak Shopping Hours
              </h3>
              <div className="space-y-2">
                {mockAnalytics.customerBehavior.peakShoppingHours.map((period, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{period.hour}</span>
                      <span className="text-xs font-medium text-black">{period.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${period.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-black mb-3">Device Breakdown</h3>
              <div className="space-y-2">
                {mockAnalytics.customerBehavior.deviceBreakdown.map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{device.device}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-black h-2 rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-black w-12 text-right">{device.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-black mb-2 flex items-center">
            <Search size={20} className="mr-2" />
            Search Analytics
          </h2>
          <p className="text-sm text-gray-600 mb-6">What customers are searching for</p>

          <div className="mb-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Searches on Yiiva App</p>
              <p className="text-3xl font-bold text-black">{mockAnalytics.searchAnalytics.totalSearches.toLocaleString()}</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-black mb-3">Top Search Terms</h3>
          <div className="space-y-3">
            {mockAnalytics.searchAnalytics.topSearchTerms.map((term, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-black transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-black text-white text-xs font-bold rounded">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-black">"{term.term}"</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{term.count.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Conversions: {term.conversions}</span>
                  <span className="text-green-600 font-medium">
                    {((term.conversions / term.count) * 100).toFixed(1)}% conv. rate
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-black mb-2 flex items-center">
          <TrendingUp size={20} className="mr-2" />
          AI-Powered Insights & Recommendations
        </h2>
        <p className="text-sm text-gray-600 mb-6">Smart suggestions to boost your performance</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-black text-sm mb-1">High Engagement Products</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Your jewelry category has 3x more engagement than average. Consider expanding this line.
                </p>
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  Opportunity
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-black text-sm mb-1">Peak Traffic Timing</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Most of your traffic comes between 12-3 PM. Post new products during this window.
                </p>
                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                  Tip
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Camera size={20} className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-black text-sm mb-1">Instagram Performing Well</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Instagram drives 32% of your traffic with strong conversion. Keep promoting there.
                </p>
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                  Strength
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
