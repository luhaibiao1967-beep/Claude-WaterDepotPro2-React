// components/operator/OrdersPage.js - MOBILE OPTIMIZED
import React from "react";
import { Package, Calendar, MapPin, DollarSign, Truck, ArrowRight } from "lucide-react";

export default function OperatorOrdersPage({ currentUser, orders, setActivePage }) {
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
    <div className="bg-white p-3 rounded-lg shadow border">
      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base truncate">{order.customer_name}</h4>
          <p className="text-xs text-gray-500">#{order.id.substring(0, 8)}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium border whitespace-nowrap ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Address */}
      <div className="mb-2">
        <p className="text-sm text-gray-600 flex items-start gap-1">
          <MapPin size={12} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{order.customer_address}</span>
        </p>
      </div>

      {/* Order Items - Compact */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="bg-gray-50 p-2 rounded mb-2 border">
          <p className="text-xs font-semibold text-gray-700 mb-1">Items:</p>
          <div className="space-y-1">
            {order.order_items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-700">
                  {item.product} × {item.quantity}
                </span>
                <span className="font-medium text-gray-900">
                  Rp {((item.unit_price - (item.discount || 0)) * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar size={12} />
            <span>Delivery:</span>
          </div>
          <p className="font-medium text-xs">{order.delivery_date}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <DollarSign size={12} />
            <span>Total:</span>
          </div>
          <p className="font-bold text-sm text-green-600">
            Rp {order.total_amount?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t flex justify-between items-center">
        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getPaymentColor(order.payment_status)}`}>
          {order.payment_status}
        </span>
        <span className="text-xs text-gray-500 truncate max-w-[120px]">
          {order.created_by || 'Unknown'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">All Orders</h2>
        <p className="text-xs text-gray-600 mt-1">{currentUser.branch} Branch</p>
      </div>

      {/* Help Box - Compact */}
      {pendingOrders.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="bg-blue-500 text-white p-2 rounded-full flex-shrink-0">
              <Truck size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-blue-900 text-sm mb-1">
                {pendingOrders.length} pending order(s)
              </h3>
              <p className="text-xs text-blue-800 mb-2">
                Need to assign to trips
              </p>
              <button
                onClick={() => setActivePage && setActivePage('trips')}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium text-sm w-full justify-center"
              >
                <Truck size={16} />
                Go to Trips
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200 shadow-sm">
          <div className="text-center">
            <div className="bg-yellow-200 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1">
              <Package size={16} className="text-yellow-700" />
            </div>
            <p className="text-xs text-yellow-800 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">{pendingOrders.length}</p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200 shadow-sm">
          <div className="text-center">
            <div className="bg-blue-200 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1">
              <Calendar size={16} className="text-blue-700" />
            </div>
            <p className="text-xs text-blue-800 font-medium">Scheduled</p>
            <p className="text-2xl font-bold text-blue-900">{scheduledOrders.length}</p>
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200 shadow-sm">
          <div className="text-center">
            <div className="bg-green-200 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1">
              <Package size={16} className="text-green-700" />
            </div>
            <p className="text-xs text-green-800 font-medium">Delivered</p>
            <p className="text-2xl font-bold text-green-900">{deliveredOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              Pending ({pendingOrders.length})
            </span>
            <button
              onClick={() => setActivePage && setActivePage('trips')}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
            >
              <Truck size={14} />
              Assign
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Orders */}
      {scheduledOrders.length > 0 && (
        <div>
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-2">
            Scheduled ({scheduledOrders.length})
          </span>
          <div className="space-y-2">
            {scheduledOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Delivered Orders */}
      {deliveredOrders.length > 0 && (
        <div>
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-2">
            Delivered ({deliveredOrders.length})
          </span>
          <div className="space-y-2">
            {deliveredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* No Orders */}
      {myOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package size={48} className="mx-auto mb-3 text-gray-400" />
          <p className="font-bold text-lg text-gray-600">No orders yet</p>
          <p className="text-sm text-gray-500 mt-2 px-4">
            Orders will appear here once created by sales team
          </p>
        </div>
      )}
    </div>
  );
}
