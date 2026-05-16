import { useState, useEffect } from 'react';
import { Users, Search, Trash2, Shield, MessageSquare } from 'lucide-react';
import { getAllUsers, updateUserRole, deleteUser, getUserStats } from '../lib/adminApi';
import { Database } from '../lib/database.types';
import { RoleBadge } from './RoleBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { format } from 'date-fns';

type Athlete = Database['public']['Tables']['athletes']['Row'];

interface UserWithStats extends Athlete {
  chatCount?: number;
}

interface AdminUsersPanelProps {
  onSelectUser: (user: Athlete) => void;
}

export function AdminUsersPanel({ onSelectUser }: AdminUsersPanelProps) {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'delete' | 'promote' | 'demote' | null;
    user: Athlete | null;
  }>({ isOpen: false, action: null, user: null });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();

      const usersWithStats = await Promise.all(
        data.map(async (user) => {
          const stats = await getUserStats(user.id);
          return { ...user, chatCount: stats.chatCount };
        })
      );

      setUsers(usersWithStats);
      setFilteredUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const openConfirmDialog = (action: 'delete' | 'promote' | 'demote', user: Athlete) => {
    setConfirmDialog({ isOpen: true, action, user });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.user) return;

    switch (confirmDialog.action) {
      case 'delete':
        handleDeleteUser(confirmDialog.user.id);
        break;
      case 'promote':
        handleRoleChange(confirmDialog.user.id, 'admin');
        break;
      case 'demote':
        handleRoleChange(confirmDialog.user.id, 'user');
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'admin')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="user">Users Only</option>
            <option value="admin">Admins Only</option>
          </select>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sport / Goal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectUser(user)}
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div>{user.sport_type || '-'}</div>
                  <div className="text-xs text-gray-500">{user.fitness_goal || '-'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4" />
                    <span>{user.chatCount || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {user.role === 'user' ? (
                      <button
                        onClick={() => openConfirmDialog('promote', user)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Promote to Admin"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => openConfirmDialog('demote', user)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Demote to User"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openConfirmDialog('delete', user)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-12 h-12 mb-3 text-gray-300" />
            <p>No users found</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, user: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.action === 'delete'
            ? 'Delete User'
            : confirmDialog.action === 'promote'
            ? 'Promote to Admin'
            : 'Demote to User'
        }
        message={
          confirmDialog.action === 'delete'
            ? `Are you sure you want to delete ${confirmDialog.user?.name}? This will permanently remove all their data including chat history, metrics, and nutrition logs.`
            : confirmDialog.action === 'promote'
            ? `Are you sure you want to promote ${confirmDialog.user?.name} to admin? They will have access to all users' data and admin features.`
            : `Are you sure you want to demote ${confirmDialog.user?.name} to regular user? They will lose admin privileges.`
        }
        confirmText={confirmDialog.action === 'delete' ? 'Delete' : 'Confirm'}
        variant={confirmDialog.action === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
}
