"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Package,
  CheckCircle,
  Edit,
  MoreHorizontal,
  Shirt,
  Image as ImageIcon,
  Video,
  ChevronLeft,
  ChevronRight,
  Play
} from "lucide-react";

// Real products data from CSV
const allProducts = [
  // Tol'thema Products
  {
    id: "cmg0mhil20003w4k8dsiaxkgv",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "The Khosi shirt",
    price: 950,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "The Union",
    clothingType: "Tops",
    genderType: "men",
    smartCategories: ["Traditional", "SummerVibes", "Wedding"],
    media: [
      { type: "image", url: "/tol_thema/The Khosi Shirt.png" },
      { type: "image", url: "/tol_thema/The Khosi Shirt 2.png" }
    ],
    description: "Tops from The Union collection. Style: Traditional, SummerVibes, Wedding",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhil30005w4k8i3vjs1j2",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "The Zola Kimono - Xhosa Cream White",
    price: 950,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "The Union",
    clothingType: "Tops",
    genderType: "men",
    smartCategories: ["Wedding", "SummerVibes", "Traditional"],
    media: [
      { type: "image", url: "/tol_thema/The Zola Kimono_2.png" }
    ],
    description: "Tops from The Union collection. Style: Wedding, SummerVibes, Traditional",
    inventoryType: "limited_stock",
    stockQuantity: 5,
    status: "active"
  },
  {
    id: "cmg0mhil40007w4k83v3eptky",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "The Zola kimono - Black With Venda",
    price: 950,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "The Union",
    clothingType: "Tops",
    genderType: "men",
    smartCategories: ["SummerVibes", "Traditional", "Wedding"],
    media: [
      { type: "image", url: "/tol_thema/The Zola Kimono_1.png" }
    ],
    description: "Tops from The Union collection. Style: SummerVibes, Traditional, Wedding",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhil50009w4k8qqm1bazq",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "Snatched Kimono Mosadi - Sage green shweshwe",
    price: 1400,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Mosadi Kimono",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["Traditional", "SummerVibes", "Wedding"],
    media: [
      { type: "image", url: "/tol_thema/Kimono Mosadi Snatched_2.png" }
    ],
    description: "Dresses from Mosadi Kimono collection. Style: Traditional, SummerVibes, Wedding",
    inventoryType: "limited_stock",
    stockQuantity: 23,
    status: "active"
  },
  {
    id: "cmg0mhil6000bw4k8i1vsh50s",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "Snatched Kimono Mosadi - Maroon shweshwe",
    price: 1400,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Mosadi Kimono",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["SummerVibes", "Traditional", "kimono"],
    media: [
      { type: "image", url: "/tol_thema/Kimono Mosadi Snatched_3.png" }
    ],
    description: "Dresses from Mosadi Kimono collection. Style: SummerVibes, Traditional, kimono",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhil7000dw4k8bhexi3vf",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "Snatched Kimono Mosadi - Black shweshe",
    price: 1400,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Mosadi Kimono",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["Wedding", "SummerVibes", "Traditional"],
    media: [
      { type: "image", url: "/tol_thema/Kimono Mosadi Snatched_2.png" },
      { type: "image", url: "/tol_thema/Kimono Mosadi Snatched_3.png" },
      { type: "image", url: "/tol_thema/Kimono Mosadi Snatched_4.png" },
      { type: "video", url: "/tol_thema/Kimono Mosadi Snatched_1.mp4" },
      { type: "video", url: "/tol_thema/Kimono Mosadi Snatched_5.mp4" }
    ],
    description: "Dresses from Mosadi Kimono collection. Style: Wedding, SummerVibes, Traditional",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhil7000fw4k8jua5b1l0",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "The Bonang Dress - Xhosa Black",
    price: 1700,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Makoti's Collection",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["Wedding", "SummerVibes", "Traditional"],
    media: [
      { type: "image", url: "/tol_thema/The Bonang dress_1.png" }
    ],
    description: "Dresses from Makoti's Collection collection. Style: Wedding, SummerVibes, Traditional",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhil8000hw4k86fe70pih",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "The Bonang Dress - Venda Orange",
    price: 1700,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Makoti's Collection",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["SummerVibes", "Traditional", "Wedding"],
    media: [
      { type: "image", url: "/tol_thema/The Bonang dress_2.png" }
    ],
    description: "Dresses from Makoti's Collection collection. Style: SummerVibes, Traditional, Wedding",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhil9000jw4k8z12ynnc2",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "Plain round neck Lindy - Ginger",
    price: 1200,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Lindy Summer Collection",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["SummerVibes", "Traditional", "Outware"],
    media: [
      { type: "image", url: "/tol_thema/Lindy_2.png" },
      { type: "video", url: "/tol_thema/Lindy_1.mp4" }
    ],
    description: "Dresses from Lindy Summer Collection collection. Style: SummerVibes, Traditional, Outware",
    inventoryType: "limited_stock",
    stockQuantity: 7,
    status: "active"
  },
  {
    id: "cmg0mhil9000lw4k85t41jvrf",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "Nontsikelelo Boubou - Xhosa",
    price: 1250,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Nontsikelelo Boubou",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["SummerVibes", "Outwear", "Traditional"],
    media: [
      { type: "image", url: "/tol_thema/Nontsikelelo boubou_1.png" }
    ],
    description: "Dresses from Nontsikelelo Boubou collection. Style: SummerVibes, Outwear, Traditional",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhila000nw4k83rynxysa",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "Nkosazana boubou",
    price: 1100,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Boubou",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["SummerVibes", "Traditional", "Outwear"],
    media: [
      { type: "image", url: "/tol_thema/Nontsikelelo boubou_1.png" },
      { type: "video", url: "/tol_thema/Nontsikelelo boubou_2.mp4" },
      { type: "video", url: "/tol_thema/Nontsikelelo boubou_3.mp4" }
    ],
    description: "Dresses from Boubou collection. Style: SummerVibes, Traditional, Outwear",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhilb000pw4k84f6qgum8",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "Kgoshigadi - Pedi Boubou",
    price: 1250,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Boubou",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["SummerVibes", "Traditional", "Outwear"],
    media: [
      { type: "image", url: "/tol_thema/Nontsikelelo boubou_1.png" },
      { type: "video", url: "/tol_thema/Nontsikelelo boubou_2.mp4" },
      { type: "video", url: "/tol_thema/Nontsikelelo boubou_3.mp4" }
    ],
    description: "Dresses from Boubou collection. Style: SummerVibes, Traditional, Outwear",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhilc000rw4k8ww5ixagf",
    merchantId: "cmg0mhiky0000w4k8h8qwx34c",
    merchantUsername: "tol_thema",
    name: "The Lufuno set",
    price: 1400,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "The Union",
    clothingType: "Dresses",
    genderType: "women",
    smartCategories: ["Wedding", "Traditional", "Summer"],
    media: [
      { type: "image", url: "/tol_thema/The Lufuno set_1.png" },
      { type: "image", url: "/tol_thema/The Lufuno set_2.png" },
      { type: "video", url: "/tol_thema/The Lufuno set_3.mp4" }
    ],
    description: "Dresses from The Union collection. Style: Wedding, Traditional, Summer",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  // SUHU Products
  {
    id: "cmg0mhilc000tw4k88x4y6b68",
    merchantId: "cmg0mhil00001w4k8qnmi1fu9",
    merchantUsername: "suhu",
    name: "Suhu Eye Knitted Golfer",
    price: 1899,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "T-Shirts",
    clothingType: "Tops",
    genderType: "unisex",
    smartCategories: ["Casual", "Formal", "SummerVibes"],
    media: [
      { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_4.jpg" },
      { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_5.jpg" },
      { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_6.jpg" },
      { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_3.jpg" },
      { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_1.jpg" },
      { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_2.jpg" },
      { type: "image", url: "/suhu/SUHU EYE KNITTED GOLFER_8.jpg" },
      { type: "video", url: "/suhu/SUHU EYE KNITTED GOLFER_7.mp4" }
    ],
    description: "Tops from T-Shirts collection. Style: Casual, Formal, SummerVibes",
    inventoryType: "limited_stock",
    stockQuantity: 5,
    status: "active"
  },
  {
    id: "cmg0mhild000vw4k88oxlfctg",
    merchantId: "cmg0mhil00001w4k8qnmi1fu9",
    merchantUsername: "suhu",
    name: "A Village Story T-shirt White",
    price: 799,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "T-shirt",
    clothingType: "Tops",
    genderType: "men",
    smartCategories: ["Casual", "SummerVibes", "Streetwear"],
    media: [
      { type: "image", url: "/suhu/A VILLAGE STORY T-SHIRT WHITE_3.png" },
      { type: "image", url: "/suhu/A VILLAGE STORY T-SHIRT WHITE_2.jpg" },
      { type: "image", url: "/suhu/A VILLAGE STORY T-SHIRT WHITE_1.jpg" }
    ],
    description: "Tops from T-shirt collection. Style: Casual, SummerVibes, Streetwear",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  },
  {
    id: "cmg0mhild000xw4k8vizp2ox3",
    merchantId: "cmg0mhil00001w4k8qnmi1fu9",
    merchantUsername: "suhu",
    name: "Suhu Logo SweatPant, Black",
    price: 899,
    currency: "ZAR",
    sizes: ["XS", "Small", "Medium", "Large", "Xlarge", "2Xlarge"],
    category: "Sweatpant",
    clothingType: "Pants",
    genderType: "men",
    smartCategories: ["Casual", "Streetwear", "SummerVibes"],
    media: [
      { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_3.jpg" },
      { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_2.png" },
      { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_4.jpg" },
      { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_5.jpg" },
      { type: "image", url: "/suhu/SUHU LOGO SWEATPANT BLACK_7.jpg" }
    ],
    description: "Pants from Sweatpant collection. Style: Casual, Streetwear, SummerVibes",
    inventoryType: "made_to_order",
    leadTime: "1-3 weeks",
    status: "active"
  }
];

const categories = [
  "All Categories",
  "The Union",
  "Mosadi Kimono",
  "Makoti's Collection",
  "Lindy Summer Collection",
  "Boubou",
  "Nontsikelelo Boubou",
  "T-Shirts",
  "T-shirt",
  "Sweatpant"
];

const clothingTypes = [
  "All Types",
  "Tops",
  "Dresses",
  "Pants"
];

// Media Carousel Component
function MediaCarousel({ media, productName }: { media: Array<{type: string, url: string}>, productName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const currentMedia = media[currentIndex];

  return (
    <div className="relative aspect-square bg-gray-100 group">
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black bg-opacity-50 rounded-full p-4">
              <Play size={32} className="text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Arrows (only show if more than 1 media) */}
      {media.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              goToPrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              goToNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
            {media.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? "bg-white w-4" : "bg-white bg-opacity-50"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Media Counter */}
      <div className="absolute top-3 right-3 flex space-x-2">
        <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center">
          {currentIndex + 1} / {media.length}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedClothingType, setSelectedClothingType] = useState("All Types");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const filteredProducts = allProducts
    .filter(product => {
      const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
      const matchesClothingType = selectedClothingType === "All Types" || product.clothingType === selectedClothingType;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.smartCategories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesClothingType && matchesSearch;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        case "merchant":
          return a.merchantUsername.localeCompare(b.merchantUsername);
        default:
          return 0;
      }
    });

  const getInventoryLabel = (product: typeof allProducts[0]) => {
    if (product.inventoryType === "made_to_order") {
      return `Made to Order (${product.leadTime})`;
    } else if (product.inventoryType === "limited_stock") {
      return `${product.stockQuantity} in stock`;
    }
    return "Available";
  };

  const getInventoryColor = (product: typeof allProducts[0]) => {
    if (product.inventoryType === "made_to_order") {
      return "bg-blue-100 text-blue-800";
    } else if (product.inventoryType === "limited_stock") {
      if (product.stockQuantity && product.stockQuantity < 10) {
        return "bg-orange-100 text-orange-800";
      }
      return "bg-green-100 text-green-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  // Count products by merchant
  const tolthemaCount = allProducts.filter(p => p.merchantUsername === "tol_thema").length;
  const suhuCount = allProducts.filter(p => p.merchantUsername === "suhu").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Products</h1>
          <p className="text-gray-600">Manage your fashion catalog</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/products/new"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium flex items-center transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search products, tags, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          <div className="flex space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={selectedClothingType}
              onChange={(e) => setSelectedClothingType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            >
              {clothingTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="merchant">Sort by Merchant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-black">{allProducts.length}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Package size={20} className="text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-black">
                {allProducts.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle size={20} className="text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tol'thema Products</p>
              <p className="text-2xl font-bold text-black">{tolthemaCount}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Package size={20} className="text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SUHU Products</p>
              <p className="text-2xl font-bold text-black">{suhuCount}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Package size={20} className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Product Media Carousel */}
            <MediaCarousel media={product.media} productName={product.name} />

            {/* Merchant badge */}
            <div className="absolute bottom-3 left-3">
              <span className="bg-white bg-opacity-90 text-black px-2 py-1 rounded-full text-xs font-medium">
                {product.merchantUsername === "tol_thema" ? "Tol'thema" : "SUHU"}
              </span>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-black mb-1 line-clamp-2">
                {product.name}
              </h3>

              <div className="flex items-center justify-between mb-2">
                <p className="text-2xl font-bold text-black">
                  R{product.price.toLocaleString()}
                </p>
                <span className="text-xs text-gray-500 uppercase">
                  {product.genderType}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-1">
                  {product.category} • {product.clothingType}
                </p>
                <p className="text-xs text-gray-500">
                  {product.sizes.length} sizes available
                </p>
              </div>

              {/* Inventory Status */}
              <div className="mb-3">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getInventoryColor(product)}`}>
                  {getInventoryLabel(product)}
                </span>
              </div>

              {/* Smart Categories */}
              <div className="flex flex-wrap gap-1 mb-3">
                {product.smartCategories.slice(0, 3).map((cat, idx) => (
                  <span key={idx} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                    {cat}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="flex-1 px-3 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Link>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-black mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== "All Categories"
              ? "Try adjusting your search or filters"
              : "Get started by adding your first product"}
          </p>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            <Plus size={16} className="mr-2" />
            Add Product
          </Link>
        </div>
      )}
    </div>
  );
}
