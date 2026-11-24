import { useMemo, useState, type FormEvent } from 'react';
import { BookingsPage } from './pages/BookingsPage';
import { ProfessionalsPage } from './pages/ProfessionalsPage';
import { AllocationSchedulePage } from './pages/AllocationSchedulePage';
import { InventoryQualityPage } from './pages/InventoryQualityPage';
import { AnalyticsInsightsPage } from './pages/AnalyticsInsightsPage';
import { readOperationsData, resetOperationsData, writeOperationsData } from './services/storage';
import type { BookingStatus, OperationsData } from './types/domain';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  Command,
  LayoutDashboard,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  Trash2,
  Users,
  X,
  Package,
  Route,
  BarChart3,
  Lightbulb,
} from 'lucide-react';

type WorkStatus = 'Open' | 'In progress' | 'Completed';
type Priority = 'Standard' | 'High' | 'Urgent';
type WorkOrder = {
  id: string;
  title: string;
  location: string;
  team: string;
  due: string;
  priority: Priority;
  status: WorkStatus;
};
type Page =
  | 'Overview'
  | 'Bookings'
  | 'Professionals'
  | 'Allocation'
  | 'Schedule'
  | 'Inventory'
  | 'Quality'
  | 'Analytics'
  | 'Insights';
type StatusFilter = 'All' | WorkStatus;

