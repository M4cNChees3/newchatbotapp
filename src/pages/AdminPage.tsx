import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminUsersPanel } from '../components/AdminUsersPanel';
import { AdminChatViewer } from '../components/AdminChatViewer';
import { AdminKnowledgeBasePanel } from '../components/AdminKnowledgeBasePanel';
import { Users, MessageSquare, Database, Shield, LogOut, Home } from 'lucide-react';
import { Database as DB } from '../lib/database.types';
import { useNavigate } from 'react-router-dom';

type Athlete = DB['public']['Tables']['athletes']['Row'];

export function AdminPage() {
  const { signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'chats' | 'knowledge'>('users');
  const [selectedUser, setSelectedUser] = useState<Athlete | null>(null);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleSelectUser = (user: Athlete) => {
    setSelectedUser(user);
    setActiveTab('chats');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage users, chats, and knowledge base</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>User Management</span>
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'chats'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat History</span>
            </button>

            <button
              onClick={() => setActiveTab('knowledge')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'knowledge'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Knowledge Base</span>
            </button>
          </div>
        </nav>

        <main className="flex-1 overflow-hidden">
          {activeTab === 'users' && <AdminUsersPanel onSelectUser={handleSelectUser} />}
          {activeTab === 'chats' && (
            <AdminChatViewer 
              selectedUser={selectedUser} 
              onClearSelection={() => setSelectedUser(null)} 
            />
          )}
          {activeTab === 'knowledge' && <AdminKnowledgeBasePanel />}
        </main>
      </div>
    </div>
  );
}
