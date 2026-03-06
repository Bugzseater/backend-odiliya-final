import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  UserPlus, Users, Mail, Lock, User, Shield,
  Trash2, Edit3, Loader2, X, Check, Search,
  Filter, Copy, AlertCircle, Key,
  UserCheck, UserCog, Calendar, Clock,
  ChevronDown, ChevronUp, RefreshCw, Eye, EyeOff
} from 'lucide-react';

// Define User type
interface AppUser {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer' | 'data-entry';
  createdAt?: any;
  lastLogin?: any;
  status: 'active' | 'inactive';
}

const ClientManagement: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    form: true,
    list: true
  });

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'data-entry' as 'admin' | 'editor' | 'viewer' | 'data-entry',
    status: 'active' as 'active' | 'inactive'
  });

  // Fetch users in real-time
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppUser[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate email format
      if (!formData.email.includes('@')) {
        alert('Please enter a valid email address');
        setSubmitting(false);
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        setSubmitting(false);
        return;
      }

      const userData = {
        ...formData,
        createdAt: serverTimestamp(),
        lastLogin: null,
      };

      if (editId) {
        // Update existing user
        await updateDoc(doc(db, "users", editId), {
          ...userData,
          updatedAt: serverTimestamp()
        });
        alert('User updated successfully! ✅');
      } else {
        // Create new user
        await addDoc(collection(db, "users"), userData);
        alert('User created successfully! ✅');
      }

      // Reset form
      resetForm();
    } catch (error: any) {
      console.error("Error saving user:", error);
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditId(user.id);
    setFormData({
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role,
      status: user.status
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, "users", id));
      } catch (error) {
        console.error("Error deleting user:", error);
        alert('Failed to delete user');
      }
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'data-entry',
      status: 'active'
    });
    setShowForm(false);
    setShowPassword(false);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(field);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const generatePassword = () => {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, icon, section, count }: any) => (
    <div 
      className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-transparent border-b border-gray-100 cursor-pointer hover:from-orange-100 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 bg-orange-100 rounded-lg">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {count !== undefined && (
          <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
            {count}
          </span>
        )}
      </div>
      <button className="p-1 hover:bg-white rounded-lg transition-colors">
        {expandedSections[section] ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </button>
    </div>
  );

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'editor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'viewer': return 'bg-green-100 text-green-700 border-green-200';
      case 'data-entry': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' 
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    if (timestamp?.toDate) {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
    return 'Unknown';
  };

  // Function to handle add user button click
  const handleAddUserClick = () => {
    resetForm(); // Reset form first
    setShowForm(true); // Then show the form
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Users className="text-orange-600" size={32} />
                Client Management
              </h1>
              <p className="text-gray-500">Create and manage system users and their permissions</p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-3">
              <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Users</p>
                <p className="text-xl font-bold text-gray-800">{users.length}</p>
              </div>
              <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Active</p>
                <p className="text-xl font-bold text-emerald-600">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
              <button
                onClick={handleAddUserClick}
                className="flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/25"
              >
                <UserPlus size={20} />
                <span className="hidden sm:inline">Add User</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-4 bg-gradient-to-r from-orange-50 to-transparent border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UserPlus size={18} className="text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-800">{editId ? 'Edit User' : 'Create New User'}</h3>
              </div>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <User size={14} className="text-gray-400" />
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Enter username"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Mail size={14} className="text-gray-400" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Lock size={14} className="text-gray-400" />
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none pr-24"
                        placeholder="••••••••"
                        required={!editId}
                        minLength={6}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg transition-colors"
                          title="Generate password"
                        >
                          <Key size={16} />
                        </button>
                      </div>
                    </div>
                    {!editId && (
                      <p className="text-xs text-gray-400">Minimum 6 characters</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Shield size={14} className="text-gray-400" />
                      User Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      required
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                      <option value="data-entry">Data Entry</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <UserCheck size={14} className="text-gray-400" />
                      Account Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Role Description */}
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Role Permissions
                  </h4>
                  <div className="text-xs text-orange-700 space-y-1">
                    {formData.role === 'admin' && (
                      <p>• Full access to all features • Can manage users • All permissions</p>
                    )}
                    {formData.role === 'editor' && (
                      <p>• Can create and edit content • Cannot manage users • No delete permissions</p>
                    )}
                    {formData.role === 'viewer' && (
                      <p>• Read-only access • Can view all data • Cannot make changes</p>
                    )}
                    {formData.role === 'data-entry' && (
                      <p>• Can add new records • Can edit own entries • Limited access</p>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {editId ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {editId ? <Edit3 size={18} /> : <UserPlus size={18} />}
                        {editId ? 'Update User' : 'Create User'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-orange-50 to-transparent border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users size={18} className="text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800">System Users</h3>
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                {filteredUsers.length}
              </span>
            </div>
          </div>
          
          <>
            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="relative w-full sm:w-48">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                    <option value="data-entry">Data Entry</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="animate-spin text-orange-600 w-10 h-10 mb-4" />
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex p-4 bg-orange-50 rounded-full mb-4">
                  <Users size={48} className="text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Users Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterRole !== 'all' 
                    ? 'No users match your search criteria'
                    : 'Get started by creating your first user'}
                </p>
                {(searchTerm || filterRole !== 'all') && (
                  <button
                    onClick={() => { setSearchTerm(''); setFilterRole('all'); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <X size={16} />
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="bg-white rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all overflow-hidden group"
                  >
                    {/* User Header */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-full ${
                            user.role === 'admin' ? 'bg-red-100' :
                            user.role === 'editor' ? 'bg-blue-100' :
                            user.role === 'viewer' ? 'bg-green-100' :
                            'bg-orange-100'
                          }`}>
                            <UserCog size={20} className={
                              user.role === 'admin' ? 'text-red-600' :
                              user.role === 'editor' ? 'text-blue-600' :
                              user.role === 'viewer' ? 'text-green-600' :
                              'text-orange-600'
                            } />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{user.username}</h3>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopy(user.email, `email-${user.id}`)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Copy email"
                          >
                            {copySuccess === `email-${user.id}` ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="p-4 space-y-3">
                      {/* Role & Status */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </span>
                      </div>

                      {/* Created At */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>Created: {formatDate(user.createdAt)}</span>
                      </div>

                      {/* Last Login */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        <span>Last login: {formatDate(user.lastLogin)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;