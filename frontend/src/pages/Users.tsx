/**
 * =============================================================================
 * Users Page Component - User Management Interface (Admin Only)
 * =============================================================================
 * 
 * This component provides a user management interface for administrators to
 * create, edit, and delete system users. It implements role-based access
 * control (RBAC) to protect sensitive user data.
 * 
 * ACCESS CONTROL:
 *   - Only users with 'admin' role can access this page
 *   - Non-admin users see an "Access Denied" message
 *   - Admins cannot delete their own account (safety feature)
 * 
 * USER ROLES:
 *   - admin:    Full system access, can manage users
 *   - operator: Can control robots and view all data
 *   - viewer:   Read-only access to monitoring data
 * 
 * FEATURES:
 *   - User list with search functionality
 *   - Create new users with username, email, password, role
 *   - Edit existing user email, password, role
 *   - Delete users (with confirmation)
 *   - Visual role indicators (icons and colors)
 *   - Active/Inactive status display
 * 
 * SECURITY CONSIDERATIONS:
 *   - Passwords are hashed server-side (never sent back to client)
 *   - Username cannot be changed after creation
 *   - Self-deletion is prevented
 *   - All operations require valid admin JWT token
 * 
 * DATA FLOW:
 *   1. Component mounts → checks if current user is admin
 *   2. If admin, fetches user list from API
 *   3. CRUD operations call respective API endpoints
 *   4. Success/error messages shown via local state (not NotificationContext)
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React core - state management and lifecycle
import React, { useState, useEffect } from 'react';

// Lucide React icons - visual elements for user management
import { 
  Users as UsersIcon, // Main page header icon (aliased to avoid conflict)
  Plus,              // Add user button
  Edit2,             // Edit user button
  Trash2,            // Delete user button
  Search,            // Search input icon
  Shield,            // Admin role icon
  UserCheck,         // Operator role icon
  Eye,               // Viewer role icon
  X,                 // Modal close button
  Check,             // Success message icon
  AlertCircle        // Error/warning message icon
} from 'lucide-react';

// Internal utilities - API client and error handling
import { apiService, handleApiError } from '../utils/api';

// Authentication context - get current user for role checking
import { useAuth } from '../contexts/AuthContext';

// Theme context - dark/light mode support
import { useTheme } from '../contexts/ThemeContext';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Represents a user in the system
 * 
 * ROLE HIERARCHY:
 *   admin > operator > viewer
 * 
 * Note: password_hash is never sent from the server for security
 */
interface User {
  id: string;                            // Unique user identifier (UUID)
  username: string;                       // Login username (immutable)
  email: string;                          // User email address
  role: 'admin' | 'operator' | 'viewer'; // Access level
  is_active: boolean;                     // Account status
  created_at?: string;                    // Account creation timestamp
  updated_at?: string;                    // Last modification timestamp
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Users Component
 * 
 * Admin-only page for managing system users. Provides CRUD operations
 * for user accounts with role-based access control.
 */
const Users: React.FC = () => {
  // Get current user from auth context to check admin permission
  const { user: currentUser } = useAuth();
  
  // Access theme context for dark/light mode styling
  const { isDark } = useTheme();
  
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  
  // User list data
  const [users, setUsers] = useState<User[]>([]);
  
  // Loading state for initial fetch
  const [loading, setLoading] = useState(true);
  
  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal visibility states
  const [showAddModal, setShowAddModal] = useState(false);   // Add user modal
  const [showEditModal, setShowEditModal] = useState(false); // Edit user modal
  
  // Currently selected user for editing
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Feedback messages (displayed inline, not toast)
  const [error, setError] = useState('');    // Error message
  const [success, setSuccess] = useState(''); // Success message

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer' as 'admin' | 'operator' | 'viewer',
  });

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'viewer',
    });
    setError('');
    setSuccess('');
    setShowAddModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    });
    setError('');
    setSuccess('');
    setShowEditModal(true);
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      setSuccess(`User "${username}" deleted successfully`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(handleApiError(err));
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (showAddModal) {
        // Create new user
        if (!formData.password) {
          setError('Password is required for new users');
          return;
        }
        await apiService.createUser(formData);
        setSuccess('User created successfully');
        setShowAddModal(false);
      } else if (showEditModal && selectedUser) {
        // Update existing user
        const updateData: any = {};
        if (formData.email !== selectedUser.email) updateData.email = formData.email;
        if (formData.password) updateData.password = formData.password;
        if (formData.role !== selectedUser.role) updateData.role = formData.role;

        if (Object.keys(updateData).length > 0) {
          await apiService.updateUser(selectedUser.id, updateData);
          setSuccess('User updated successfully');
          setShowEditModal(false);
        }
      }
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(handleApiError(err));
      setTimeout(() => setError(''), 5000);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'operator':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return isDark ? 'bg-red-900/30 text-red-400 border-red-700' : 'bg-red-50 text-red-700 border-red-200';
      case 'operator':
        return isDark ? 'bg-blue-900/30 text-blue-400 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return isDark ? 'bg-gray-700/50 text-gray-400 border-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Only show to admins
  if (currentUser?.role !== 'admin') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center p-8 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Access Denied</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`mb-6 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <UsersIcon className="h-6 w-6" />
                User Management
              </h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Manage system users and their access levels
              </p>
            </div>
            <button
              onClick={handleAdd}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${isDark ? 'bg-red-900/30 border border-red-700 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${isDark ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-green-50 border border-green-200 text-green-700'}`}>
            <Check className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Search */}
        <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <UsersIcon className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {searchQuery ? 'No users found matching your search.' : 'No users found. Add your first user to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      User
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Role
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        <div className="font-medium">{user.username}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700') : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`}
                            title="Edit user"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(user.id, user.username)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
            <div className={`max-w-md w-full rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New User</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'operator' | 'viewer' })}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowEditModal(false)}>
            <div className={`max-w-md w-full rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit User</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    disabled
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Username cannot be changed</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'operator' | 'viewer' })}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
