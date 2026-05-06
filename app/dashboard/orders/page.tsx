"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Search,
  Download,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Eye,
  MoreHorizontal,
  RefreshCw,
  DollarSign,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Video as VideoIcon,
  Users
} from "lucide-react";

// Product media data
const productMediaMap: Record<string, Array<{type: string, url: string}>> = {
  "The Bonang dress": [
    { type: "image", url: "/tol_thema/The Bonang dress_1.png" },
    { type: "image", url: "/tol_thema/The Bonang dress_2.png" }
  ],
  "Handmade Beaded Necklace": [
    { type: "image", url: "/tol_thema/Nontsikelelo boubou_1.png" }
  ],
  "Vintage Leather Jacket": [
    { type: "image", url: "/tol_thema/The Khosi Shirt.png" }
  ],
  "The Zola Kimono": [
    { type: "image", url: "/tol_thema/The Zola Kimono_1.png" },
    { type: "image", url: "/tol_thema/The Zola Kimono_2.png" }
  ],
  "Suhu Logo SweatPant": [
    { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_3.jpg" },
    { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_2.png" },
    { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_4.jpg" },
    { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_5.jpg" },
    { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_7.jpg" }
  ],
  "Snatched Kimono Mosadi": [
    { type: "image", url: "/tol_thema/Kimono Mosadi Snatched_2.png" },
    { type: "image", url: "/tol_thema/Kimono Mosadi Snatched_3.png" },
    { type: "image", url: "/tol_thema/Kimono Mosadi Snatched_4.png" },
    { type: "video", url: "/tol_thema/Kimono Mosadi Snatched_1.mp4" },
    { type: "video", url: "/tol_thema/Kimono Mosadi Snatched_5.mp4" }
  ],
  "Suhu Eye Knitted Golfer": [
    { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_4.jpg" },
    { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_5.jpg" },
    { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_6.jpg" },
    { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_3.jpg" },
    { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_1.jpg" },
    { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_2.jpg" },
    { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_8.jpg" },
    { type: "video", url: "/suhu/SUHU EYE KNITTED GOLFER_7.mp4" }
  ],
};

// Media Carousel Component for Modal
function MediaCarousel({ media, productName }: { media: Array<{type: string, url: string}>, productName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <Package size={48} className="text-gray-400" />
      </div>
    );
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const currentMedia = media[currentIndex];

  return (
    <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden group">
      {/* Media Display */}
      {currentMedia.type === "image" ? (
        <img
          src={currentMedia.url}
          alt={`${productName} - ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="relative w-full h-full">
          <video
            src={currentMedia.url}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black bg-opacity-30">
            <div className="bg-white bg-opacity-90 rounded-full p-3">
              <Play size={24} className="text-black" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Arrows (only show if more than 1 media) */}
      {media.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
            {media.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? "bg-white w-6" : "bg-white bg-opacity-50 w-2"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Media Counter & Type Badge */}
      <div className="absolute top-3 right-3 flex flex-col space-y-2">
        <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
          {currentIndex + 1} / {media.length}
        </div>
        {currentMedia.type === "video" && (
          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <VideoIcon size={12} className="mr-1" />
            Video
          </div>
        )}
      </div>
    </div>
  );
}

// Mock revenue data for the week
const mockRevenueData = [
  { day: "4 Mon", totalEarn: 2400, totalViews: 2600 },
  { day: "5 Tue", totalEarn: 1800, totalViews: 3600 },
  { day: "6 Wed", totalEarn: 3200, totalViews: 3100 },
  { day: "3 Sun", totalEarn: 3600, totalViews: 2900 },
  { day: "7 Thu", totalEarn: 2900, totalViews: 4800 },
  { day: "8 Fri", totalEarn: 3600, totalViews: 3500 },
  { day: "9 Sat", totalEarn: 4600, totalViews: 1800 },
];

// Mock order data
const mockOrders = [
  {
    id: "ORD-2024-001",
    orderNumber: "YV001",
    customer: {
      name: "Sarah Mitchell",
      email: "sarah.m@email.com",
      phone: "+27 82 123 4567",
    },
    product: {
      name: "The Bonang dress",
      image: "dress",
      quantity: 1,
      size: "Medium",
      color: "Xhosa Black"
    },
    amount: 1700,
    status: "shipped",
    paymentStatus: "paid",
    shippingAddress: "15 Long St, Cape Town, 8001",
    createdAt: "2024-01-15T14:30:00",
    timeline: [
      { status: "placed", label: "Order Placed", date: "2024-01-15T14:30:00", completed: true },
      { status: "paid", label: "Payment Confirmed", date: "2024-01-15T14:31:00", completed: true },
      { status: "confirmed", label: "Merchant Confirmed", date: "2024-01-15T15:00:00", completed: true },
      { status: "processing", label: "In Production", date: "2024-01-16T09:00:00", completed: true },
      { status: "shipped", label: "Shipped", date: "2024-01-17T10:00:00", completed: true },
      { status: "delivered", label: "Delivered", date: null, completed: false },
    ],
    trackingNumber: "TRK-ZA-2024-001567",
    tags: ["express", "new-customer"],
  },
  {
    id: "ORD-2024-002",
    orderNumber: "YV002",
    customer: {
      name: "Thandiwe Mthembu",
      email: "thandiwe@email.com",
      phone: "+27 83 456 7890",
    },
    product: {
      name: "Snatched Kimono Mosadi",
      image: "kimono",
      quantity: 1,
      size: "Large",
      color: "Black shweshe"
    },
    amount: 1400,
    status: "delivered",
    paymentStatus: "paid",
    shippingAddress: "23 Main Rd, Johannesburg, 2001",
    createdAt: "2024-01-14T10:20:00",
    timeline: [
      { status: "placed", label: "Order Placed", date: "2024-01-14T10:20:00", completed: true },
      { status: "paid", label: "Payment Confirmed", date: "2024-01-14T10:21:00", completed: true },
      { status: "confirmed", label: "Merchant Confirmed", date: "2024-01-14T11:00:00", completed: true },
      { status: "processing", label: "In Production", date: "2024-01-14T12:00:00", completed: true },
      { status: "shipped", label: "Shipped", date: "2024-01-15T09:00:00", completed: true },
      { status: "delivered", label: "Delivered", date: "2024-01-16T14:30:00", completed: true },
    ],
    trackingNumber: "TRK-ZA-2024-001445",
    tags: ["repeat-customer"],
  },
  {
    id: "ORD-2024-003",
    orderNumber: "YV003",
    customer: {
      name: "Michael Chen",
      email: "michael.c@email.com",
      phone: "+27 84 567 8901",
    },
    product: {
      name: "Suhu Eye Knitted Golfer",
      image: "golfer",
      quantity: 1,
      size: "Large",
      color: "Black"
    },
    amount: 1899,
    status: "shipped",
    paymentStatus: "paid",
    shippingAddress: "12 Beach Rd, Durban, 4001",
    createdAt: "2024-01-12T09:15:00",
    trackingNumber: "TRK-ZA-2024-001234",
    timeline: [
      { status: "placed", label: "Order Placed", date: "2024-01-12T09:15:00", completed: true },
      { status: "paid", label: "Payment Confirmed", date: "2024-01-12T09:16:00", completed: true },
      { status: "confirmed", label: "Merchant Confirmed", date: "2024-01-12T10:00:00", completed: true },
      { status: "processing", label: "In Production", date: "2024-01-12T14:00:00", completed: true },
      { status: "shipped", label: "Shipped", date: "2024-01-13T09:00:00", completed: true },
      { status: "delivered", label: "Delivered", date: null, completed: false },
    ],
    tags: ["express-shipping"],
  },
  {
    id: "ORD-2024-004",
    orderNumber: "YV004",
    customer: {
      name: "Zinhle Khumalo",
      email: "zinhle.k@email.com",
      phone: "+27 85 678 9012",
    },
    product: {
      name: "The Zola Kimono",
      image: "kimono",
      quantity: 1,
      size: "Medium",
      color: "Xhosa Cream White"
    },
    amount: 950,
    status: "delivered",
    paymentStatus: "paid",
    shippingAddress: "78 Nelson Mandela Rd, Pretoria, 0002",
    createdAt: "2024-01-10T11:30:00",
    trackingNumber: "TRK-ZA-2024-001122",
    timeline: [
      { status: "placed", label: "Order Placed", date: "2024-01-10T11:30:00", completed: true },
      { status: "paid", label: "Payment Confirmed", date: "2024-01-10T11:31:00", completed: true },
      { status: "confirmed", label: "Merchant Confirmed", date: "2024-01-10T12:00:00", completed: true },
      { status: "processing", label: "In Production", date: "2024-01-10T16:00:00", completed: true },
      { status: "shipped", label: "Shipped", date: "2024-01-11T09:00:00", completed: true },
      { status: "delivered", label: "Delivered", date: "2024-01-13T14:30:00", completed: true },
    ],
    tags: ["repeat-customer", "positive-review"],
  },
  {
    id: "ORD-2024-005",
    orderNumber: "YV005",
    customer: {
      name: "David van der Merwe",
      email: "david.v@email.com",
      phone: "+27 86 789 0123",
    },
    product: {
      name: "Suhu Logo SweatPant",
      image: "sweatpant",
      quantity: 2,
      size: "Large",
      color: "Black"
    },
    amount: 1798,
    status: "cancelled",
    paymentStatus: "refunded",
    shippingAddress: "45 Garden St, Stellenbosch, 7600",
    createdAt: "2024-01-11T14:20:00",
    cancellationReason: "Customer requested size change - reordered as new order",
    timeline: [
      { status: "placed", label: "Order Placed", date: "2024-01-11T14:20:00", completed: true },
      { status: "paid", label: "Payment Confirmed", date: "2024-01-11T14:21:00", completed: true },
      { status: "cancelled", label: "Order Cancelled", date: "2024-01-11T15:00:00", completed: true },
      { status: "refunded", label: "Refund Processed", date: "2024-01-11T15:30:00", completed: true },
    ],
    tags: ["cancellation", "size-issue"],
  },
];

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-800", icon: RefreshCw },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
};

const paymentStatusConfig = {
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800" },
};

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingOrder, setViewingOrder] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const filteredOrders = mockOrders.filter((order) => {
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    const matchesPaymentStatus = selectedPaymentStatus === "all" || order.paymentStatus === selectedPaymentStatus;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPaymentStatus && matchesSearch;
  });

  const orderDetail = mockOrders.find((o) => o.id === viewingOrder);

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Orders</h1>
          <p className="text-gray-600">Manage and fulfill customer orders</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 text-black border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center transition-colors">
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Revenue Chart and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Revenue Chart - Left Side */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 overflow-hidden">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-black mb-1">Revenue</h2>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></div>
                <span className="text-gray-600">Total Earn</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5"></div>
                <span className="text-gray-600">Total Views</span>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-2xl font-bold text-black">R24,810.00</p>
            <p className="text-xs text-green-600 font-medium">+8.26%</p>
          </div>

          {/* Chart */}
          <div className="relative h-40">
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-500">
              <span>6k</span>
              <span>4k</span>
              <span>2k</span>
              <span>0k</span>
            </div>

            <div className="ml-6 h-full relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border-t border-gray-100"></div>
                ))}
              </div>

              {/* Line Chart */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Total Earn Line (Green) - Connected path */}
                <path
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  d={mockRevenueData.map((d, i) => {
                    const x = (i / (mockRevenueData.length - 1)) * 100;
                    const y = 100 - (d.totalEarn / 6000) * 100;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                />

                {/* Total Views Line (Orange) - Connected path */}
                <path
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  d={mockRevenueData.map((d, i) => {
                    const x = (i / (mockRevenueData.length - 1)) * 100;
                    const y = 100 - (d.totalViews / 6000) * 100;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                />
              </svg>

              {/* Data points overlay - separate SVG for proper sizing */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Data points for Total Earn */}
                {mockRevenueData.map((d, i) => {
                  const x = (i / (mockRevenueData.length - 1)) * 100;
                  const y = 100 - (d.totalEarn / 6000) * 100;
                  return (
                    <circle
                      key={`earn-${i}`}
                      cx={x}
                      cy={y}
                      r="1"
                      fill="#22c55e"
                    />
                  );
                })}

                {/* Data points for Total Views */}
                {mockRevenueData.map((d, i) => {
                  const x = (i / (mockRevenueData.length - 1)) * 100;
                  const y = 100 - (d.totalViews / 6000) * 100;
                  return (
                    <circle
                      key={`views-${i}`}
                      cx={x}
                      cy={y}
                      r="1"
                      fill="#f97316"
                    />
                  );
                })}
              </svg>

              {/* X-axis labels */}
              <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[10px] text-gray-500">
                {mockRevenueData.map((d, i) => (
                  <span key={i}>{d.day}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards - Right Side - 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sales Today - Orange Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium opacity-90">Sales Today</h3>
              <div className="p-1.5 bg-white bg-opacity-20 rounded-lg">
                <ShoppingCart size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">R4,250</p>
            <p className="text-[10px] opacity-75">*Updated every order success</p>
          </div>

          {/* Total Earning */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-600">Total Earning</h3>
              <div className="p-1.5 bg-green-100 rounded-lg">
                <DollarSign size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-black mb-1">R81,020</p>
            <p className="text-[10px] text-green-600 font-medium">+8.26% More earning than usual</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-600">Total Orders</h3>
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Package size={16} className="text-gray-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-black mb-1">102</p>
            <p className="text-[10px] text-gray-600">+2.18% More orders than usual</p>
          </div>

          {/* Visitor Today */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-600">Visitor Today</h3>
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Users size={16} className="text-gray-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-black mb-1">1,247</p>
            <p className="text-[10px] text-gray-600">+3.06% More visitors than usual</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 w-full overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search by order number, customer name, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-800 font-medium">
              {selectedOrders.length} order(s) selected
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                Mark as Fulfilled
              </button>
              <button className="px-3 py-1.5 bg-white text-blue-600 text-sm border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                Process Refund
              </button>
              <button className="px-3 py-1.5 bg-white text-gray-700 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Export Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length}
                    onChange={toggleAllOrders}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon;
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <User size={16} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-black">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg mr-3 overflow-hidden flex-shrink-0">
                          {productMediaMap[order.product.name] && productMediaMap[order.product.name][0] ? (
                            <img
                              src={productMediaMap[order.product.name][0].url}
                              alt={order.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Package size={16} className="text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-black">{order.product.name}</div>
                          <div className="text-sm text-gray-500">Qty: {order.product.quantity}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      R{order.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusConfig[order.status as keyof typeof statusConfig].color
                        }`}
                      >
                        <StatusIcon size={12} className="mr-1" />
                        {statusConfig[order.status as keyof typeof statusConfig].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig].color
                        }`}
                      >
                        {paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => setViewingOrder(order.id)}
                        className="text-black hover:text-gray-600"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-black">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={32} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-black mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedStatus !== "all" || selectedPaymentStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Orders will appear here once customers start purchasing"}
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {orderDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-black">Order Details</h2>
                <p className="text-sm text-gray-600">{orderDetail.orderNumber}</p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-gray-400 hover:text-black"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status and Payment */}
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      statusConfig[orderDetail.status as keyof typeof statusConfig].color
                    }`}
                  >
                    {statusConfig[orderDetail.status as keyof typeof statusConfig].label}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ml-2 ${
                      paymentStatusConfig[orderDetail.paymentStatus as keyof typeof paymentStatusConfig].color
                    }`}
                  >
                    {paymentStatusConfig[orderDetail.paymentStatus as keyof typeof paymentStatusConfig].label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-black">
                  R{orderDetail.amount.toLocaleString()}
                </div>
              </div>

              {/* Product Details with Media Carousel */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                  <Package size={20} className="mr-2" />
                  Product Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Media Carousel */}
                  <div>
                    <MediaCarousel
                      media={productMediaMap[orderDetail.product.name] || []}
                      productName={orderDetail.product.name}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-lg text-black mb-2">{orderDetail.product.name}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-black">{orderDetail.product.quantity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium text-black">{orderDetail.product.size}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium text-black">{orderDetail.product.color}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold text-lg text-black">R{orderDetail.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Media count */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <ImageIcon size={16} className="text-gray-600 mr-2" />
                          <span className="text-gray-600">Media Files:</span>
                        </div>
                        <span className="font-medium text-black">
                          {productMediaMap[orderDetail.product.name]?.length || 0} items
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                  <Clock size={20} className="mr-2" />
                  Order Timeline
                </h3>
                <div className="space-y-4">
                  {orderDetail.timeline.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex flex-col items-center mr-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.completed ? "bg-black" : "bg-gray-300"
                          }`}
                        >
                          {item.completed ? (
                            <CheckCircle size={16} className="text-white" />
                          ) : (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        {index < orderDetail.timeline.length - 1 && (
                          <div
                            className={`w-0.5 h-12 ${
                              item.completed ? "bg-black" : "bg-gray-300"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p
                          className={`font-medium ${
                            item.completed ? "text-black" : "text-gray-500"
                          }`}
                        >
                          {item.label}
                        </p>
                        {item.date && (
                          <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Information */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                  <User size={20} className="mr-2" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="text-sm font-medium text-black">{orderDetail.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm font-medium text-black">{orderDetail.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-sm font-medium text-black">{orderDetail.customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin size={14} className="mr-1" />
                      Shipping Address
                    </p>
                    <p className="text-sm font-medium text-black">{orderDetail.shippingAddress}</p>
                  </div>
                </div>
              </div>

              {/* Tracking Number */}
              {orderDetail.trackingNumber && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Tracking Number</p>
                      <p className="text-lg font-mono text-blue-900">{orderDetail.trackingNumber}</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                      Track Package
                    </button>
                  </div>
                </div>
              )}

              {/* Cancellation Reason */}
              {orderDetail.cancellationReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium mb-1">Cancellation Reason</p>
                  <p className="text-sm text-red-900">{orderDetail.cancellationReason}</p>
                </div>
              )}

              {/* Tags */}
              {orderDetail.tags && orderDetail.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {orderDetail.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium">
                  Update Status
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                  Print Invoice
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                  Contact Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
