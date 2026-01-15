// src/App.js - Water Depot V111 with Supabase Backend
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Plus,
  Truck,
  DollarSign,
  Users,
  Settings,
  Building,
  UserPlus,
  Package,
} from "lucide-react";

export default function WaterDepotApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(null);

  // Data states
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // Sales UI states
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    address: "",
    phone: "",
    whatsapp: "",
    discount: 0,
  });
  const [newOrder, setNewOrder] = useState({
    customerId: "",
    branch: "",
    deliveryDate: "",
  });
  const [currentOrderItems, setCurrentOrderItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ product: "", quantity: "" });

  // Admin UI states
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    unit: "gallon",
    is_refill: false,
  });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales",
    branch: "Jakarta",
  });

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

  // Load user profile
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

  // Load all data
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

  // Authentication
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
  };

  // Customer CRUD
  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.address || !newCustomer.whatsapp) {
      alert("Please fill customer name, address, and WhatsApp");
      return;
    }

    const customerData = {
      ...newCustomer,
      discount: parseInt(newCustomer.discount) || 0,
      branch:
        currentUser.branch === "All"
          ? newOrder.branch || branches[0]?.name
          : currentUser.branch,
      created_by: currentUser.id,
    };

    if (editingCustomer) {
      const { error } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", editingCustomer.id);

      if (error) {
        alert("Error: " + error.message);
      } else {
        await loadCustomers(currentUser.branch);
        setEditingCustomer(null);
        setNewCustomer({
          name: "",
          address: "",
          phone: "",
          whatsapp: "",
          discount: 0,
        });
        setShowCustomerForm(false);
        alert("Customer updated!");
      }
    } else {
      const { data, error } = await supabase
        .from("customers")
        .insert([customerData])
        .select()
        .single();

      if (error) {
        alert("Error: " + error.message);
      } else {
        await loadCustomers(currentUser.branch);
        if (showOrderForm) {
          setNewOrder({
            ...newOrder,
            customerId: data.id,
          });
        }
        setNewCustomer({
          name: "",
          address: "",
          phone: "",
          whatsapp: "",
          discount: 0,
        });
        setShowCustomerForm(false);
        alert("Customer created!");
      }
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      address: customer.address,
      phone: customer.phone || "",
      whatsapp: customer.whatsapp,
      discount: customer.discount || 0,
    });
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = async (id) => {
    if (!confirm("Delete this customer?")) return;

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadCustomers(currentUser.branch);
      alert("Customer deleted!");
    }
  };

  // Order CRUD
  const handleAddItemToOrder = () => {
    if (!currentItem.product || !currentItem.quantity) {
      alert("Select product and quantity");
      return;
    }

    const product = products.find((p) => p.name === currentItem.product);
    const customer = customers.find((c) => c.id === newOrder.customerId);

    if (!product || !customer) return;

    const discount = product.is_refill ? customer.discount : 0;
    const item = {
      product: product.name,
      is_refill: product.is_refill,
      quantity: parseInt(currentItem.quantity),
      unit_price: product.price,
      discount: discount,
    };

    setCurrentOrderItems([...currentOrderItems, item]);
    setCurrentItem({ product: "", quantity: "" });
  };

  const handleRemoveItemFromOrder = (index) => {
    setCurrentOrderItems(currentOrderItems.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async () => {
    if (
      !newOrder.customerId ||
      !newOrder.deliveryDate ||
      currentOrderItems.length === 0
    ) {
      alert("Fill all fields and add items");
      return;
    }

    const customer = customers.find((c) => c.id === newOrder.customerId);
    const totalAmount = currentOrderItems.reduce(
      (sum, item) => sum + (item.unit_price - item.discount) * item.quantity,
      0
    );

    const orderData = {
      customer_id: customer.id,
      customer_name: customer.name,
      customer_address: customer.address,
      customer_whatsapp: customer.whatsapp,
      customer_discount: customer.discount,
      branch: newOrder.branch || customer.branch,
      total_amount: totalAmount,
      delivery_date: newOrder.deliveryDate,
      created_by: currentUser.id,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      alert("Error: " + orderError.message);
      return;
    }

    const itemsData = currentOrderItems.map((item) => ({
      order_id: order.id,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsData);

    if (itemsError) {
      alert("Error adding items: " + itemsError.message);
    } else {
      await loadOrders(currentUser.branch);
      setNewOrder({ customerId: "", branch: "", deliveryDate: "" });
      setCurrentOrderItems([]);
      setShowOrderForm(false);
      alert("Order created!");
    }
  };

  const handleMarkAsPaid = async (orderId) => {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        paid_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", orderId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadOrders(currentUser.branch);
      alert("Marked as paid!");
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadOrders(currentUser.branch);
    }
  };

  // Branch CRUD
  const handleAddBranch = async () => {
    if (!newBranch.name || !newBranch.address || !newBranch.phone) {
      alert("Please fill all fields");
      return;
    }

    if (editingBranch) {
      const { error } = await supabase
        .from("branches")
        .update(newBranch)
        .eq("id", editingBranch.id);

      if (error) {
        alert("Error: " + error.message);
      } else {
        await loadBranches();
        setEditingBranch(null);
        setNewBranch({ name: "", address: "", phone: "" });
        setShowBranchForm(false);
        alert("Branch updated!");
      }
    } else {
      const { error } = await supabase.from("branches").insert([newBranch]);

      if (error) {
        alert("Error: " + error.message);
      } else {
        await loadBranches();
        setNewBranch({ name: "", address: "", phone: "" });
        setShowBranchForm(false);
        alert("Branch created!");
      }
    }
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setNewBranch({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
    });
    setShowBranchForm(true);
  };

  const handleDeleteBranch = async (id) => {
    if (!confirm("Delete this branch? This cannot be undone.")) return;

    const { error } = await supabase.from("branches").delete().eq("id", id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadBranches();
      alert("Branch deleted!");
    }
  };

  const toggleBranchStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("branches")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadBranches();
    }
  };

  // Product CRUD
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.unit) {
      alert("Please fill all fields");
      return;
    }

    const productData = {
      ...newProduct,
      price: parseInt(newProduct.price),
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        alert("Error: " + error.message);
      } else {
        await loadProducts();
        setEditingProduct(null);
        setNewProduct({
          name: "",
          price: "",
          unit: "gallon",
          is_refill: false,
        });
        setShowProductForm(false);
        alert("Product updated!");
      }
    } else {
      const { error } = await supabase.from("products").insert([productData]);

      if (error) {
        alert("Error: " + error.message);
      } else {
        await loadProducts();
        setNewProduct({
          name: "",
          price: "",
          unit: "gallon",
          is_refill: false,
        });
        setShowProductForm(false);
        alert("Product created!");
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price,
      unit: product.unit,
      is_refill: product.is_refill,
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadProducts();
      alert("Product deleted!");
    }
  };

  const toggleProductStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadProducts();
    }
  };

  // User Management
  const handleEditUserProfile = (user) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      branch: user.branch,
    });
    setShowUserForm(true);
  };

  const handleUpdateUserProfile = async () => {
    if (!newUser.name || !newUser.role || !newUser.branch) {
      alert("Please fill all fields");
      return;
    }

    const updateData = {
      name: newUser.name,
      role: newUser.role,
      branch: newUser.branch,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", editingUser.id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadUsers(currentUser.branch);
      setEditingUser(null);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "sales",
        branch: "Jakarta",
      });
      setShowUserForm(false);
      alert("User updated!");
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadUsers(currentUser.branch);
    }
  };

  // Stats
  const totalReceivable = orders
    .filter((o) => o.payment_status === "unpaid")
    .reduce((sum, o) => sum + o.total_amount, 0);
  const pendingDeliveries = orders.filter(
    (o) => o.status === "pending" || o.status === "scheduled"
  ).length;

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      scheduled: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentColor = (status) => {
    return status === "paid"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Users },
    { id: "sales", label: "Sales", icon: Plus },
    { id: "operator", label: "Operator", icon: Truck },
    { id: "finance", label: "Finance", icon: DollarSign },
    ...(currentUser?.role === "admin"
      ? [{ id: "admin", label: "Admin", icon: Settings }]
      : []),
  ];

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
            <p className="text-gray-600 mt-2">Supabase Backend</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">Water Depot System V2</h1>
            <p className="text-sm text-blue-100">
              Supabase Backend - Enhanced UI
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-blue-100 capitalize">
                {currentUser.role} - {currentUser.branch}
              </p>
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

      {/* Tabs */}
      <div className="bg-white shadow-sm overflow-x-auto">
        <div className="flex space-x-1 p-2 max-w-6xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon size={18} />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-6xl mx-auto">
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {orders.length}
                    </p>
                  </div>
                  <Users className="text-blue-600" size={32} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Deliveries</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {pendingDeliveries}
                    </p>
                  </div>
                  <Truck className="text-orange-600" size={32} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Receivables</p>
                    <p className="text-2xl font-bold text-red-600">
                      Rp {totalReceivable.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="text-red-600" size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-bold text-lg">Recent Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                        Customer
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                        Branch
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                        Items
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                        Payment
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {order.customer_name}
                        </td>
                        <td className="px-4 py-3 text-sm">{order.branch}</td>
                        <td className="px-4 py-3 text-sm">
                          {order.order_items?.length || 0} item(s)
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentColor(
                              order.payment_status
                            )}`}
                          >
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          Rp {order.total_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Sales Management</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustomerList(!showCustomerList)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition"
                >
                  <Users size={18} />
                  <span className="text-sm">Customers</span>
                </button>
                <button
                  onClick={() => setShowOrderForm(!showOrderForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                  <Plus size={18} />
                  <span className="text-sm">New Order</span>
                </button>
              </div>
            </div>

            {showCustomerList && (
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">
                    Customer List ({customers.length})
                  </h3>
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setNewCustomer({
                        name: "",
                        address: "",
                        phone: "",
                        whatsapp: "",
                        discount: 0,
                      });
                      setShowCustomerForm(true);
                    }}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-green-700 transition"
                  >
                    <Plus size={16} />
                    Add Customer
                  </button>
                </div>

                {showCustomerForm && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg space-y-3 border-2 border-blue-200">
                    <h4 className="font-bold">
                      {editingCustomer ? "Edit Customer" : "Add New Customer"}
                    </h4>
                    <input
                      type="text"
                      placeholder="Customer Name *"
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <textarea
                      placeholder="Address *"
                      value={newCustomer.address}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows={2}
                    />
                    <input
                      type="text"
                      placeholder="WhatsApp * (e.g., 6281234567890)"
                      value={newCustomer.whatsapp}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          whatsapp: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Phone (optional)"
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Discount per unit (Rp)"
                      value={newCustomer.discount}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          discount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-600">
                      * Discount only applies to Refill products
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCustomer}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition"
                      >
                        {editingCustomer ? "Update" : "Save"} Customer
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomerForm(false);
                          setEditingCustomer(null);
                          setNewCustomer({
                            name: "",
                            address: "",
                            phone: "",
                            whatsapp: "",
                            discount: 0,
                          });
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{customer.name}</h4>
                          <p className="text-sm text-gray-600">
                            {customer.address}
                          </p>
                          <div className="flex gap-3 mt-1 text-sm">
                            <p className="text-gray-600">
                              <span className="font-medium">WA:</span>{" "}
                              {customer.whatsapp}
                            </p>
                            {customer.phone && (
                              <p className="text-gray-600">
                                <span className="font-medium">Phone:</span>{" "}
                                {customer.phone}
                              </p>
                            )}
                          </div>
                          <div className="mt-1">
                            <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                              Discount: Rp {customer.discount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 font-medium transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 font-medium transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showOrderForm && (
              <div className="bg-white p-4 rounded-lg shadow space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Create New Order</h3>
                  <button
                    onClick={() => {
                      setShowOrderForm(false);
                      setCurrentOrderItems([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex gap-2">
                  <select
                    value={newOrder.customerId}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, customerId: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Discount: Rp {c.discount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setNewCustomer({
                        name: "",
                        address: "",
                        phone: "",
                        whatsapp: "",
                        discount: 0,
                      });
                      setShowCustomerForm(true);
                    }}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-green-700 transition"
                  >
                    <Plus size={16} />
                    New
                  </button>
                </div>

                <input
                  type="date"
                  value={newOrder.deliveryDate}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, deliveryDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                <div className="border-t pt-3">
                  <h4 className="font-bold mb-2">Add Items</h4>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={currentItem.product}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          product: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select Product</option>
                      {products
                        .filter((p) => p.status === "active")
                        .map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} - Rp {p.price.toLocaleString()}{" "}
                            {p.is_refill ? "(Refill)" : ""}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantity: e.target.value,
                        })
                      }
                      className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={handleAddItemToOrder}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
                    >
                      Add
                    </button>
                  </div>

                  {currentOrderItems.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded space-y-2">
                      {currentOrderItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-sm bg-white p-2 rounded"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{item.product}</span>{" "}
                            × {item.quantity}
                            {item.discount > 0 && (
                              <span className="text-orange-600 ml-2">
                                (-Rp {item.discount.toLocaleString()}/unit)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-green-600">
                              Rp{" "}
                              {(
                                (item.unit_price - item.discount) *
                                item.quantity
                              ).toLocaleString()}
                            </span>
                            <button
                              onClick={() => handleRemoveItemFromOrder(idx)}
                              className="text-red-600 hover:text-red-800 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-green-600">
                          Rp{" "}
                          {currentOrderItems
                            .reduce(
                              (sum, item) =>
                                sum +
                                (item.unit_price - item.discount) *
                                  item.quantity,
                              0
                            )
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    onClick={handleCreateOrder}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition"
                  >
                    Create Order
                  </button>
                  <button
                    onClick={() => {
                      setShowOrderForm(false);
                      setCurrentOrderItems([]);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Orders List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="font-bold text-lg">Orders ({orders.length})</h3>
              </div>
              <div className="space-y-3 p-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border-2 rounded-lg hover:border-blue-300 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg">
                          {order.customer_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.customer_address}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.branch} • {order.delivery_date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          Rp {order.total_amount.toLocaleString()}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {order.order_items && order.order_items.length > 0 && (
                      <div className="bg-gray-50 p-2 rounded text-sm space-y-1 mb-2">
                        {order.order_items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {item.product} × {item.quantity}
                            </span>
                            <span className="font-medium">
                              Rp{" "}
                              {(
                                (item.unit_price - item.discount) *
                                item.quantity
                              ).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full font-medium ${getPaymentColor(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status}
                      </span>
                      {order.paid_date && (
                        <span className="text-gray-600">
                          Paid: {order.paid_date}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "operator" && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Delivery Management</h2>
            <p className="text-gray-600 mb-4">Manage trips and deliveries</p>
            <div className="space-y-3">
              {orders
                .filter((o) => o.status !== "delivered")
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg">
                          {order.customer_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.customer_address}
                        </p>
                        <p className="text-sm">
                          Delivery: {order.delivery_date}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.order_items?.length || 0} item(s) • Rp{" "}
                          {order.total_amount.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdateOrderStatus(order.id, "delivered")
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                ))}
              {orders.filter((o) => o.status !== "delivered").length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No pending deliveries
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-2">Account Receivables</h2>
              <p className="text-3xl font-bold text-red-600">
                Rp {totalReceivable.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {orders.filter((o) => o.payment_status === "unpaid").length}{" "}
                unpaid orders
              </p>
            </div>

            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">
                        {order.customer_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.delivery_date}
                      </p>
                      <p className="text-sm text-gray-500">{order.branch}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        Rp {order.total_amount.toLocaleString()}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentColor(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status}
                      </span>
                      {order.paid_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Paid: {order.paid_date}
                        </p>
                      )}
                    </div>
                  </div>

                  {order.payment_status === "unpaid" && (
                    <button
                      onClick={() => handleMarkAsPaid(order.id)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition flex items-center justify-center gap-2"
                    >
                      <DollarSign size={18} />
                      Mark as Paid
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Admin Panel</h2>

            {/* BRANCHES SECTION */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Building size={20} />
                  Branch Management ({branches.length})
                </h3>
                <button
                  onClick={() => {
                    setEditingBranch(null);
                    setNewBranch({ name: "", address: "", phone: "" });
                    setShowBranchForm(!showBranchForm);
                  }}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 transition"
                >
                  <Plus size={16} />
                  Add Branch
                </button>
              </div>

              {showBranchForm && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3 border-2 border-blue-200">
                  <h4 className="font-bold">
                    {editingBranch ? "Edit Branch" : "Add New Branch"}
                  </h4>
                  <input
                    type="text"
                    placeholder="Branch Name *"
                    value={newBranch.name}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Address *"
                    value={newBranch.address}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Phone *"
                    value={newBranch.phone}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBranch}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition"
                    >
                      {editingBranch ? "Update Branch" : "Add Branch"}
                    </button>
                    <button
                      onClick={() => {
                        setShowBranchForm(false);
                        setEditingBranch(null);
                        setNewBranch({ name: "", address: "", phone: "" });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-bold text-lg">{branch.name}</p>
                      <p className="text-sm text-gray-600">{branch.address}</p>
                      <p className="text-sm text-gray-600">{branch.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditBranch(branch)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          toggleBranchStatus(branch.id, branch.status)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          branch.status
                        )}`}
                      >
                        {branch.status}
                      </button>
                      <button
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRODUCTS SECTION */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Package size={20} />
                  Product Management ({products.length})
                </h3>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({
                      name: "",
                      price: "",
                      unit: "gallon",
                      is_refill: false,
                    });
                    setShowProductForm(!showProductForm);
                  }}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 transition"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              </div>

              {showProductForm && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3 border-2 border-blue-200">
                  <h4 className="font-bold">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h4>
                  <input
                    type="text"
                    placeholder="Product Name *"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Price (Rp) *"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <select
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="gallon">Gallon</option>
                    <option value="piece">Piece</option>
                    <option value="box">Box</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRefill"
                      checked={newProduct.is_refill}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          is_refill: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="isRefill" className="text-sm font-medium">
                      Is Refill Product (discount applies)
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddProduct}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition"
                    >
                      {editingProduct ? "Update Product" : "Add Product"}
                    </button>
                    <button
                      onClick={() => {
                        setShowProductForm(false);
                        setEditingProduct(null);
                        setNewProduct({
                          name: "",
                          price: "",
                          unit: "gallon",
                          is_refill: false,
                        });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{product.name}</p>
                        {product.is_refill && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                            Refill
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Rp {product.price.toLocaleString()} / {product.unit}
                      </p>
                      {product.is_refill && (
                        <p className="text-xs text-orange-600 mt-1">
                          * Customer discount applies
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          toggleProductStatus(product.id, product.status)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          product.status
                        )}`}
                      >
                        {product.status}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* USERS SECTION */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <UserPlus size={20} />
                  User Management ({users.length})
                </h3>
                <div className="text-sm text-gray-600">
                  Note: Create users in Supabase Auth first
                </div>
              </div>

              {showUserForm && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3 border-2 border-blue-200">
                  <h4 className="font-bold">Edit User Profile</h4>
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="sales">Sales</option>
                    <option value="operator">Operator</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    value={newUser.branch}
                    onChange={(e) =>
                      setNewUser({ ...newUser, branch: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {branches
                      .filter((b) => b.status === "active")
                      .map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    <option value="All">All</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateUserProfile}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition"
                    >
                      Update User
                    </button>
                    <button
                      onClick={() => {
                        setShowUserForm(false);
                        setEditingUser(null);
                        setNewUser({
                          name: "",
                          email: "",
                          password: "",
                          role: "sales",
                          branch: "Jakarta",
                        });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-bold text-lg">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize font-medium">
                          {user.role}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                          {user.branch}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditUserProfile(user)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
