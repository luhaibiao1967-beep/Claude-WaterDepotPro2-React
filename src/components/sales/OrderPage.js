// components/sales/OrderPage.js - V118: Autocomplete Customer Search
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { Plus, X, Edit2, Trash2, UserPlus, Search } from "lucide-react";

export default function SalesOrderPage({
  currentUser,
  customers,
  orders,
  products,
  branches,
  loadCustomers,
  loadOrders,
}) {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    address: "",
    phone: "",
    whatsapp: "",
    discount: 0,
  });
  const [newOrder, setNewOrder] = useState({
    customerId: "",
    customerName: "",
    branch: "",
    deliveryDate: "",
  });
  const [currentOrderItems, setCurrentOrderItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ product: "", quantity: "" });

  // Autocomplete states
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const customerInputRef = useRef(null);

  // Get today's date and 7 days from now
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today.setDate(today.getDate() + 7));
    return maxDate.toISOString().split("T")[0];
  };

  // Set default delivery date to tomorrow
  useEffect(() => {
    if (showOrderForm && !editingOrder && !newOrder.deliveryDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNewOrder((prev) => ({
        ...prev,
        deliveryDate: tomorrow.toISOString().split("T")[0],
      }));
    }
  }, [showOrderForm, editingOrder]);

  // Filter customers based on search text
  useEffect(() => {
    if (customerSearchText.trim() === "") {
      setFilteredCustomers([]);
      return;
    }

    const searchLower = customerSearchText.toLowerCase();
    const filtered = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.address.toLowerCase().includes(searchLower) ||
        c.whatsapp.includes(searchLower)
    );
    setFilteredCustomers(filtered);
  }, [customerSearchText, customers]);

  // Handle customer search input
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchText(value);
    setShowCustomerDropdown(true);

    // Clear selection if user is typing
    if (newOrder.customerId) {
      setNewOrder({
        ...newOrder,
        customerId: "",
        customerName: "",
      });
    }
  };

  // Handle customer selection from dropdown
  const handleSelectCustomer = (customer) => {
    setCustomerSearchText(customer.name);
    setNewOrder({
      ...newOrder,
      customerId: customer.id,
      customerName: customer.name,
      branch: customer.branch || newOrder.branch,
    });
    setShowCustomerDropdown(false);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerInputRef.current &&
        !customerInputRef.current.contains(event.target)
      ) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.address || !newCustomer.whatsapp) {
      alert("Please fill customer name, address, and WhatsApp");
      return;
    }

    const customerData = {
      name: newCustomer.name,
      address: newCustomer.address,
      phone: newCustomer.phone || "",
      whatsapp: newCustomer.whatsapp,
      discount: parseInt(newCustomer.discount) || 0,
      branch:
        currentUser.branch === "All"
          ? newOrder.branch || branches[0]?.name
          : currentUser.branch,
      created_by: currentUser.id,
    };

    const { data, error } = await supabase
      .from("customers")
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error("Customer creation error:", error);
      alert("Error creating customer: " + error.message);
    } else {
      await loadCustomers(currentUser.branch);
      // Auto-select the new customer
      setCustomerSearchText(data.name);
      setNewOrder({
        ...newOrder,
        customerId: data.id,
        customerName: data.name,
      });
      setNewCustomer({
        name: "",
        address: "",
        phone: "",
        whatsapp: "",
        discount: 0,
      });
      setShowCustomerForm(false);
      alert("Customer created successfully!");
    }
  };

  const handleAddItemToOrder = () => {
    if (!currentItem.product || !currentItem.quantity) {
      alert("Select product and quantity");
      return;
    }

    if (!newOrder.customerId) {
      alert("Please select a customer first");
      return;
    }

    const product = products.find((p) => p.name === currentItem.product);
    const customer = customers.find((c) => c.id === newOrder.customerId);

    if (!product || !customer) {
      alert("Product or customer not found");
      return;
    }

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
    const newItems = currentOrderItems.filter((_, i) => i !== index);
    setCurrentOrderItems(newItems);
  };

  const calculateTotalAmount = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      const itemTotal = (item.unit_price - item.discount) * item.quantity;
      return sum + itemTotal;
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (
      !newOrder.customerId ||
      !newOrder.deliveryDate ||
      currentOrderItems.length === 0
    ) {
      alert("Fill all fields and add at least one item");
      return;
    }

    const customer = customers.find((c) => c.id === newOrder.customerId);
    if (!customer) {
      alert("Customer not found");
      return;
    }

    const totalAmount = calculateTotalAmount(currentOrderItems);

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

    if (editingOrder) {
      const { error: orderError } = await supabase
        .from("orders")
        .update(orderData)
        .eq("id", editingOrder.id);

      if (orderError) {
        alert("Error updating order: " + orderError.message);
        return;
      }

      await supabase
        .from("order_items")
        .delete()
        .eq("order_id", editingOrder.id);

      const itemsToInsert = currentOrderItems.map((item) => ({
        order_id: editingOrder.id,
        product: item.product,
        is_refill: item.is_refill,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) {
        alert("Error inserting items: " + itemsError.message);
        return;
      }

      await loadOrders(currentUser.branch);
      resetForm();
      alert("Order updated successfully!");
    } else {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        alert("Error creating order: " + orderError.message);
        return;
      }

      const itemsToInsert = currentOrderItems.map((item) => ({
        order_id: order.id,
        product: item.product,
        is_refill: item.is_refill,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) {
        alert("Error adding items: " + itemsError.message);
        return;
      }

      await loadOrders(currentUser.branch);
      resetForm();
      alert("Order created successfully!");
    }
  };

  const handleEditOrder = (order) => {
    if (order.status === "delivered") {
      alert("Cannot edit delivered orders");
      return;
    }

    setEditingOrder(order);
    setCustomerSearchText(order.customer_name);
    setNewOrder({
      customerId: order.customer_id,
      customerName: order.customer_name,
      branch: order.branch,
      deliveryDate: order.delivery_date,
    });

    const cleanItems = (order.order_items || []).map((item) => ({
      product: item.product,
      is_refill: item.is_refill,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
    }));

    setCurrentOrderItems(cleanItems);
    setShowOrderForm(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Delete this order? This cannot be undone.")) {
      return;
    }

    try {
      await supabase.from("order_items").delete().eq("order_id", orderId);
      await supabase.from("orders").delete().eq("id", orderId);
      await loadOrders(currentUser.branch);
      alert("Order deleted successfully!");
    } catch (error) {
      alert("Error deleting order: " + error.message);
    }
  };

  const resetForm = () => {
    setNewOrder({
      customerId: "",
      customerName: "",
      branch: "",
      deliveryDate: "",
    });
    setCustomerSearchText("");
    setCurrentOrderItems([]);
    setCurrentItem({ product: "", quantity: "" });
    setEditingOrder(null);
    setShowOrderForm(false);
    setShowCustomerForm(false);
    setShowCustomerDropdown(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      scheduled: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const myOrders = orders.filter((o) => o.created_by === currentUser.id);
  const currentTotal = calculateTotalAmount(currentOrderItems);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Orders</h2>
        <button
          onClick={() => {
            resetForm();
            setShowOrderForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          New Order
        </button>
      </div>

      {/* Order Form */}
      {showOrderForm && (
        <div className="bg-white p-4 rounded-lg shadow-lg space-y-4 border-2 border-blue-500">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">
              {editingOrder ? `Edit Order #${editingOrder.id}` : "Create Order"}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Customer Search Autocomplete */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold">
              Customer * (Type to search)
            </label>

            <div className="relative" ref={customerInputRef}>
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchText}
                  onChange={handleCustomerSearchChange}
                  onFocus={() => {
                    if (customerSearchText) setShowCustomerDropdown(true);
                  }}
                  placeholder="Type customer name..."
                  className="w-full px-3 py-3 pl-10 border-2 rounded-lg text-base"
                  disabled={editingOrder !== null}
                />
                <Search
                  className="absolute left-3 top-3.5 text-gray-400"
                  size={20}
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showCustomerDropdown && customerSearchText && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                      >
                        <p className="font-bold text-sm">{customer.name}</p>
                        <p className="text-xs text-gray-600">
                          {customer.address}
                        </p>
                        <p className="text-xs text-orange-600">
                          Discount: Rp{" "}
                          {customer.discount?.toLocaleString() || 0}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      <p className="text-sm">No customers found</p>
                      <p className="text-xs">
                        Try different search or add new customer
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Customer Indicator */}
              {newOrder.customerId && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="text-green-800 font-medium">
                    ✓ Selected: {newOrder.customerName}
                  </p>
                </div>
              )}
            </div>

            {/* Add Customer Button */}
            {!editingOrder && (
              <button
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
              >
                <UserPlus size={18} />
                Add New Customer
              </button>
            )}
          </div>

          {/* Add Customer Form */}
          {showCustomerForm && (
            <div className="p-4 bg-green-50 rounded-lg space-y-3 border-2 border-green-200">
              <h4 className="font-bold text-green-800">Add New Customer</h4>
              <input
                type="text"
                placeholder="Customer Name *"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Customer Address *"
                value={newCustomer.address}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, address: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
              <input
                type="text"
                placeholder="WhatsApp * (e.g., 6281234567890)"
                value={newCustomer.whatsapp}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, whatsapp: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Phone (optional)"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Discount per unit (Rp)"
                value={newCustomer.discount}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, discount: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-600">
                * Discount only applies to Refill products
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleAddCustomer}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold"
                >
                  Save Customer
                </button>
                <button
                  onClick={() => setShowCustomerForm(false)}
                  className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delivery Date */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold">
              Delivery Date * (Max 7 days)
            </label>
            <input
              type="date"
              value={newOrder.deliveryDate}
              onChange={(e) =>
                setNewOrder({ ...newOrder, deliveryDate: e.target.value })
              }
              min={getTodayDate()}
              max={getMaxDate()}
              className="w-full px-3 py-3 border-2 rounded-lg text-base"
            />
            <p className="text-xs text-gray-500">
              Select delivery date (today to{" "}
              {new Date(getMaxDate()).toLocaleDateString()})
            </p>
          </div>

          {/* Add Items Section */}
          <div className="border-t-2 pt-4">
            <h4 className="font-bold mb-3">Order Items</h4>

            <div className="space-y-2">
              <select
                value={currentItem.product}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, product: e.target.value })
                }
                className="w-full px-3 py-3 border-2 rounded-lg text-base"
                disabled={!newOrder.customerId}
              >
                <option value="">
                  {!newOrder.customerId
                    ? "Select customer first"
                    : "-- Select Product --"}
                </option>
                {products
                  .filter((p) => p.status === "active")
                  .map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} - Rp {p.price?.toLocaleString() || 0}
                      {p.is_refill ? " (Refill)" : ""}
                    </option>
                  ))}
              </select>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, quantity: e.target.value })
                  }
                  className="flex-1 px-3 py-3 border-2 rounded-lg text-base"
                  min="1"
                  disabled={!newOrder.customerId}
                />
                <button
                  onClick={handleAddItemToOrder}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold disabled:bg-gray-400"
                  disabled={!newOrder.customerId}
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* Current Items List */}
            {currentOrderItems.length > 0 ? (
              <div className="space-y-2 mt-4">
                {currentOrderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border-2"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-sm">{item.product}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Qty: {item.quantity} × Rp{" "}
                        {item.unit_price?.toLocaleString() || 0}
                        {item.discount > 0 && (
                          <span className="text-orange-600">
                            {" "}
                            - Rp {item.discount.toLocaleString()}
                          </span>
                        )}
                      </p>
                      <p className="text-sm font-bold text-green-600 mt-1">
                        = Rp{" "}
                        {(
                          (item.unit_price - item.discount) *
                          item.quantity
                        ).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItemFromOrder(index)}
                      className="text-red-600 hover:text-red-800 p-2 flex-shrink-0"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}

                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-500 mt-3">
                  <p className="text-base font-bold">Total:</p>
                  <p className="text-xl font-bold text-green-600">
                    Rp {currentTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mt-4">
                <p className="font-medium">No items yet</p>
                <p className="text-sm mt-1">
                  {!newOrder.customerId
                    ? "Select a customer first"
                    : "Add products above"}
                </p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col gap-2 pt-4 border-t-2">
            <button
              onClick={handleCreateOrder}
              className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 font-bold text-lg disabled:bg-gray-400"
              disabled={currentOrderItems.length === 0}
            >
              {editingOrder ? "💾 Update Order" : "✓ Create Order"}
            </button>
            <button
              onClick={resetForm}
              className="w-full bg-gray-300 text-gray-700 py-4 rounded-lg hover:bg-gray-400 font-bold text-lg"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {myOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            <p className="text-lg font-medium">No orders yet</p>
            <p className="text-sm mt-2">
              Click "New Order" to create your first order
            </p>
          </div>
        ) : (
          myOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-4 rounded-lg shadow-md border"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold">
                      {order.customer_name}
                    </h3>
                    <span className="text-xs text-gray-500">#{order.id}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.customer_address}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {order.delivery_date}
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-lg font-bold text-green-600">
                    Rp {order.total_amount?.toLocaleString() || "0"}
                  </p>
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded-full font-medium mt-1 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {order.order_items && order.order_items.length > 0 && (
                <div className="bg-gray-50 p-3 rounded space-y-1 text-sm mb-3 border">
                  <p className="font-semibold text-gray-700 mb-1">Items:</p>
                  {order.order_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between py-1 text-xs"
                    >
                      <span>
                        {item.product} × {item.quantity}
                        {item.discount > 0 && (
                          <span className="text-orange-600 ml-1">
                            (-{item.discount})
                          </span>
                        )}
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

              {order.status !== "delivered" && (
                <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                  <button
                    onClick={() => handleEditOrder(order)}
                    className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-1 text-sm"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-1 text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}

              {order.status === "delivered" && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs text-green-800 font-medium">
                    ✅ Delivered - Cannot be modified
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
