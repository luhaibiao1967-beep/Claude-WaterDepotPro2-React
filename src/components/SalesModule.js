// components/SalesModule.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Users, MessageCircle, X } from "lucide-react";

export default function SalesModule({
  currentUser,
  customers,
  orders,
  products,
  branches,
  loadCustomers,
  loadOrders,
}) {
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
          setNewOrder({ ...newOrder, customerId: data.id });
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

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      scheduled: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentColor = (status) => {
    return status === "paid"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  return (
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

      {/* Customer List */}
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
                  setNewCustomer({ ...newCustomer, address: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={2}
              />
              <input
                type="text"
                placeholder="WhatsApp * (e.g., 6281234567890)"
                value={newCustomer.whatsapp}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, whatsapp: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phone (optional)"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Discount per unit (Rp)"
                value={newCustomer.discount}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, discount: e.target.value })
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
                    <p className="text-sm text-gray-600">{customer.address}</p>
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
                    <a
                      href={`https://wa.me/${customer.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                      <MessageCircle size={14} />
                      WA
                    </a>
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

      {/* Order Form */}
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
              <X size={24} />
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
                  setCurrentItem({ ...currentItem, product: e.target.value })
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
                  setCurrentItem({ ...currentItem, quantity: e.target.value })
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
                      <span className="font-medium">{item.product}</span> ×{" "}
                      {item.quantity}
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
                        <X size={18} />
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
                          (item.unit_price - item.discount) * item.quantity,
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
                  <h4 className="font-bold text-lg">{order.customer_name}</h4>
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
                  <span className="text-gray-600">Paid: {order.paid_date}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
