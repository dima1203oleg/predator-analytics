import React from 'react';
import { Users, UserPlus, Shield, MoreHorizontal } from 'lucide-react';

export const UsersRoles: React.FC = () => {
    const users = [
        { id: 1, name: 'Admin User', email: 'admin@predator.ai', role: 'admin', lastLogin: 'Just now' },
        { id: 2, name: 'Analyst Pro', email: 'analyst@client.com', role: 'client_premium', lastLogin: '2 hours ago' },
        { id: 3, name: 'Basic Viewer', email: 'viewer@public.com', role: 'client_basic', lastLogin: '1 day ago' },
    ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-white">Користувачі та Ролі</h1>
         <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold">
            <UserPlus size={16} /> Додати користувача
         </button>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-left">
           <thead className="bg-slate-950 text-slate-500 text-xs uppercase font-bold">
              <tr>
                 <th className="p-4">User</th>
                 <th className="p-4">Role</th>
                 <th className="p-4">Last Login</th>
                 <th className="p-4 text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-800">
              {users.map(u => (
                 <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="p-4">
                       <div className="font-bold text-white">{u.name}</div>
                       <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 w-fit ${
                          u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                          u.role === 'client_premium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-blue-500/10 text-blue-400'
                       }`}>
                          <Shield size={12} /> {u.role}
                       </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">{u.lastLogin}</td>
                    <td className="p-4 text-right">
                       <button className="p-2 text-slate-400 hover:text-white"><MoreHorizontal size={18} /></button>
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};
