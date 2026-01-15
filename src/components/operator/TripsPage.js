// components/operator/TripsPage.js - FIXED FOR UUID
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Truck, CheckCircle, MapPin, MessageCircle, Plus } from "lucide-react";

export default function OperatorTripsPage({ currentUser, orders, loadOrders }) {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get only MY branch's orders
  const myOrders = orders.filter((o) => {
    if (currentUser.branch === "All") return true;
    return o.branch === currentUser.branch;
  });

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      // Load shared trips (branch = 'Shared')
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("branch", "Shared")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading trips:", error);
        setTrips([]);
      } else {
        setTrips(data || []);
        if (data && data.length > 0 && !selectedTrip) {
          setSelectedTrip(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading trips:", error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewTrip = async () => {
    const tripNumber = trips.length + 1;
    const newTrip = {
      name: `Trip ${tripNumber}`,
      trip_date: new Date().toISOString().split("T")[0],
      driver: "",
      branch: "Shared",
      order_ids: [],
      status: "pending",
    };

    const { data, error } = await supabase
      .from("trips")
      .insert([newTrip])
      .select()
      .single();

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadTrips();
      setSelectedTrip(data.id);
    }
  };

  const getUnassignedOrders = () => {
    return myOrders.filter((order) => {
      const isAssigned = trips.some(
        (trip) => trip.order_ids && trip.order_ids.includes(order.id)
      );
      return order.status === "pending" && !isAssigned;
    });
  };

  const getTripOrders = (trip) => {
    if (!trip.order_ids || trip.order_ids.length === 0) return [];
    return myOrders.filter((order) => trip.order_ids.includes(order.id));
  };

  const getMyOrdersCount = (trip) => {
    if (!trip.order_ids || trip.order_ids.length === 0) return 0;
    return myOrders.filter((o) => trip.order_ids.includes(o.id)).length;
  };

  const handleAddOrderToTrip = async (orderId, tripId) => {
    console.log("Adding order:", orderId, "to trip:", tripId);
    console.log("Order ID type:", typeof orderId);
    console.log("Trip ID type:", typeof tripId);

    const trip = trips.find((t) => t.id === tripId);
    if (!trip) {
      console.error("Trip not found:", tripId);
      return;
    }

    const newOrderIds = [...(trip.order_ids || []), orderId];
    console.log("New order_ids array:", newOrderIds);

    const { error } = await supabase
      .from("trips")
      .update({ order_ids: newOrderIds, status: "in-progress" })
      .eq("id", tripId);

    if (error) {
      console.error("Error adding order to trip:", error);
      alert("Error: " + error.message);
    } else {
      await supabase
        .from("orders")
        .update({ status: "scheduled" })
        .eq("id", orderId);
      await loadTrips();
      await loadOrders(currentUser.branch);
    }
  };

  const handleRemoveOrderFromTrip = async (orderId, tripId) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newOrderIds = (trip.order_ids || []).filter((id) => id !== orderId);

    const { error } = await supabase
      .from("trips")
      .update({ order_ids: newOrderIds })
      .eq("id", tripId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await supabase
        .from("orders")
        .update({ status: "pending" })
        .eq("id", orderId);
      await loadTrips();
      await loadOrders(currentUser.branch);
    }
  };

  const handleCompleteTrip = async (tripId) => {
    const trip = trips.find((t) => t.id === tripId);
    const myTripOrders = getTripOrders(trip);

    if (myTripOrders.length === 0) {
      alert("No deliveries from your branch in this trip");
      return;
    }

    if (
      !window.confirm(
        `Complete your ${myTripOrders.length} deliveries in "${trip.name}"?`
      )
    ) {
      return;
    }

    for (const order of myTripOrders) {
      await supabase
        .from("orders")
        .update({ status: "delivered" })
        .eq("id", order.id);
    }

    const remainingOrders = (trip.order_ids || []).filter(
      (id) => !myTripOrders.find((o) => o.id === id)
    );

    await supabase
      .from("trips")
      .update({
        order_ids: remainingOrders,
        status: remainingOrders.length === 0 ? "completed" : "in-progress",
      })
      .eq("id", tripId);

    await loadTrips();
    await loadOrders(currentUser.branch);
    alert("Deliveries completed!");
  };

  const handleUpdateDriver = async (tripId, driverName) => {
    await supabase
      .from("trips")
      .update({ driver: driverName })
      .eq("id", tripId);
    await loadTrips();
  };

  const handleDeleteTrip = async (tripId) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    if (trip.order_ids && trip.order_ids.length > 0) {
      alert("Cannot delete trip with orders. Remove all orders first.");
      return;
    }

    if (!window.confirm(`Delete ${trip.name}?`)) return;

    const { error } = await supabase.from("trips").delete().eq("id", tripId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await loadTrips();
      setSelectedTrip(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const currentTrip = trips.find((t) => t.id === selectedTrip);
  const unassignedOrders = getUnassignedOrders();

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Delivery Trips</h2>
          <p className="text-sm text-gray-600 mt-1">
            {currentUser.branch} Branch
          </p>
        </div>
        <button
          onClick={handleCreateNewTrip}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} />
          New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Truck size={48} className="mx-auto mb-3 text-gray-400" />
          <p className="font-bold text-gray-600">No trips found</p>
          <p className="text-sm text-gray-500 mt-2">
            Click "New Trip" to create Trip 1
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
            <div className="flex border-b">
              {trips.map((trip) => {
                const myCount = getMyOrdersCount(trip);
                return (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip.id)}
                    className={`px-6 py-3 font-medium whitespace-nowrap ${
                      selectedTrip === trip.id
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck size={18} />
                      <span>{trip.name}</span>
                      {myCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          {myCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedTrip(null)}
                className={`px-6 py-3 font-medium whitespace-nowrap ${
                  selectedTrip === null
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Unassigned ({unassignedOrders.length})
              </button>
            </div>
          </div>

          {currentTrip ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{currentTrip.name}</h3>
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Driver:
                        </label>
                        <input
                          type="text"
                          value={currentTrip.driver || ""}
                          onChange={(e) =>
                            handleUpdateDriver(currentTrip.id, e.target.value)
                          }
                          placeholder="Enter driver name"
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <span className="ml-2 font-medium">
                            {currentTrip.trip_date}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Your Orders:</span>
                          <span className="ml-2 font-bold text-blue-600">
                            {getMyOrdersCount(currentTrip)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {getMyOrdersCount(currentTrip) > 0 && (
                      <button
                        onClick={() => handleCompleteTrip(currentTrip.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Complete
                      </button>
                    )}
                    {getMyOrdersCount(currentTrip) === 0 &&
                      currentTrip.order_ids?.length === 0 && (
                        <button
                          onClick={() => handleDeleteTrip(currentTrip.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                  </div>
                </div>
              </div>

              {getTripOrders(currentTrip).length > 0 ? (
                <div className="space-y-3">
                  {getTripOrders(currentTrip).map((order, index) => (
                    <div
                      key={order.id}
                      className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">
                            {order.customer_name}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
                            <MapPin
                              size={14}
                              className="mt-0.5 flex-shrink-0"
                            />
                            {order.customer_address}
                          </p>
                          <p className="text-sm font-medium text-green-600 mt-2">
                            Rp {order.total_amount?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {order.customer_whatsapp && (
                            <a
                              href={`https://wa.me/${order.customer_whatsapp}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                              <MessageCircle size={18} />
                              <span>WA</span>
                            </a>
                          )}
                          <button
                            onClick={() =>
                              handleRemoveOrderFromTrip(
                                order.id,
                                currentTrip.id
                              )
                            }
                            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <Truck size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="font-medium text-gray-600">
                    No orders from your branch
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Go to "Unassigned" to add orders
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900">Unassigned Orders</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {currentUser.branch} Branch - Assign orders to trips
                </p>
              </div>

              {unassignedOrders.length > 0 ? (
                <div className="space-y-3">
                  {unassignedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white p-4 rounded-lg shadow border"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">
                            {order.customer_name}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
                            <MapPin
                              size={14}
                              className="mt-0.5 flex-shrink-0"
                            />
                            {order.customer_address}
                          </p>
                          <div className="flex gap-3 mt-2 text-sm">
                            <span className="text-gray-600">
                              📅 {order.delivery_date}
                            </span>
                            <span className="font-medium text-green-600">
                              Rp {order.total_amount?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              // Trip ID is already a string (UUID), no need to parse
                              handleAddOrderToTrip(order.id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="px-4 py-2 border-2 border-blue-600 rounded-lg bg-white text-blue-600 hover:bg-blue-50 font-medium"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Assign →
                          </option>
                          {trips.map((trip) => (
                            <option key={trip.id} value={trip.id}>
                              {trip.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <CheckCircle
                    size={48}
                    className="mx-auto mb-3 text-green-400"
                  />
                  <p className="font-bold text-gray-600">
                    All orders assigned!
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
