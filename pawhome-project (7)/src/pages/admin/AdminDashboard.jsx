import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import StatusPill from '../../components/StatusPill';
import { PET_TINTS, PET_ICONS } from '../../components/PetCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    availablePets: 0,
    pendingApps: 0,
    adoptedPets: 0,
    pendingReports: 0
  });
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true);

        const petsSnap = await getDocs(collection(db, 'pets'));
        const petsList = petsSnap.docs.map((d) => d.data());
        const available = petsList.filter((p) => p.status === 'Available').length;
        const adopted = petsList.filter((p) => p.status === 'Adopted').length;

        const appsSnap = await getDocs(collection(db, 'applications'));
        const appsList = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const pending = appsList.filter((a) => a.status === 'pending').length;

        const reportsSnap = await getDocs(collection(db, 'reports'));
        const reportsList = reportsSnap.docs.map((d) => d.data());
        const waitingRep = reportsList.filter((r) => r.status === 'waiting').length;

        setStats({
          availablePets: available,
          pendingApps: pending,
          adoptedPets: adopted,
          pendingReports: waitingRep
        });

        // Sort recent applications
        const sorted = [...appsList].sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setRecentApps(sorted.slice(0, 5));
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardStats();
  }, []);

  // Mock / dynamic monthly adoption activity data for chart
  const monthsData = [
    { month: 'May', count: 4 },
    { month: 'Jun', count: 7 },
    { month: 'Jul', count: 9 },
    { month: 'Aug', count: 12 },
    { month: 'Sep', count: 15 },
    { month: 'Oct', count: Math.max(stats.adoptedPets, 18) }
  ];
  const maxCount = Math.max(...monthsData.map((m) => m.count), 20);

  return (
    <section className="block">
      <div className="wrap">
        <div className="head">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Pet listings, applications, welfare follow-ups, and adoption analytics.</p>
          </div>
          <div className="acts">
            <Link to="/admin/pets" className="btn sm alt">
              Manage Pets
            </Link>
            <Link to="/admin/applications" className="btn sm">
              Review Applications
            </Link>
          </div>
        </div>

        {/* Top KPI Stat Cards */}
        <div className="stats">
          <div className="stat">
            <b>{loading ? '...' : stats.availablePets}</b>
            <span>Pets available</span>
          </div>
          <div className="stat hot">
            <b>{loading ? '...' : stats.pendingApps}</b>
            <span>Applications to review</span>
          </div>
          <div className="stat">
            <b>{loading ? '...' : stats.adoptedPets}</b>
            <span>Pets adopted</span>
          </div>
          <div className="stat">
            <b>{loading ? '...' : stats.pendingReports}</b>
            <span>Monthly updates pending</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tabs" role="tablist">
          <Link to="/admin" className="active">Overview</Link>
          <Link to="/admin/applications">Applications</Link>
          <Link to="/admin/pets">Pets</Link>
          <Link to="/admin/reports">Monthly Updates</Link>
          <Link to="/admin/adoptions">Adoptions</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/settings">Settings</Link>
        </div>

        {/* Analytics Chart & Recent Section */}
        <div className="panel">
          <h3>Monthly Adoptions Growth (2026)</h3>
          <p className="meta" style={{ marginBottom: 20 }}>
            Visualizing finalized adoptions across our India and international rescue network.
          </p>

          <div
            style={{
              height: 200,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 24,
              padding: '16px 12px 0',
              borderBottom: '2px solid var(--line)',
              overflowX: 'auto'
            }}
          >
            {monthsData.map((item) => {
              const heightPct = Math.round((item.count / maxCount) * 100);
              return (
                <div
                  key={item.month}
                  style={{
                    flex: 1,
                    minWidth: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>
                    {item.count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 44,
                      height: `${heightPct}%`,
                      background: item.month === 'Oct' ? 'var(--marigold)' : 'var(--forest)',
                      borderRadius: '8px 8px 0 0',
                      transition: 'height 0.4s ease'
                    }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Applications Panel */}
        <div className="panel">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Recent Applications</h3>
            <Link to="/admin/applications" className="meta" style={{ fontWeight: 700, color: 'var(--forest)' }}>
              View all ({stats.pendingApps} pending) →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '16px 0' }}>
              <div className="skeleton" style={{ height: 48, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 48 }} />
            </div>
          ) : recentApps.length > 0 ? (
            recentApps.map((a) => {
              const petType = (a.petType || 'dog').toLowerCase();
              const bgTint = PET_TINTS[petType] || PET_TINTS.other;
              const icon = PET_ICONS[petType] || PET_ICONS.other;
              const appliedDate = a.createdAt?.seconds
                ? new Date(a.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short'
                  })
                : 'Recent';

              return (
                <div key={a.id} className="item">
                  <div className="ico" style={{ background: bgTint }}>
                    {icon}
                  </div>
                  <div className="grow">
                    <b>{a.fullName}</b> wants <b>{a.petName || 'Pet'}</b>
                    <small>
                      {a.city}, {a.country} · applied {appliedDate}
                    </small>
                  </div>
                  <StatusPill status={a.status} />
                  <div className="acts">
                    <Link to="/admin/applications" className="btn sm ghost">
                      Review
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <p>No applications received yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
