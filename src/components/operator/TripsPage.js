// components/operator/TripsPage.js - MOBILE OPTIMIZED
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Truck, CheckCircle, MapPin, MessageCircle, Plus, Camera, X } from "lucide-react";

export default function OperatorTripsPage({
  currentUser,
  orders,
  loadOrders,
}) {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Delivery confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const myOrders = orders.filter(o => {
    if (currentUser.branch === "All") return true;
    return o.branch === currentUser.branch;
  });

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("branch", "Shared")
        .order("name", { ascending: true});

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
      trip_date: new Date().toISOString().split('T')[0],
      driver: "",
      branch: "Shared",
      order_ids: [],
      status: "pending"
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
      const isAssigned = trips.some((trip) =>
        trip.order_ids && trip.order_ids.includes(order.id)
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
    return myOrders.filter(o => trip.order_ids.includes(o.id)).length;
  };

  const handleAddOrderToTrip = async (orderId, tripId) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newOrderIds = [...(trip.order_ids || []), orderId];

    const { error } = await supabase
      .from("trips")
      .update({ order_ids: newOrderIds, status: "in-progress" })
      .eq("id", tripId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      await supabase.from("orders").update({ status: "scheduled" }).eq("id", orderId);
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
      await supabase.from("orders").update({ status: "pending" }).eq("id", orderId);
      await loadTrips();
      await loadOrders(currentUser.branch);
    }
  };

  const handleOpenConfirmModal = (order) => {
    setConfirmingOrder(order);
    setDeliveryPhoto(null);
    setDeliveryPhotoPreview(null);
    setShowConfirmModal(true);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDeliveryPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeliveryPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryPhoto) {
      alert("Please take a photo of the delivery");
      return;
    }

    setUploadingPhoto(true);

    try {
      const fileExt = deliveryPhoto.name.split('.').pop();
      const fileName = `delivery_${confirmingOrder.id}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('delivery-evidence')
        .upload(filePath, deliveryPhoto);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Error uploading photo. Using base64 instead.");
        
        await supabase
          .from("orders")
          .update({
            status: "delivered",
            delivery_evidence: deliveryPhotoPreview,
            delivered_date: new Date().toISOString().split('T')[0],
          })
          .eq("id", confirmingOrder.id);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('delivery-evidence')
          .getPublicUrl(filePath);

        await supabase
          .from("orders")
          .update({
            status: "delivered",
            delivery_evidence: publicUrl,
            delivered_date: new Date().toISOString().split('T')[0],
          })
          .eq("id", confirmingOrder.id);
      }

      const trip = trips.find(t => t.order_ids && t.order_ids.includes(confirmingOrder.id));
      if (trip) {
        const newOrderIds = trip.order_ids.filter(id => id !== confirmingOrder.id);
        await supabase
          .from("trips")
          .update({ order_ids: newOrderIds })
          .eq("id", trip.id);
      }

      await loadTrips();
      await loadOrders(currentUser.branch);
      
      setShowConfirmModal(false);
      setConfirmingOrder(null);
      alert("Delivery confirmed!");
    } catch (error) {
      console.error("Error confirming delivery:", error);
      alert("Error: " + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateDriver = async (tripId, driverName) => {
    await supabase.from("trips").update({ driver: driverName }).eq("id", tripId);
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
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  const currentTrip = trips.find((t) => t.id === selectedTrip);
  const unassignedOrders = getUnassignedOrders();

  return (
    <div className="p-3 space-y-3">
      {/* Header - Compact */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Delivery Trips</h2>
          <p className="text-xs text-gray-600">{currentUser.branch}</p>
        </div>
        <button
          onClick={handleCreateNewTrip}
          className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      {/* Delivery Confirmation Modal - Mobile Optimized */}
      {showConfirmModal && confirmingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold">Confirm Delivery</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="font-bold text-sm">{confirmingOrder.customer_name}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{confirmingOrder.customer_address}</p>
                <p className="text-xs font-medium text-green-600 mt-1">
                  Rp {confirmingOrder.total_amount?.toLocaleString() || 0}
                </p>
              </div>

              {/* Photo Upload - Compact */}
              <div>
                <label className="block text-xs font-bold mb-2">
                  Delivery Photo * (Required)
                </label>
                
                {!deliveryPhotoPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer bg-blue-50">
                    <Camera size={40} className="text-blue-600 mb-2" />
                    <p className="text-xs text-blue-600 font-medium">Take Photo</p>
                    <p className="text-xs text-gray-500 mt-1">or choose from gallery</p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={deliveryPhotoPreview}
                      alt="Delivery"
                      className="w-full h-48 object-cover rounded-lg border-2 border-green-400"
                    />
                    <button
                      onClick={() => {
                        setDeliveryPhoto(null);
                        setDeliveryPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Buttons - Mobile Friendly */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleConfirmDelivery}
                  disabled={!deliveryPhoto || uploadingPhoto}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm"
                >
                  {uploadingPhoto ? (
                    "Uploading..."
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirm
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 bg-gray-300 text-gray-700 py-2.5 rounded-lg font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <Truck size={40} className="mx-auto mb-2 text-gray-400" />
          <p className="font-bold text-gray-600 text-sm">No trips found</p>
          <p className="text-xs text-gray-500 mt-1">Click "New" to create Trip 1</p>
        </div>
      ) : (
        <>
          {/* Trip Tabs - Mobile Scrollable */}
          <div className="bg-white shadow-sm rounded-lg overflow-x-auto -mx-3 px-3">
            <div className="flex border-b gap-1">
              {trips.map((trip) => {
                const myCount = getMyOrdersCount(trip);
                return (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip.id)}
                    className={`px-4 py-2 font-medium whitespace-nowrap text-xs ${
                      selectedTrip === trip.id
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                        : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Truck size={14} />
                      <span>{trip.name}</span>
                      {myCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          {myCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedTrip(null)}
                className={`px-4 py-2 font-medium whitespace-nowrap text-xs ${
                  selectedTrip === null
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600"
                }`}
              >
                Unassigned ({unassignedOrders.length})
              </button>
            </div>
          </div>

          {currentTrip ? (
            <div className="space-y-3">
              {/* Trip Header - Compact */}
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-base">{currentTrip.name}</h3>
                    {getMyOrdersCount(currentTrip) === 0 && currentTrip.order_ids?.length === 0 && (
                      <button
                        onClick={() => handleDeleteTrip(currentTrip.id)}
                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600">Driver:</label>
                    <input
                      type="text"
                      value={currentTrip.driver || ""}
                      onChange={(e) => handleUpdateDriver(currentTrip.id, e.target.value)}
                      placeholder="Enter driver name"
                      className="w-full px-2 py-1.5 border rounded text-sm mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-3 text-xs">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-1 font-medium">{currentTrip.trip_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Orders:</span>
                      <span className="ml-1 font-bold text-blue-600">{getMyOrdersCount(currentTrip)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Orders - Mobile Optimized */}
              {getTripOrders(currentTrip).length > 0 ? (
                <div className="space-y-2">
                  {getTripOrders(currentTrip).map((order, index) => (
                    <div key={order.id} className="bg-white p-3 rounded-lg shadow border-l-4 border-blue-500">
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm">{order.customer_name}</h4>
                          <p className="text-xs text-gray-600 flex items-start gap-1 mt-1">
                            <MapPin size={10} className="mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{order.customer_address}</span>
                          </p>
                          <p className="text-xs font-medium text-green-600 mt-1">
                            Rp {order.total_amount?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons - Stacked on Mobile */}
                      <div className="flex gap-2 mt-2">
                        {order.customer_whatsapp && (
                          <a
                            href={`https://wa.me/${order.customer_whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 text-xs"
                          >
                            <MessageCircle size={14} />
                            WA
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenConfirmModal(order)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1 font-medium text-xs"
                        >
                          <Camera size={14} />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleRemoveOrderFromTrip(order.id, currentTrip.id)}
                          className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 font-medium text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <Truck size={40} className="mx-auto mb-2 text-gray-400" />
                  <p className="font-medium text-gray-600 text-sm">No orders assigned</p>
                  <p className="text-xs text-gray-500 mt-1">Go to "Unassigned" tab</p>
                </div>
              )}
            </div>
          ) : (
            /* Unassigned Orders - Mobile Optimized */
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900 text-sm">Unassigned Orders</h3>
                <p className="text-xs text-blue-700 mt-1">
                  {currentUser.branch} - Assign to trips
                </p>
              </div>

              {unassignedOrders.length > 0 ? (
                <div className="space-y-2">
                  {unassignedOrders.map((order) => (
                    <div key={order.id} className="bg-white p-3 rounded-lg shadow border">
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-bold text-sm">{order.customer_name}</h4>
                          <p className="text-xs text-gray-600 flex items-start gap-1 mt-1">
                            <MapPin size={10} className="mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{order.customer_address}</span>
                          </p>
                          <div className="flex gap-2 mt-1 text-xs">
                            <span className="text-gray-600">📅 {order.delivery_date}</span>
                            <span className="font-medium text-green-600">
                              Rp {order.total_amount?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                        
                        {/* Full Width Dropdown */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddOrderToTrip(order.id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="w-full px-3 py-2 border-2 border-blue-600 rounded-lg bg-white text-blue-600 font-medium text-sm"
                          defaultValue=""
                        >
                          <option value="" disabled>Assign to Trip →</option>
                          {trips.map((trip) => (
                            <option key={trip.id} value={trip.id}>
                              {trip.name} ({getMyOrdersCount(trip)} orders)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <CheckCircle size={40} className="mx-auto mb-2 text-green-400" />
                  <p className="font-bold text-gray-600 text-sm">All orders assigned!</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