function dateLabel() {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function App() {
  const [operations, setOperations] = useState<OperationsData>(readOperationsData);
  const [page, setPage] = useState<Page>('Overview');
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const openCount = operations.bookings.filter((booking) =>
    ['Booking Received', 'Confirmed'].includes(booking.status),
  ).length;
  const activeCount = operations.bookings.filter((booking) =>
    ['Professional Assigned', 'Professional En Route', 'Service Started'].includes(booking.status),
  ).length;
  const completedCount = operations.bookings.filter((booking) => booking.status === 'Service Completed').length;
  const urgentCount = operations.bookings.filter((booking) =>
    booking.category === 'Plumbing' && booking.status !== 'Service Completed' && booking.status !== 'Cancelled',
  ).length;

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const adapted = operations.bookings.map((booking) => ({
      id: booking.id,
      title: booking.serviceName,
      location: operations.locations.find((item) => item.id === booking.locationId)?.area ?? 'Unknown area',
      team: operations.professionals.find((item) => item.id === booking.professionalId)?.name ?? 'Unassigned',
      due: new Date(booking.scheduledAt).toLocaleString('en-IN'),
      priority: (booking.category === 'Plumbing' ? 'Urgent' : 'Standard') as Priority,
      status: (booking.status === 'Service Completed'
        ? 'Completed'
        : ['Professional Assigned', 'Professional En Route', 'Service Started'].includes(booking.status)
          ? 'In progress'
          : 'Open') as WorkStatus,
    }));
    return adapted.filter((order) => {
      const matchesStatus = filter === 'All' || order.status === filter;
      const matchesQuery =
        !normalizedQuery ||
        [order.id, order.title, order.location, order.team].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      return matchesStatus && matchesQuery;
    });
  }, [filter, operations, query]);

  function saveOperations(nextData: OperationsData, noticeText = '') {
    setOperations(nextData);
    const result = writeOperationsData(nextData);
    if (result.ok) {
      setNotice('');
      if (noticeText) setNotice(noticeText);
    } else {
      setNotice('Changes are visible now but could not be saved in this browser.');
    }
  }

  function updateStatus(id: string) {
    const sequence: BookingStatus[] = [
      'Booking Received', 'Confirmed', 'Professional Assigned',
      'Professional En Route', 'Service Started', 'Service Completed',
    ];
    saveOperations({
      ...operations,
      bookings: operations.bookings.map((booking) => {
        if (booking.id !== id) return booking;
        const index = sequence.indexOf(booking.status);
        const status: BookingStatus = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : 'Booking Received';
        return { ...booking, status };
      }),
    });
  }

  function deleteOrder(id: string) {
    const booking = operations.bookings.find((item) => item.id === id);
    if (!booking || !window.confirm(`Delete "${booking.serviceName}"? This cannot be undone.`)) return;
    saveOperations({
      ...operations,
      bookings: operations.bookings.filter((item) => item.id !== id),
      scheduleAssignments: operations.scheduleAssignments.filter((item) => item.bookingId !== id),
    });
  }

  function addOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const locationId = String(formData.get('location') ?? operations.locations[0]?.id);
    const category = String(formData.get('category') ?? 'Cleaning');
    const estimatedCost = Number(formData.get('cost') ?? 800);
    const due = String(formData.get('due') ?? '').trim();
    if (!title || !locationId || !due) return;
    const bookingId = `BKG-2026-${String(operations.bookings.length + 1).padStart(3, '0')}`;
    const booking = {
      id: bookingId,
      customerId: operations.customers[0].id,
      locationId,
      category: category as 'Cleaning' | 'Plumbing' | 'Electrical' | 'Appliance Repair' | 'Salon & Beauty',
      serviceName: title,
      scheduledAt: new Date(due).toISOString(),
      estimatedDurationMinutes: 60,
      status: 'Booking Received' as BookingStatus,
      professionalId: null,
      estimatedCost: Number.isFinite(estimatedCost) && estimatedCost >= 0 ? estimatedCost : 800,
      actualCost: null,
      cancelledAt: null,
      rescheduledFrom: null,
      createdAt: new Date().toISOString(),
    };
    saveOperations({ ...operations, bookings: [booking, ...operations.bookings] });
    setShowForm(false);
    setFilter('All');
    setPage('Bookings');
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-copy">
            <strong>serv<span>ops</span></strong>
            <small>OPERATIONS WORKSPACE</small>
          </div>
          <button
            className="icon-button sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-picker">
          <div className="workspace-symbol"><Command size={17} /></div>
          <div>
            <strong>Operations HQ</strong>
            <span>Workspace</span>
          </div>
          <ChevronDown size={15} className="muted-icon" />
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {([
            ['Overview', LayoutDashboard],
            ['Bookings', ClipboardList],
            ['Professionals', Users],
            ['Allocation', Route],
            ['Schedule', CalendarDays],
            ['Inventory', Package],
            ['Quality', ShieldAlert],
            ['Analytics', BarChart3],
            ['Insights', Lightbulb],
          ] as const).map(([label, Icon]) => (
            <button
              className={`nav-link ${page === label ? 'nav-link-active' : ''}`}
              key={label}
              onClick={() => {
                setPage(label);
                setMenuOpen(false);
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === 'Bookings' && <span className="nav-count">{openCount + activeCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon"><CircleHelp size={17} /></div>
            <strong>Need a hand?</strong>
            <p>Find help with your daily operations.</p>
            <button onClick={() => setNotice('Help resources will be available here soon.')}>
              Visit help center <ArrowRight size={14} />
            </button>
          </div>
          <button className="nav-link settings-link" onClick={() => {
            if (!window.confirm('Reset all ServOps records to the original simulated demo data?')) return;
            const result = resetOperationsData();
            if (result.ok) {
              setOperations(result.data);
              setNotice('All simulated records were reset to demo data.');
            } else {
              setNotice('Demo data could not be reset because browser storage is unavailable.');
            }
          }}>
            <Settings2 size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </button>
          <div className="profile">
            <div className="profile-avatar">SO</div>
            <div className="profile-copy">
              <strong>ServOps Manager</strong>
              <span>Operations manager</span>
            </div>
            <MoreHorizontal size={19} className="muted-icon" />
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{page}</strong></div>
          <div className="topbar-actions">
            <div className="top-search">
              <Search size={16} />
              <input
                aria-label="Search work orders"
                placeholder="Search anything..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice('You’re all caught up on notifications.')}>
              <Bell size={18} />
              <i />
            </button>
            <div className="top-avatar">SO</div>
          </div>
        </header>

        <div className="page-content">
          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button>
            </div>
          )}

          {page === 'Professionals' ? (
            <ProfessionalsPage data={operations} onChange={saveOperations} />
          ) : page === 'Bookings' ? (
            <BookingsPage data={operations} onChange={saveOperations} />
          ) : page === 'Allocation' || page === 'Schedule' ? (
            <AllocationSchedulePage
              data={operations}
              onChange={saveOperations}
              scheduleView={page === 'Schedule'}
            />
          ) : page === 'Inventory' || page === 'Quality' ? (
            <InventoryQualityPage
              data={operations}
              onChange={saveOperations}
              qualityView={page === 'Quality'}
            />
          ) : page === 'Analytics' || page === 'Insights' ? (
            <AnalyticsInsightsPage
              data={operations}
              insightsView={page === 'Insights'}
            />
          ) : (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow"><span className="live-dot" /> YOUR OPERATIONS AT A GLANCE</div>
                  <h1>{page === 'Overview' ? 'Good morning' : 'Work orders'}</h1>
                  <p className="page-subtitle">
                    {page === 'Overview'
                      ? 'Here’s what’s happening across your teams today.'
                      : 'Plan, assign, and track work across your operation.'}
                  </p>
                </div>
                <div className="heading-actions">
                  <div className="date-pill"><CalendarDays size={16} /><span>{dateLabel()}</span></div>
                  <button className="button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> New booking</button>
                </div>
              </section>

              {page === 'Overview' && (
                <>
                  <section className="stats-grid" aria-label="Operations summary">
                    <StatCard label="Open work orders" value={openCount} change="Needs assignment or action" icon={<ClipboardList size={18} />} tone="blue" trend="up" />
                    <StatCard label="In progress" value={activeCount} change="Being handled by teams" icon={<Activity size={18} />} tone="violet" trend="steady" />
                    <StatCard label="Completed" value={completedCount} change="Across your work queue" icon={<CheckCircle2 size={18} />} tone="green" trend="up" />
                    <StatCard label="Urgent attention" value={urgentCount} change="High-priority work open" icon={<ShieldAlert size={18} />} tone="amber" trend="down" />
                  </section>

                  <section className="overview-grid">
                    <div className="panel orders-panel">
                      <PanelHeader
                        title="Work order queue"
                        subtitle="Stay on top of today's work"
                        action={<button className="text-button" onClick={() => setPage('Bookings')}>View all <ArrowRight size={15} /></button>}
                      />
                      <OrderTable orders={visibleOrders.slice(0, 4)} onStatusChange={updateStatus} onDelete={deleteOrder} compact />
                      {visibleOrders.length === 0 && <EmptyState />}
                    </div>
                    <div className="panel teams-panel">
                      <PanelHeader title="Team capacity" subtitle="Current workload by team" action={<button className="icon-button subtle" aria-label="Team options" onClick={() => setNotice('Team capacity is up to date.')}><MoreHorizontal size={18} /></button>} />
                      <div className="team-list">
                        {operations.professionals.filter((item) => item.active).slice(0, 3).map((professional, index) => {
                          const location = operations.locations.find((item) => item.id === professional.baseLocationId);
                          const activeJobs = operations.bookings.filter((booking) =>
                            booking.professionalId === professional.id &&
                            ['Professional Assigned', 'Professional En Route', 'Service Started'].includes(booking.status),
                          ).length;
                          return (
                            <TeamRow
                              key={professional.id}
                              name={professional.name}
                              area={`${location?.area ?? 'Unknown area'} · ${professional.skills.join(', ')}`}
                              active={activeJobs}
                              capacity={4}
                              color={['blue', 'violet', 'green'][index % 3]}
                            />
                          );
                        })}
                      </div>
                      <button className="panel-footer-link" onClick={() => setPage('Professionals')}>View all professionals <ArrowRight size={15} /></button>
                    </div>
                  </section>

                  <section className="panel activity-panel">
                    <PanelHeader title="Operations pulse" subtitle="A quick read on today’s workload" action={<span className="updated-label"><span className="live-dot" /> Live overview</span>} />
                    <div className="pulse-content">
                      <div className="pulse-highlight">
                        <div className="pulse-icon"><Activity size={18} /></div>
                        <div><strong>{operations.bookings.length ? 'Your operation is moving' : 'Your queue is clear'}</strong><p>{activeCount} in progress · {openCount} waiting · {completedCount} completed</p></div>
                      </div>
                      <div className="pulse-meter-wrap">
                        <div className="pulse-meter-label"><span>Booking completion progress</span><strong>{operations.bookings.length ? Math.round((completedCount / operations.bookings.length) * 100) : 0}%</strong></div>
                        <div className="meter-track"><div className="meter-fill" style={{ width: `${operations.bookings.length ? Math.round((completedCount / operations.bookings.length) * 100) : 0}%` }} /></div>
                        <span className="meter-caption">Based on completed work orders</span>
                      </div>
                      <div className="pulse-stat"><span className="pulse-stat-icon"><Clock3 size={17} /></span><strong>{urgentCount}</strong><span>urgent items need attention</span></div>
                    </div>
                  </section>
                </>
              )}

            </>
          )}
        </div>
      </main>

      {menuOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      {showForm && (
        <NewOrderModal
          onClose={() => setShowForm(false)}
          onSubmit={addOrder}
          locations={operations.locations}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
  tone,
  trend,
}: {
  label: string;
  value: number;
  change: string;
  icon: React.ReactNode;
  tone: string;
  trend: 'up' | 'down' | 'steady';
}) {
  const TrendIcon = trend === 'down' ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="stat-card">
      <div className="stat-top"><span className={`stat-icon ${tone}`}>{icon}</span><button aria-label={`${label} options`} className="icon-button tiny"><MoreHorizontal size={17} /></button></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-change ${trend}`}><TrendIcon size={14} /><span>{change}</span></div>
    </div>
  );
}

function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-header">
      <div><h2>{title}</h2><p>{subtitle}</p></div>
      {action}
    </div>
  );
}

function OrderTable({
  orders,
  onStatusChange,
  onDelete,
  compact = false,
}: {
  orders: WorkOrder[];
  onStatusChange: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`table-scroll ${compact ? 'compact-table' : ''}`}>
      <table className="orders-table">
        <thead><tr><th>WORK ORDER</th><th>ASSIGNED TO</th><th>DUE</th><th>PRIORITY</th><th>STATUS</th><th aria-label="Actions" /></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><div className="order-title">{order.title}</div><div className="order-meta"><span>{order.id}</span><span className="meta-dot" /><MapPin size={12} /><span>{order.location}</span></div></td>
              <td><div className="assignee"><span className={`team-avatar ${teamColor(order.team)}`}>{teamInitials(order.team)}</span>{order.team}</div></td>
              <td><span className={`due-label ${order.due.startsWith('Yesterday') ? 'overdue' : ''}`}>{order.due}</span></td>
              <td><span className={`priority-pill priority-${order.priority.toLowerCase()}`}><i />{order.priority}</span></td>
              <td><span className={`status-pill status-${order.status.toLowerCase().replace(' ', '-')}`}><i />{order.status}</span></td>
              <td className="row-actions">
                <button className="row-action" title={nextAction(order.status)} aria-label={`${nextAction(order.status)}: ${order.title}`} onClick={() => onStatusChange(order.id)}>{order.status === 'Completed' ? <ArrowRight size={16} /> : <Check size={16} />}</button>
                <button className="row-action delete-action" title="Delete work order" aria-label={`Delete ${order.title}`} onClick={() => onDelete(order.id)}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return <div className="empty-state"><div><Search size={20} /></div><strong>No work orders found</strong><span>Try a different search or status filter.</span></div>;
}

function TeamRow({
  name,
  area,
  active,
  capacity,
  color,
}: {
  name: string;
  area: string;
  active: number;
  capacity: number;
  color: string;
}) {
  return (
    <div className="team-row">
      <div className={`team-avatar team-${color}`}>{teamInitials(name)}</div>
      <div className="team-info"><strong>{name}</strong><span>{area}</span></div>
      <div className="team-capacity"><div className="capacity-text"><strong>{active}</strong><span> / {capacity}</span></div><div className="capacity-track"><div className={`capacity-fill fill-${color}`} style={{ width: `${Math.min(100, (active / capacity) * 100)}%` }} /></div></div>
    </div>
  );
}

function NewOrderModal({
  onClose,
  onSubmit,
  locations,
}: {
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  locations: OperationsData['locations'];
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header"><div><span className="modal-icon"><ClipboardList size={18} /></span><h2 id="modal-title">Create work order</h2><p>Add a task for your operations team.</p></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
        <form onSubmit={onSubmit}>
          <label className="form-field">Service name<input name="title" placeholder="e.g. Bathroom deep cleaning" required autoFocus /></label>
          <label className="form-field">Location<select name="location" defaultValue={locations[0]?.id}>{locations.map((location) => <option key={location.id} value={location.id}>{location.area}, {location.city}</option>)}</select></label>
          <div className="form-row">
            <label className="form-field">Service category<select name="category" defaultValue="Cleaning"><option>Cleaning</option><option>Plumbing</option><option>Electrical</option><option>Appliance Repair</option><option>Salon & Beauty</option></select></label>
            <label className="form-field">Estimated cost (₹)<input name="cost" type="number" min="0" defaultValue="800" /></label>
          </div>
          <label className="form-field">Scheduled date and time<input name="due" type="datetime-local" required /></label>
          <div className="modal-actions"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button-primary"><Plus size={16} /> Create work order</button></div>
        </form>
      </section>
    </div>
  );
}

function teamInitials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function teamColor(team: string) {
  if (team.includes('North')) return 'team-blue';
  if (team.includes('Facilities')) return 'team-violet';
  if (team.includes('West')) return 'team-green';
  if (team.includes('South')) return 'team-amber';
  return 'team-slate';
}

function nextAction(status: WorkStatus) {
  if (status === 'Open') return 'Start work order';
  if (status === 'In progress') return 'Mark completed';
  return 'Reopen work order';
}

export default App;
