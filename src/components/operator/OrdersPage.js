// components/operator/OrdersPage.js - With Navigation to Trips
import React from "react";
import {
  Package,
  Calendar,
  MapPin,
  DollarSign,
  Truck,
  ArrowRight,
} from "lucide-react";

export default function OperatorOrdersPage({
  currentUser,
  orders,
  setActivePage,
}) {
  // Filter orders by branch
  const myOrders = orders.filter((order) => {
    if (currentUser.branch === "All") return true;
    return order.branch === currentUser.branch;
  });

  // Group orders by status
  const pendingOrders = myOrders.filter((o) => o.status === "pending");
  const scheduledOrders = myOrders.filter((o) => o.status === "scheduled");
  const deliveredOrders = myOrders.filter((o) => o.status === "delivered");

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      scheduled: "bg-blue-100 text-blue-800 border-blue-300",
      delivered: "bg-green-100 text-green-800 border-green-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getPaymentColor = (status) => {
    return status === "paid"
      ? "bg-green-100 text-green-800 border-green-300"
      : "bg-red-100 text-red-800 border-red-300";
  };

  const OrderCard = ({ order }) => (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-lg">{order.customer_name}</h4>
            <span className="text-xs text-gray-500">#{order.id}</span>
          </div>
          <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
            {order.customer_address}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium border ${getStatusColor(
              order.status
            )}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* Order Items */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="bg-gray-50 p-3 rounded mb-3 border">
          <p className="font-semibold text-gray-700 mb-2 text-sm">Items:</p>
          <div className="space-y-1">
            {order.order_items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.product} × {item.quantity}
                  {item.discount > 0 && (
                    <span className="text-orange-600 ml-1">
                      (-Rp {item.discount.toLocaleString()})
                    </span>
                  )}
                </span>
                <span className="font-medium text-gray-900">
                  Rp{" "}
                  {(
                    (item.unit_price - item.discount) *
                    item.quantity
                  ).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
        <div>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <Calendar size={14} />
            <span>Delivery:</span>
          </div>
          <p className="font-medium text-sm">{order.delivery_date}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <DollarSign size={14} />
            <span>Total:</span>
          </div>
          <p className="font-bold text-lg text-green-600">
            Rp {order.total_amount?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t flex justify-between items-center">
        <div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium border ${getPaymentColor(
              order.payment_status
            )}`}
          >
            {order.payment_status}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          by {order.created_by || "Unknown"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-2xl font-bold">All Orders</h2>
        <p className="text-sm text-gray-600 mt-1">
          {currentUser.branch} Branch
        </p>
      </div>

      {/* Help Box - How to Assign Orders */}
      {pendingOrders.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 text-white p-2 rounded-full">
              <Truck size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-1">
                Need to assign orders to delivery trips?
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                You have {pendingOrders.length} pending order(s) that need to be
                assigned to trips.
              </p>
              <button
                onClick={() => setActivePage && setActivePage("trips")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
              >
                <Truck size={18} />
                Go to Trips
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-800 font-medium">Pending</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">
                {pendingOrders.length}
              </p>
              <p className="text-xs text-yellow-700 mt-1">Need assignment</p>
            </div>
            <div className="bg-yellow-200 p-3 rounded-full">
              <Package size={24} className="text-yellow-700" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800 font-medium">Scheduled</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {scheduledOrders.length}
              </p>
              <p className="text-xs text-blue-700 mt-1">In trips</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-full">
              <Calendar size={24} className="text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-800 font-medium">Delivered</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {deliveredOrders.length}
              </p>
              <p className="text-xs text-green-700 mt-1">Completed</p>
            </div>
            <div className="bg-green-200 p-3 rounded-full">
              <Package size={24} className="text-green-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
                Pending ({pendingOrders.length})
              </span>
            </h3>
            <button
              onClick={() => setActivePage && setActivePage("trips")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <Truck size={16} />
              Assign to Trips
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Orders */}
      {scheduledOrders.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
              Scheduled ({scheduledOrders.length})
            </span>
          </h3>
          <div className="space-y-3">
            {scheduledOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Delivered Orders */}
      {deliveredOrders.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              Delivered ({deliveredOrders.length})
            </span>
          </h3>
          <div className="space-y-3">
            {deliveredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* No Orders */}
      {myOrders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <Package size={64} className="mx-auto mb-4 text-gray-400" />
          <p className="font-bold text-xl text-gray-600">No orders yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Orders will appear here once created by sales team
          </p>
        </div>
      )}
    </div>
  );
}
