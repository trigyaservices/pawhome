import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import StatusPill from '../../components/StatusPill';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setUsers(list);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.city?.toLowerCase().includes(term) ||
      u.country?.toLowerCase().includes(term)
    );
  });

  return (
    <section className="block">
      <div className="wrap">
        <div className="head">
          <div>
            <h1>Registered Users</h1>
            <p>Adopters and administrative personnel registered on Pawhome.</p>
          </div>
          <Link to="/admin" className="btn sm ghost">
            ← Dashboard
          </Link>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search users by name, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="panel">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>All Users ({filteredUsers.length})</h3>
          </div>

          {loading ? (
            <div style={{ padding: '20px 0' }}>
              <div className="skeleton" style={{ height: 50, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 50 }} />
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u) => {
              const joinedDate = u.createdAt?.seconds
                ? new Date(u.createdAt.seconds * 1000).toLocaleDateString()
                : 'Recent';

              return (
                <div key={u.uid} className="item">
                  <div
                    className="ico"
                    style={{
                      background: u.role === 'admin' ? 'var(--marigold)' : 'var(--mint)',
                      color: 'var(--ink)',
                      fontWeight: 800,
                      fontSize: 20
                    }}
                  >
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="grow">
                    <b>{u.name || 'User'}</b>
                    <small>
                      {u.email} {u.phone ? `· ${u.phone}` : ''} {u.city ? `· ${u.city}, ${u.country}` : ''}
                    </small>
                    <small style={{ color: 'var(--muted)', marginTop: 2 }}>Joined {joinedDate}</small>
                  </div>

                  <div>
                    {u.role === 'admin' ? (
                      <span className="pill" style={{ background: 'var(--marigold)', color: 'var(--ink)' }}>
                        Admin
                      </span>
                    ) : (
                      <span className="pill info">Adopter</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <p>No registered users found matching "{search}".</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
