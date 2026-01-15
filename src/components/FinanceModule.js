// components/FinanceModule.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { DollarSign, Camera, X } from "lucide-react";

export default function FinanceModule({ currentUser, orders, loadOrders }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentEvidence, setPaymentEvidence] = useState(null);

  const totalReceivable = orders
    .filter((o) => o.payment_status === "unpaid")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const handleMarkAsPaid = async (orderId, evidence = null) => {
    const updateData = {
      payment_status: "paid",
      paid_date: new Date().toISOString().split("T")[0],
    };

    if (evidence) {
      updateData.payment_evidence = evidence;
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadOrders(currentUser.branch);
      setShowPaymentModal(false);
      setSelectedOrderForPayment(null);
      setPaymentEvidence(null);
      alert("Marked as paid!");
    }
  };

  const handlePaymentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentEvidence(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = () => {
    if (!paymentEvidence) {
      alert("Please upload payment evidence");
      return;
    }
    handleMarkAsPaid(selectedOrderForPayment, paymentEvidence);
  };

  const getPaymentColor = (status) => {
    return status === "paid"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">Account Receivables</h2>
        <p className="text-3xl font-bold text-red-600">
          Rp {totalReceivable.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {orders.filter((o) => o.payment_status === "unpaid").length} unpaid
          orders
        </p>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Upload Payment Evidence</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrderForPayment(null);
                  setPaymentEvidence(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Please upload a screenshot or photo of the payment
              receipt/transfer confirmation
            </p>

            <div className="mb-4">
              <label className="block w-full">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                  <Camera size={48} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload payment evidence
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG (Max 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentUpload}
                  className="hidden"
                />
              </label>
            </div>

            {paymentEvidence && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img
                  src={paymentEvidence}
                  alt="Payment Evidence"
                  className="w-full h-48 object-contain border rounded-lg bg-gray-50"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleConfirmPayment}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrderForPayment(null);
                  setPaymentEvidence(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{order.customer_name}</h3>
                <p className="text-sm text-gray-600">
                  {order.customer_address}
                </p>
                <p className="text-sm text-gray-500">
                  {order.branch} • Order #{order.id}
                </p>
                <p className="text-sm text-gray-600">
                  Delivery: {order.delivery_date}
                </p>

                {order.order_items && order.order_items.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-gray-700">Items:</p>
                    <ul className="text-gray-600 ml-4">
                      {order.order_items.map((item, idx) => (
                        <li key={idx}>
                          {item.product} × {item.quantity} - Rp{" "}
                          {(
                            (item.unit_price - item.discount) *
                            item.quantity
                          ).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  Rp{" "}
                  {order.total_amount
                    ? order.total_amount.toLocaleString()
                    : "0"}
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentColor(
                    order.payment_status
                  )}`}
                >
                  {order.payment_status}
                </span>
                {order.payment_status === "paid" && order.paid_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Paid: {order.paid_date}
                  </p>
                )}
              </div>
            </div>

            {order.payment_status === "unpaid" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkAsPaid(order.id)}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 font-medium transition"
                >
                  Mark as Paid (No Evidence)
                </button>
                <button
                  onClick={() => {
                    setSelectedOrderForPayment(order.id);
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 font-medium transition"
                >
                  <Camera size={16} />
                  Upload Payment Evidence
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {order.payment_evidence && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">
                      Payment Evidence:
                    </p>
                    <img
                      src={order.payment_evidence}
                      alt="Payment Evidence"
                      className="w-full h-32 object-contain border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        window.open(order.payment_evidence, "_blank")
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Click to view full size
                    </p>
                  </div>
                )}
                {order.status !== "delivered" && (
                  <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                    <DollarSign size={16} />
                    Paid but not yet delivered
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            <DollarSign size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No orders found</p>
            <p className="text-sm mt-1">Orders will appear here once created</p>
          </div>
        )}
      </div>
    </div>
  );
}
