// components/AdminModule.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Building, Package, UserPlus } from 'lucide-react';

export default function AdminModule({ currentUser, branches, products, users, loadBranches, loadProducts, loadUsers }) {
  // UI states
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });
  const [newProduct, setNewProduct] = useState({ name: '', price: '', unit: 'gallon', is_refill: false });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'sales', branch: 'Jakarta' });

  // Branch CRUD
  const handleAddBranch = async () => {
    if (!newBranch.name || !newBranch.address || !newBranch.phone) {
      alert('Please fill all fields');
      return;
    }

    if (editingBranch) {
      const { error } = await supabase.from('branches').update(newBranch).eq('id', editingBranch.id);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        await loadBranches();
        setEditingBranch(null);
        setNewBranch({ name: '', address: '', phone: '' });
        setShowBranchForm(false);
        alert('Branch updated!');
      }
    } else {
      const { error } = await supabase.from('branches').insert([newBranch]);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        await loadBranches();
        setNewBranch({ name: '', address: '', phone: '' });
        setShowBranchForm(false);
        alert('Branch created!');
      }
    }
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setNewBranch({ name: branch.name, address: branch.address, phone: branch.phone });
    setShowBranchForm(true);
  };

  const handleDeleteBranch = async (id) => {
    if (!confirm('Delete this branch? This cannot be undone.')) return;
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadBranches();
      alert('Branch deleted!');
    }
  };

  const toggleBranchStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('branches').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadBranches();
    }
  };

  // Product CRUD
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.unit) {
      alert('Please fill all fields');
      return;
    }

    const productData = { ...newProduct, price: parseInt(newProduct.price) };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        await loadProducts();
        setEditingProduct(null);
        setNewProduct({ name: '', price: '', unit: 'gallon', is_refill: false });
        setShowProductForm(false);
        alert('Product updated!');
      }
    } else {
      const { error } = await supabase.from('products').insert([productData]);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        await loadProducts();
        setNewProduct({ name: '', price: '', unit: 'gallon', is_refill: false });
        setShowProductForm(false);
        alert('Product created!');
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({ name: product.name, price: product.price, unit: product.unit, is_refill: product.is_refill });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadProducts();
      alert('Product deleted!');
    }
  };

  const toggleProductStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadProducts();
    }
  };

  // User Management
  const handleEditUserProfile = (user) => {
    setEditingUser(user);
    setNewUser({ name: user.name, email: user.email, role: user.role, branch: user.branch });
    setShowUserForm(true);
  };

  const handleUpdateUserProfile = async () => {
    if (!newUser.name || !newUser.role || !newUser.branch) {
      alert('Please fill all fields');
      return;
    }

    const updateData = { name: newUser.name, role: newUser.role, branch: newUser.branch };
    const { error } = await supabase.from('profiles').update(updateData).eq('id', editingUser.id);
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadUsers(currentUser.branch);
      setEditingUser(null);
      setNewUser({ name: '', email: '', role: 'sales', branch: 'Jakarta' });
      setShowUserForm(false);
      alert('User updated!');
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadUsers(currentUser.branch);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
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
              setNewBranch({ name: '', address: '', phone: '' });
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
            <h4 className="font-bold">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h4>
            <input
              type="text"
              placeholder="Branch Name *"
              value={newBranch.name}
              onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Address *"
              value={newBranch.address}
              onChange={(e) => setNewBranch({...newBranch, address: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Phone *"
              value={newBranch.phone}
              onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddBranch}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition"
              >
                {editingBranch ? 'Update Branch' : 'Add Branch'}
              </button>
              <button
                onClick={() => {
                  setShowBranchForm(false);
                  setEditingBranch(null);
                  setNewBranch({ name: '', address: '', phone: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {branches.map(branch => (
            <div key={branch.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition">
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
                  onClick={() => toggleBranchStatus(branch.id, branch.status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(branch.status)}`}
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
              setNewProduct({ name: '', price: '', unit: 'gallon', is_refill: false });
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
            <h4 className="font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h4>
            <input
              type="text"
              placeholder="Product Name *"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Price (Rp) *"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <select
              value={newProduct.unit}
              onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
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
                onChange={(e) => setNewProduct({...newProduct, is_refill: e.target.checked})}
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
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  setNewProduct({ name: '', price: '', unit: 'gallon', is_refill: false });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {products.map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg">{product.name}</p>
                  {product.is_refill && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">Refill</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Rp {product.price.toLocaleString()} / {product.unit}</p>
                {product.is_refill && (
                  <p className="text-xs text-orange-600 mt-1">* Customer discount applies</p>
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
                  onClick={() => toggleProductStatus(product.id, product.status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}
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
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="sales">Sales</option>
              <option value="operator">Operator</option>
              <option value="finance">Finance</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={newUser.branch}
              onChange={(e) => setNewUser({...newUser, branch: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {branches.filter(b => b.status === 'active').map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
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
                  setNewUser({ name: '', email: '', role: 'sales', branch: 'Jakarta' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition">
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
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}
                >
                  {user.status}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
