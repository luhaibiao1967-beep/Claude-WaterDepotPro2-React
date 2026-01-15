// App.js - Bottom Navigation System
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Package,
  Truck,
  DollarSign,
  Users,
  Building,
  FileText,
  Map,
  BarChart,
} from "lucide-react";

// Import modules
import SalesOrderPage from "./components/sales/OrderPage";
import SalesDeliveryPage from "./components/sales/DeliveryPage";
import SalesPaymentPage from "./components/sales/PaymentPage";
import SalesCustomerPage from "./components/sales/CustomerPage";

import OperatorTripsPage from "./components/operator/TripsPage";
import OperatorOrdersPage from "./components/operator/OrdersPage";

import FinancePaymentsPage from "./components/finance/PaymentsPage";
import FinanceReportsPage from "./components/finance/ReportsPage";
import FinanceOrdersPage from "./components/finance/OrdersPage";

import AdminBranchesPage from "./components/admin/BranchesPage";
import AdminProductsPage from "./components/admin/ProductsPage";
import AdminUsersPage from "./components/admin/UsersPage";
import AdminReportsPage from "./components/admin/ReportsPage";

export default function WaterDepotApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("");

  // Data states
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // Check for existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set default page when user logs in
  useEffect(() => {
    if (currentUser && !activePage) {
      const defaultPages = {
        sales: "orders",
        operator: "trips",
        finance: "payments",
        admin: "branches",
      };
      setActivePage(defaultPages[currentUser.role] || "orders");
    }
  }, [currentUser]);

  const loadUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setCurrentUser(data);
      loadAllData(data.branch);
    }
  };

  const loadAllData = async (userBranch) => {
    loadBranches();
    loadProducts();
    loadCustomers(userBranch);
    loadOrders(userBranch);
    loadUsers(userBranch);
  };

  const loadBranches = async () => {
    const { data } = await supabase.from("branches").select("*").order("name");
    if (data) setBranches(data);
  };

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("name");
    if (data) setProducts(data);
  };

  const loadCustomers = async (userBranch) => {
    let query = supabase.from("customers").select("*").order("name");
    if (userBranch !== "All") query = query.eq("branch", userBranch);
    const { data } = await query;
    if (data) setCustomers(data);
  };

  const loadOrders = async (userBranch) => {
    let query = supabase
      .from("orders")
      .select(`*, order_items (*)`)
      .order("created_at", { ascending: false });
    if (userBranch !== "All") query = query.eq("branch", userBranch);
    const { data } = await query;
    if (data) setOrders(data);
  };

  const loadUsers = async (userBranch) => {
    let query = supabase.from("profiles").select("*").order("name");
    if (userBranch !== "All") query = query.eq("branch", userBranch);
    const { data } = await query;
    if (data) setUsers(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });
    if (error) alert("Login failed: " + error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActivePage("");
  };

  // Bottom navigation configurations
  const navigationConfig = {
    sales: [
      { id: "orders", label: "Orders", icon: Package },
      { id: "delivery", label: "Delivery", icon: Truck },
      { id: "payment", label: "Payment", icon: DollarSign },
      { id: "customers", label: "Customers", icon: Users },
    ],
    operator: [
      { id: "trips", label: "Trips", icon: Truck },
      { id: "orders", label: "Orders", icon: Package },
      { id: "map", label: "Map", icon: Map },
    ],
    finance: [
      { id: "payments", label: "Payments", icon: DollarSign },
      { id: "reports", label: "Reports", icon: BarChart },
      { id: "orders", label: "Orders", icon: Package },
    ],
    admin: [
      { id: "branches", label: "Branches", icon: Building },
      { id: "products", label: "Products", icon: Package },
      { id: "users", label: "Users", icon: Users },
      { id: "reports", label: "Reports", icon: FileText },
    ],
  };

  const renderPage = () => {
    const commonProps = {
      currentUser,
      branches,
      products,
      customers,
      orders,
      users,
      loadBranches,
      loadProducts,
      loadCustomers,
      loadOrders,
      loadUsers,
    };

    // Sales pages
    if (currentUser.role === "sales") {
      switch (activePage) {
        case "orders":
          return <SalesOrderPage {...commonProps} />;
        case "delivery":
          return <SalesDeliveryPage {...commonProps} />;
        case "payment":
          return <SalesPaymentPage {...commonProps} />;
        case "customers":
          return <SalesCustomerPage {...commonProps} />;
        default:
          return <SalesOrderPage {...commonProps} />;
      }
    }

    // Operator pages
    if (currentUser.role === "operator") {
      switch (activePage) {
        case "trips":
          return <OperatorTripsPage {...commonProps} />;
        case "orders":
          return <OperatorOrdersPage {...commonProps} />;
        case "map":
          return (
            <div className="p-4 text-center text-gray-600">
              Map view coming soon...
            </div>
          );
        default:
          return <OperatorTripsPage {...commonProps} />;
      }
    }

    // Finance pages
    if (currentUser.role === "finance") {
      switch (activePage) {
        case "payments":
          return <FinancePaymentsPage {...commonProps} />;
        case "reports":
          return <FinanceReportsPage {...commonProps} />;
        case "orders":
          return <FinanceOrdersPage {...commonProps} />;
        default:
          return <FinancePaymentsPage {...commonProps} />;
      }
    }

    // Admin pages
    if (currentUser.role === "admin") {
      switch (activePage) {
        case "branches":
          return <AdminBranchesPage {...commonProps} />;
        case "products":
          return <AdminProductsPage {...commonProps} />;
        case "users":
          return <AdminUsersPage {...commonProps} />;
        case "reports":
          return <AdminReportsPage {...commonProps} />;
        default:
          return <AdminBranchesPage {...commonProps} />;
      }
    }

    return <div className="p-4">Invalid role</div>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Water Depot</h1>
            <p className="text-gray-600 mt-2">Bottom Navigation System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                placeholder="Enter email"
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                placeholder="Enter password"
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Demo Accounts:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Admin:</strong> admin@depot.com / admin123
              </p>
              <p>
                <strong>Sales:</strong> budi@depot.com / budi123
              </p>
              <p>
                <strong>Operator:</strong> siti@depot.com / siti123
              </p>
              <p>
                <strong>Finance:</strong> ahmad@depot.com / ahmad123
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentNavigation = navigationConfig[currentUser.role] || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg flex-shrink-0">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">Water Depot</h1>
            <p className="text-sm text-blue-100 capitalize">
              {currentUser.role}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-blue-100">{currentUser.branch}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg text-sm transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-6xl mx-auto">{renderPage()}</div>
      </div>

      {/* Bottom Navigation Bar - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg flex-shrink-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-around">
          {currentNavigation.map((nav) => (
            <button
              key={nav.id}
              onClick={() => setActivePage(nav.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
                activePage === nav.id
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <nav.icon size={24} className="mb-1" />
              <span className="text-xs font-medium">{nav.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
