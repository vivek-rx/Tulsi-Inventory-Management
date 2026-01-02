import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, UserPlus, Trash2, ShieldCheck, Shield, AlertCircle, Loader2 } from 'lucide-react';

interface SystemUser {
    id: number;
    username: string;
    full_name: string;
    role: 'admin' | 'operator';
    is_active: boolean;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [newUser, setNewUser] = useState({
        username: '',
        full_name: '',
        password: '',
        role: 'operator'
    });

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
            setError('');
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError('');

        try {
            await axios.post('/api/users', newUser);
            await fetchUsers();
            setNewUser({ username: '', full_name: '', password: '', role: 'operator' }); // Reset form
            // Show success toast ideally
        } catch (err: any) {
            console.error('Failed to create user:', err);
            setError(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await axios.delete(`/api/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err: any) {
            console.error('Failed to delete user:', err);
            setError(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create User Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-600" />
                            Add New User
                        </h3>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.full_name}
                                    onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g. john.doe"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Role
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({ ...newUser, role: 'operator' })}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${newUser.role === 'operator'
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Operator
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${newUser.role === 'admin'
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Admin
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                Create User
                            </button>
                        </form>
                    </div>
                </div>

                {/* User List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">System Users</h3>
                            <p className="text-sm text-slate-500">Manage access and permissions</p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {users.map((user) => (
                                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${user.role === 'admin'
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{user.full_name}</h4>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-slate-500">@{user.username}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className={`inline-flex items-center gap-1 font-medium ${user.role === 'admin' ? 'text-indigo-600' : 'text-blue-600'
                                                    }`}>
                                                    {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                                    <span className="capitalize">{user.role}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete User"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}

                            {users.length === 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    No users found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
