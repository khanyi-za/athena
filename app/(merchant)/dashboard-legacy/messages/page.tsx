"use client";

import { useState } from "react";
import {
  Mail,
  MailOpen,
  Search,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  MoreHorizontal,
  Send,
  Paperclip,
  X,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Tag,
  Filter,
  Inbox,
  MessageSquare,
  ShoppingCart,
  Package,
} from "lucide-react";

// Mock message data
const mockMessages = [
  {
    id: "msg-001",
    customer: {
      name: "Sarah Mitchell",
      email: "sarah.m@email.com",
      avatar: null,
    },
    subject: "Question about The Bonang dress sizing",
    preview: "Hi! I'm interested in ordering The Bonang dress but I'm not sure about the sizing. I usually wear a size M...",
    body: "Hi! I'm interested in ordering The Bonang dress but I'm not sure about the sizing. I usually wear a size M in most brands. Could you help me understand how your sizing works? Also, is there any stretch to the fabric? Thank you!",
    timestamp: "2024-01-15T14:30:00",
    read: false,
    starred: false,
    category: "product-inquiry",
    orderNumber: null,
    tags: ["urgent", "pre-purchase"],
    replies: [],
  },
  {
    id: "msg-002",
    customer: {
      name: "Thandiwe Mthembu",
      email: "thandiwe@email.com",
      avatar: null,
    },
    subject: "Order YV002 - When will it ship?",
    preview: "Hello, I placed an order for the Handmade Beaded Necklace last week (Order #YV002) and I was wondering when...",
    body: "Hello, I placed an order for the Handmade Beaded Necklace last week (Order #YV002) and I was wondering when it will be shipped? I need it for a special event on the 20th. Please let me know if that's possible. Thank you!",
    timestamp: "2024-01-14T10:20:00",
    read: true,
    starred: true,
    category: "order-inquiry",
    orderNumber: "YV002",
    tags: ["order-related", "time-sensitive"],
    replies: [
      {
        id: "reply-001",
        from: "merchant",
        message: "Hi Thandiwe! Your order is currently in production and will be shipped by the 17th. You should receive it well before the 20th. I'll send you tracking details once it ships!",
        timestamp: "2024-01-14T11:00:00",
      },
    ],
  },
  {
    id: "msg-003",
    customer: {
      name: "Michael Chen",
      email: "michael.c@email.com",
      avatar: null,
    },
    subject: "Custom order request - Vintage Jacket in different color",
    preview: "I recently purchased a Vintage Leather Jacket from you and absolutely love it! I was wondering if you could...",
    body: "I recently purchased a Vintage Leather Jacket from you and absolutely love it! I was wondering if you could make a similar one in brown instead of black? I'd be happy to pay extra for a custom order. Let me know if this is something you can do. Thanks!",
    timestamp: "2024-01-13T16:45:00",
    read: true,
    starred: false,
    category: "custom-request",
    orderNumber: "YV003",
    tags: ["custom-order", "repeat-customer"],
    replies: [
      {
        id: "reply-002",
        from: "merchant",
        message: "Hi Michael! Thank you so much for your kind words. I'd be happy to make a custom brown leather jacket for you. The price would be R950 and it would take about 2-3 weeks. Would that work for you?",
        timestamp: "2024-01-13T17:30:00",
      },
      {
        id: "reply-003",
        from: "customer",
        message: "Perfect! That timeline works for me. How do I proceed with the order?",
        timestamp: "2024-01-13T18:00:00",
      },
    ],
  },
  {
    id: "msg-004",
    customer: {
      name: "Zinhle Khumalo",
      email: "zinhle.k@email.com",
      avatar: null,
    },
    subject: "Thank you! Product review for Order YV004",
    preview: "I just wanted to say thank you for The Zola Kimono! It arrived perfectly and the quality is amazing. I'll definitely...",
    body: "I just wanted to say thank you for The Zola Kimono! It arrived perfectly and the quality is amazing. I'll definitely be ordering from you again. I've already recommended you to my friends. Keep up the great work! ⭐⭐⭐⭐⭐",
    timestamp: "2024-01-12T09:15:00",
    read: true,
    starred: true,
    category: "review",
    orderNumber: "YV004",
    tags: ["positive-review", "repeat-customer"],
    replies: [
      {
        id: "reply-004",
        from: "merchant",
        message: "Thank you so much Zinhle! This made my day! I'm so happy you love the kimono. Looking forward to creating more pieces for you! 💜",
        timestamp: "2024-01-12T10:00:00",
      },
    ],
  },
  {
    id: "msg-005",
    customer: {
      name: "David van der Merwe",
      email: "david.v@email.com",
      avatar: null,
    },
    subject: "Order YV005 cancellation request",
    preview: "Hi, I need to cancel my order for the Suhu Logo SweatPant (Order #YV005). I realized I ordered the wrong size...",
    body: "Hi, I need to cancel my order for the Suhu Logo SweatPant (Order #YV005). I realized I ordered the wrong size. Can I cancel and reorder in the correct size? Sorry for the inconvenience!",
    timestamp: "2024-01-11T14:20:00",
    read: true,
    starred: false,
    category: "cancellation",
    orderNumber: "YV005",
    tags: ["cancellation", "size-issue"],
    replies: [
      {
        id: "reply-005",
        from: "merchant",
        message: "No problem at all! I've cancelled your order and processed the refund. What size would you like? I can create a new order for you right away.",
        timestamp: "2024-01-11T15:00:00",
      },
      {
        id: "reply-006",
        from: "customer",
        message: "Thank you! I need size L instead of M. Should I place a new order through the website?",
        timestamp: "2024-01-11T15:30:00",
      },
    ],
  },
  {
    id: "msg-006",
    customer: {
      name: "Lerato Ndlovu",
      email: "lerato.n@email.com",
      avatar: null,
    },
    subject: "Wholesale inquiry - Bulk order possibility?",
    preview: "Hi! I run a boutique in Sandton and I'm interested in stocking some of your pieces. Do you offer wholesale pricing...",
    body: "Hi! I run a boutique in Sandton and I'm interested in stocking some of your pieces. Do you offer wholesale pricing for bulk orders? I'm particularly interested in your dress collection. Would love to discuss this further. Thank you!",
    timestamp: "2024-01-10T11:30:00",
    read: false,
    starred: false,
    category: "wholesale",
    orderNumber: null,
    tags: ["wholesale", "business-opportunity"],
    replies: [],
  },
  {
    id: "msg-007",
    customer: {
      name: "Sipho Mkhize",
      email: "sipho.m@email.com",
      avatar: null,
    },
    subject: "Shipping to Durban - delivery time?",
    preview: "Good day! I'm interested in ordering but I'm based in Durban. How long does shipping usually take to KZN?",
    body: "Good day! I'm interested in ordering but I'm based in Durban. How long does shipping usually take to KZN? Also, what are the shipping costs? Looking forward to your response!",
    timestamp: "2024-01-10T08:45:00",
    read: false,
    starred: false,
    category: "shipping-inquiry",
    orderNumber: null,
    tags: ["pre-purchase", "shipping"],
    replies: [],
  },
  {
    id: "msg-008",
    customer: {
      name: "Nomsa Dlamini",
      email: "nomsa.d@email.com",
      avatar: null,
    },
    subject: "Payment issue - Order not processing",
    preview: "I'm trying to place an order but the payment keeps failing. I've tried two different cards. Can you help?",
    body: "I'm trying to place an order but the payment keeps failing. I've tried two different cards and I'm sure there are funds available. Can you help me figure out what's going wrong? I really want to buy The Bonang dress!",
    timestamp: "2024-01-09T16:20:00",
    read: true,
    starred: false,
    category: "technical-issue",
    orderNumber: null,
    tags: ["urgent", "payment-issue"],
    replies: [
      {
        id: "reply-007",
        from: "merchant",
        message: "Hi Nomsa! I'm sorry you're experiencing this issue. This is likely a technical problem on the payment gateway side. Let me contact support and I'll get back to you within an hour. In the meantime, you can try again or I can create a manual invoice for you.",
        timestamp: "2024-01-09T17:00:00",
      },
    ],
  },
];

