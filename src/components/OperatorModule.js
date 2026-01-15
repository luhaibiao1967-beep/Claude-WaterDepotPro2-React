// components/OperatorModule.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Truck,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function OperatorModule({ currentUser, orders, loadOrders }) {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [trips, setTrips] = useState([]);

  // Initialize trips
  useEffect(() => {
    const userBranch =
      currentUser.branch === "All" ? "Jakarta" : currentUser.branch;
    const today = new Date().toISOString().split("T")[0];

    setTrips([
      {
        id: 1,
        name: "Trip 1",
        date: today,
        driver: "",
        orders: [],
        status: "pending",
        branch: userBranch,
      },
      {
        id: 2,
        name: "Trip 2",
        date: today,
        driver: "",
        orders: [],
        status: "pending",
        branch: userBranch,
      },
      {
        id: 3,
        name: "Trip 3",
        date: today,
        driver: "",
        orders: [],
        status: "pending",
        branch: userBranch,
      },
      {
        id: 4,
        name: "Trip 4",
        date: today,
        driver: "",
        orders: [],
        status: "pending",
        branch: userBranch,
      },
      {
        id: 5,
        name: "Trip 5",
        date: today,
        driver: "",
        orders: [],
        status: "pending",
        branch: userBranch,
      },
    ]);
  }, [currentUser]);

  const handleUpdateOrderStatus = async (orderId, status) => {
    const updateData = { status };
    if (status === "delivered") {
      updateData.delivered_date = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);
    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadOrders(currentUser.branch);
    }
  };

  const handleAddOrderToTrip = (orderId, tripId) => {
    setTrips(
      trips.map((trip) => {
        if (trip.id === tripId) {
          return {
            ...trip,
            orders: [...trip.orders, orderId],
            status: trip.orders.length === 0 ? "in-progress" : trip.status,
          };
        }
        return trip;
      })
    );
    handleUpdateOrderStatus(orderId, "scheduled");
  };

  const handleRemoveOrderFromTrip = (orderId, tripId) => {
    setTrips(
      trips.map((trip) => {
        if (trip.id === tripId) {
          return {
            ...trip,
            orders: trip.orders.filter((id) => id !== orderId),
          };
        }
        return trip;
      })
    );
    handleUpdateOrderStatus(orderId, "pending");
  };

  const handleReorderInTrip = (tripId, orderId, direction) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const orderIndex = trip.orders.indexOf(orderId);
    if (direction === "up" && orderIndex > 0) {
      const newOrders = [...trip.orders];
      [newOrders[orderIndex], newOrders[orderIndex - 1]] = [
        newOrders[orderIndex - 1],
        newOrders[orderIndex],
      ];
      setTrips(
        trips.map((t) => (t.id === tripId ? { ...t, orders: newOrders } : t))
      );
    } else if (direction === "down" && orderIndex < trip.orders.length - 1) {
      const newOrders = [...trip.orders];
      [newOrders[orderIndex], newOrders[orderIndex + 1]] = [
        newOrders[orderIndex + 1],
        newOrders[orderIndex],
      ];
      setTrips(
        trips.map((t) => (t.id === tripId ? { ...t, orders: newOrders } : t))
      );
    }
  };

  const handleCompleteTrip = async (tripId) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip || trip.orders.length === 0) {
      alert("No deliveries in this trip");
      return;
    }

    if (
      !confirm(
        `Complete ${trip.name} and mark all ${trip.orders.length} deliveries as delivered?`
      )
    ) {
      return;
    }

    for (const orderId of trip.orders) {
      await handleUpdateOrderStatus(orderId, "delivered");
    }

    setTrips(
      trips.map((t) => (t.id === tripId ? { ...t, status: "completed" } : t))
    );
    alert(`${trip.name} completed!`);
  };

  const handleUpdateTrip = (tripId, field, value) => {
    setTrips(
      trips.map((t) => (t.id === tripId ? { ...t, [field]: value } : t))
    );
  };

  const getFilteredTrips = () => {
    if (currentUser.role === "admin" || currentUser.branch === "All") {
      return trips;
    }
    return trips.filter((t) => t.branch === currentUser.branch);
  };

  const getUnassignedOrders = () => {
    const assignedOrderIds = trips.flatMap((t) => t.orders);
    return orders.filter(
      (o) => o.status === "pending" && !assignedOrderIds.includes(o.id)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Delivery Management</h2>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="flex border-b overflow-x-auto">
          {getFilteredTrips().map((trip) => (
            <button
              key={trip.id}
              onClick={() => setSelectedTrip(trip.id)}
              className={`px-6 py-3 font-medium transition relative whitespace-nowrap ${
                selectedTrip === trip.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{trip.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    trip.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : trip.status === "in-progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {trip.orders.length}
                </span>
              </div>
            </button>
          ))}
          <button
            onClick={() => setSelectedTrip(null)}
            className={`px-6 py-3 font-medium transition whitespace-nowrap ${
              selectedTrip === null
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Unassigned
          </button>
        </div>

        <div className="p-4">
          {selectedTrip !== null &&
            (() => {
              const trip = getFilteredTrips().find(
                (t) => t.id === selectedTrip
              );
              if (!trip) return null;

              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{trip.name}</h3>
                      <div className="mt-2 flex gap-4 items-center">
                        <div>
                          <label className="text-xs text-gray-600">
                            Driver:
                          </label>
                          <input
                            type="text"
                            value={trip.driver}
                            onChange={(e) =>
                              handleUpdateTrip(
                                trip.id,
                                "driver",
                                e.target.value
                              )
                            }
                            placeholder="Enter driver name"
                            className="block px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Date:</label>
                          <input
                            type="date"
                            value={trip.date}
                            onChange={(e) =>
                              handleUpdateTrip(trip.id, "date", e.target.value)
                            }
                            className="block px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Deliveries:</span>
                          <span className="font-bold ml-1">
                            {trip.orders.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {trip.status !== "completed" &&
                        trip.orders.length > 0 && (
                          <button
                            onClick={() => handleCompleteTrip(trip.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                          >
                            Complete Trip
                          </button>
                        )}
                    </div>
                  </div>

                  {trip.orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Truck size={48} className="mx-auto mb-3 text-gray-400" />
                      <p className="font-medium">No deliveries assigned yet</p>
                      <p className="text-sm mt-1">
                        Go to "Unassigned" tab to add deliveries to this trip
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {trip.orders.map((orderId, index) => {
                        const order = orders.find((o) => o.id === orderId);
                        if (!order) return null;

                        return (
                          <div
                            key={orderId}
                            className="flex items-center gap-3 p-4 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 transition"
                          >
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() =>
                                  handleReorderInTrip(trip.id, orderId, "up")
                                }
                                disabled={index === 0}
                                className="text-blue-600 hover:text-blue-800 disabled:text-gray-300 text-lg"
                              >
                                <ArrowUp size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  handleReorderInTrip(trip.id, orderId, "down")
                                }
                                disabled={index === trip.orders.length - 1}
                                className="text-blue-600 hover:text-blue-800 disabled:text-gray-300 text-lg"
                              >
                                <ArrowDown size={18} />
                              </button>
                            </div>

                            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0">
                              {index + 1}
                            </div>

                            <div className="flex-1">
                              <h4 className="font-bold">
                                {order.customer_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {order.customer_address}
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.order_items &&
                                order.order_items.length > 0
                                  ? order.order_items
                                      .map(
                                        (item) =>
                                          `${item.product} × ${item.quantity}`
                                      )
                                      .join(", ")
                                  : "No items"}{" "}
                                | Rp{" "}
                                {order.total_amount
                                  ? order.total_amount.toLocaleString()
                                  : "0"}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {order.customer_whatsapp && (
                                <a
                                  href={`https://wa.me/${
                                    order.customer_whatsapp
                                  }?text=${encodeURIComponent(
                                    `Halo ${order.customer_name}, kami dari ${order.branch} akan mengirim pesanan Anda pada tanggal ${trip.date}. Terima kasih!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1"
                                >
                                  <MessageCircle size={16} />
                                  <span className="text-sm">WhatsApp</span>
                                </a>
                              )}
                              {trip.status !== "completed" && (
                                <button
                                  onClick={() =>
                                    handleRemoveOrderFromTrip(orderId, trip.id)
                                  }
                                  className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

          {selectedTrip === null && (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <AlertCircle size={20} className="text-yellow-600" />
                  Unassigned Deliveries
                </h3>
                <p className="text-sm text-gray-700">
                  These orders are not assigned to any trip yet. Select a trip
                  from the dropdown to assign them.
                </p>
              </div>

              {getUnassignedOrders().length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle
                    size={48}
                    className="mx-auto mb-3 text-green-400"
                  />
                  <p className="font-medium">All deliveries are assigned!</p>
                  <p className="text-sm mt-1">
                    Great job organizing the routes
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getUnassignedOrders().map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-400 transition"
                    >
                      <div className="flex-1">
                        <h4 className="font-bold">{order.customer_name}</h4>
                        <p className="text-sm text-gray-600">
                          {order.customer_address}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.order_items && order.order_items.length > 0
                            ? order.order_items
                                .map(
                                  (item) => `${item.product} × ${item.quantity}`
                                )
                                .join(", ")
                            : "No items"}{" "}
                          | Rp{" "}
                          {order.total_amount
                            ? order.total_amount.toLocaleString()
                            : "0"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Delivery Date: {order.delivery_date}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {order.customer_whatsapp && (
                          <a
                            href={`https://wa.me/${
                              order.customer_whatsapp
                            }?text=${encodeURIComponent(
                              `Halo ${order.customer_name}, kami dari ${order.branch} akan mengirim pesanan Anda. Terima kasih!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}

                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddOrderToTrip(
                                order.id,
                                parseInt(e.target.value)
                              );
                              e.target.value = "";
                            }
                          }}
                          className="px-4 py-2 border-2 border-blue-600 rounded-lg bg-white text-blue-600 hover:bg-blue-50 font-medium cursor-pointer"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Assign to Trip →
                          </option>
                          {getFilteredTrips()
                            .filter((t) => t.status !== "completed")
                            .map((trip) => (
                              <option key={trip.id} value={trip.id}>
                                {trip.name} ({trip.orders.length} deliveries)
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
