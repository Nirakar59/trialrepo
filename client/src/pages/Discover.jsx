'use client';

import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, Users, Globe, Loader2, X } from 'lucide-react';
import UserCard from '../components/UserCard';
import Loading from '../components/Loading';
import API from '../api/api';

const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl bg-white/80 p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-3 w-20 rounded bg-slate-200" />
      </div>
    </div>
    <div className="mt-3 h-3 w-full rounded bg-slate-200" />
    <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
  </div>
);

export default function Discover() {
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // ---------- FETCH ----------
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get('/users/all', { withCredentials: true });
        setUsers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ---------- SEARCH ----------
  const deferredInput = useDeferredValue(input);
  const searchTerm = deferredInput.toLowerCase().trim();

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(u => {
      const n = u.fullname?.toLowerCase() ?? '';
      const uName = u.username?.toLowerCase() ?? '';
      const b = u.bio?.toLowerCase() ?? '';
      const l = u.location?.toLowerCase() ?? '';
      return n.includes(searchTerm) || uName.includes(searchTerm) || b.includes(searchTerm) || l.includes(searchTerm);
    });
  }, [users, searchTerm]);

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      {/* ---- Header ---- */}
      <header className="shrink-0 py-8 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight animate-fadeIn">
          Discover People
        </h1>
        <p className="mt-2 text-lg text-slate-600 max-w-2xl mx-auto animate-fadeIn animation-delay-200">
          Connect with amazing individuals and expand your network
        </p>
      </header>

      {/* ---- Search ---- */}
      <section className="shrink-0 max-w-2xl mx-auto w-full px-4 mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, username, bio, or location..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full pl-12 pr-12 py-4 text-base bg-white border border-slate-200 rounded-xl shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-slate-400 transition-all duration-200"
          />
          {input && (
            <button
              onClick={() => setInput('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Live stats */}
        {searchTerm && (
          <p className="mt-2 text-center text-sm text-slate-600 animate-fadeIn">
            Found{' '}
            <span className="font-semibold text-blue-600">{filteredUsers.length}</span>{' '}
            {filteredUsers.length === 1 ? 'result' : 'results'}
          </p>
        )}
      </section>

      {/* ---- Main Content (flex-grow) ---- */}
      <main className="flex-1 overflow-y-auto px-4 pb-8">
        {initialLoading ? (
          /* ---- Skeleton Grid ---- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          /* ---- Real Cards ---- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user, idx) => (
              <div
                key={user._id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-xl overflow-hidden">
                  <UserCard user={user} />
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          /* ---- No Search Results ---- */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl w-24 h-24 flex items-center justify-center mb-6">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No users found</h3>
            <p className="text-slate-600 max-w-md">
              Try different keywords – name, location, or bio.
            </p>
          </div>
        ) : (
          /* ---- Empty Network ---- */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl w-24 h-24 flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No users yet</h3>
            <p className="text-slate-600">Invite friends to grow the network!</p>
          </div>
        )}
      </main>

      {/* ---- Footer Hint ---- */}
      {!searchTerm && users.length > 0 && (
        <footer className="shrink-0 py-4 text-center text-sm text-slate-500">
          <Globe className="inline w-4 h-4 mr-1" />
          Showing {users.length} people in your network
        </footer>
      )}
    </div>
  );
}