const categories = [
  { id: "all", label: "All Messages", icon: Inbox, count: mockMessages.length },
  { id: "unread", label: "Unread", icon: Mail, count: mockMessages.filter((m) => !m.read).length },
  { id: "read", label: "Read", icon: MailOpen, count: mockMessages.filter((m) => m.read).length },
  { id: "starred", label: "Starred", icon: Star, count: mockMessages.filter((m) => m.starred).length },
  {
    id: "product-inquiry",
    label: "Product Questions",
    icon: MessageSquare,
    count: mockMessages.filter((m) => m.category === "product-inquiry").length,
  },
  {
    id: "order-inquiry",
    label: "Order Questions",
    icon: ShoppingCart,
    count: mockMessages.filter((m) => m.category === "order-inquiry").length,
  },
  {
    id: "custom-request",
    label: "Custom Requests",
    icon: Package,
    count: mockMessages.filter((m) => m.category === "custom-request").length,
  },
  {
    id: "review",
    label: "Reviews & Feedback",
    icon: Star,
    count: mockMessages.filter((m) => m.category === "review").length,
  },
];

export default function MessagesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);

  // Filter messages
  const filteredMessages = mockMessages.filter((message) => {
    const matchesSearch =
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.preview.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesCategory = true;
    if (selectedCategory === "unread") matchesCategory = !message.read;
    else if (selectedCategory === "read") matchesCategory = message.read;
    else if (selectedCategory === "starred") matchesCategory = message.starred;
    else if (selectedCategory !== "all") matchesCategory = message.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get selected message details
  const messageDetail = mockMessages.find((m) => m.id === selectedMessage);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
    }
  };

  // Toggle message selection
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
    );
  };

  // Toggle starred status
  const toggleStarred = (messageId: string) => {
    // In real app, this would call API
    console.log("Toggle starred:", messageId);
  };

  // Mark as read
  const markAsRead = (messageId: string) => {
    // In real app, this would call API
    console.log("Mark as read:", messageId);
  };

  // Send reply
  const handleSendReply = () => {
    if (!replyText.trim()) return;
    console.log("Sending reply:", replyText);
    setReplyText("");
  };

  // Get category icon and count
  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || categories[0];
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Messages</h1>
          <p className="text-gray-600">Communicate with your customers</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 text-black border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center transition-colors">
            <Filter size={16} className="mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden w-full">
        {/* Sidebar - Categories */}
        <div className="lg:w-64 w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-y-auto flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <div className="flex items-center">
                    <Icon size={16} className="mr-2" />
                    <span>{category.label}</span>
                  </div>
                  {category.count > 0 && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        isActive ? "bg-white text-black" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {category.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Rate</span>
                <span className="text-sm font-semibold text-green-600">98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-semibold text-black">2.5 hrs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="text-sm font-semibold text-black">12 messages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden min-w-0">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            {/* Bulk Actions */}
            {selectedMessages.length > 0 && (
              <div className="mt-3 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm text-blue-800 font-medium">
                  {selectedMessages.length} message(s) selected
                </span>
                <div className="flex space-x-2">
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Mark as Read
                  </button>
                  <button className="px-3 py-1.5 bg-white text-gray-700 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Archive
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Mail size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search"
                    : "Messages from customers will appear here"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message.id);
                      if (!message.read) markAsRead(message.id);
                    }}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !message.read ? "bg-blue-50" : ""
                    } ${selectedMessage === message.id ? "bg-gray-100" : ""}`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedMessages.includes(message.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleMessageSelection(message.id);
                        }}
                        className="mt-1 rounded border-gray-300 text-black focus:ring-black"
                      />

                      {/* Avatar */}
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-gray-600" />
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4
                            className={`text-sm ${
                              !message.read ? "font-bold text-black" : "font-medium text-gray-900"
                            }`}
                          >
                            {message.customer.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(message.timestamp)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStarred(message.id);
                              }}
                              className="text-gray-400 hover:text-yellow-500"
                            >
                              <Star
                                size={16}
                                className={message.starred ? "fill-yellow-500 text-yellow-500" : ""}
                              />
                            </button>
                          </div>
                        </div>
                        <p
                          className={`text-sm mb-1 ${
                            !message.read ? "font-semibold text-black" : "text-gray-900"
                          }`}
                        >
                          {message.subject}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{message.preview}</p>

                        {/* Tags */}
                        {message.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Order Number Badge */}
                        {message.orderNumber && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              <ShoppingCart size={12} className="mr-1" />
                              Order {message.orderNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail Panel */}
        {messageDetail ? (
          <div className="lg:w-96 w-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-black">
                      {messageDetail.customer.name}
                    </h3>
                    <p className="text-sm text-gray-600">{messageDetail.customer.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <button className="flex-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium flex items-center justify-center">
                  <Reply size={16} className="mr-1" />
                  Reply
                </button>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  <Forward size={16} />
                </button>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  <Archive size={16} />
                </button>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Original Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">
                    {new Date(messageDetail.timestamp).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {messageDetail.orderNumber && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      <ShoppingCart size={12} className="mr-1" />
                      {messageDetail.orderNumber}
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-black mb-2">{messageDetail.subject}</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{messageDetail.body}</p>

                {/* Tags */}
                {messageDetail.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                    {messageDetail.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-white border border-gray-300 text-gray-700 text-xs rounded-full"
                      >
                        <Tag size={10} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Replies Thread */}
              {messageDetail.replies.map((reply, index) => (
                <div
                  key={reply.id}
                  className={`rounded-lg p-4 ${
                    reply.from === "merchant"
                      ? "bg-black text-white ml-4"
                      : "bg-gray-50 text-gray-900 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium">
                      {reply.from === "merchant" ? "You" : messageDetail.customer.name}
                    </p>
                    <p
                      className={`text-xs ${
                        reply.from === "merchant" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {new Date(reply.timestamp).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-gray-200">
              <div className="mb-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black resize-none text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <button className="text-gray-600 hover:text-black">
                  <Paperclip size={20} />
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm flex items-center"
                >
                  <Send size={16} className="mr-2" />
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:w-96 w-full bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center flex-shrink-0">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No message selected</h3>
              <p className="text-gray-500 text-sm">
                Select a message from the list to view and reply
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
