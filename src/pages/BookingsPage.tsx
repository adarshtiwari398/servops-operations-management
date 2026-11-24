import { useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Filter, Plus, Search, Trash2, UserCheck, X } from 'lucide-react';
import type { Booking, BookingStatus, OperationsData, ServiceCategory } from '../types/domain';
import { createBooking, reassignBooking, updateBookingStatus, validateBookingInput } from '../services/operationsCrud';

type Props = {
  data: OperationsData;
  onChange: (data: OperationsData, notice?: string) => void;
};

const statuses: Array<'All' | BookingStatus> = [
  'All', 'Booking Received', 'Confirmed', 'Professional Assigned',
  'Professional En Route', 'Service Started', 'Service Completed', 'Cancelled', 'Rescheduled',
];
const categories: ServiceCategory[] = ['Cleaning', 'Plumbing', 'Electrical', 'Appliance Repair', 'Salon & Beauty'];

export function BookingsPage({ data, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | BookingStatus>('All');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [error, setError] = useState('');

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.bookings.filter((booking) => {
      const customer = data.customers.find((item) => item.id === booking.customerId);
      const location = data.locations.find((item) => item.id === booking.locationId);
      const matchesStatus = status === 'All' || booking.status === status;
      const matchesQuery = !normalized || [booking.id, booking.serviceName, booking.category, customer?.name, location?.area]
        .some((value) => value?.toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [data, query, status]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      customerId: String(form.get('customerId') ?? ''),
      locationId: String(form.get('locationId') ?? ''),
      category: String(form.get('category') ?? 'Cleaning') as ServiceCategory,
      serviceName: String(form.get('serviceName') ?? '').trim(),
      scheduledAt: String(form.get('scheduledAt') ?? ''),
      estimatedDurationMinutes: Number(form.get('duration')),
      estimatedCost: Number(form.get('estimatedCost')),
    };
    const validationError = validateBookingInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (editing) {
      const updated: Booking = { ...editing, ...input };
      onChange({
        ...data,
        bookings: data.bookings.map((booking) => booking.id === editing.id ? updated : booking),
      }, `Booking ${editing.id} updated.`);
    } else {
      const booking = createBooking(data, input);
      onChange({ ...data, bookings: [booking, ...data.bookings] }, `Booking ${booking.id} created.`);
    }
    setEditing(null);
    setShowForm(false);
    setError('');
  }

  function remove(booking: Booking) {
    if (!window.confirm(`Delete booking ${booking.id}? This cannot be undone.`)) return;
    onChange({
      ...data,
      bookings: data.bookings.filter((item) => item.id !== booking.id),
      scheduleAssignments: data.scheduleAssignments.filter((item) => item.bookingId !== booking.id),
    }, `Booking ${booking.id} deleted.`);
  }

  function advance(booking: Booking) {
    const sequence: BookingStatus[] = [
      'Booking Received', 'Confirmed', 'Professional Assigned',
      'Professional En Route', 'Service Started', 'Service Completed',
    ];
    const index = sequence.indexOf(booking.status);
    const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : 'Booking Received';
    onChange({
      ...data,
      bookings: data.bookings.map((item) =>
        item.id === booking.id ? updateBookingStatus(item, next) : item,
      ),
    }, `Booking ${booking.id} moved to ${next}.`);
  }

  function reassign(booking: Booking, professionalId: string) {
    const result = reassignBooking(data, booking, professionalId);
    if (result.error) {
      setError(result.error);
      return;
    }
    onChange(result.data, `Booking ${booking.id} reassigned.`);
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="live-dot" /> SIMULATED OPERATIONS DATA</div>
          <h1>Bookings</h1>
          <p className="page-subtitle">Create, schedule, assign, and manage service bookings.</p>
        </div>
        <div className="heading-actions">
          <button className="button-primary" onClick={() => { setEditing(null); setError(''); setShowForm(true); }}><Plus size={17} /> New booking</button>
        </div>
      </section>

      <section className="panel all-orders-panel">
        <div className="panel-header">
          <div><h2>Service booking queue</h2><p>{visible.length} records in the current view</p></div>
        </div>
        <div className="filter-row">
          <div className="top-search booking-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bookings..." /></div>
          <select className="booking-filter" value={status} onChange={(event) => setStatus(event.target.value as 'All' | BookingStatus)} aria-label="Filter by booking status">
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        {error && <div className="inline-error">{error}</div>}
        <div className="table-scroll">
          <table className="orders-table">
            <thead><tr><th>BOOKING</th><th>CUSTOMER / AREA</th><th>SCHEDULE</th><th>PROFESSIONAL</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {visible.map((booking) => {
                const customer = data.customers.find((item) => item.id === booking.customerId);
                const location = data.locations.find((item) => item.id === booking.locationId);
                const professional = data.professionals.find((item) => item.id === booking.professionalId);
                return (
                  <tr key={booking.id}>
                    <td><div className="order-title">{booking.serviceName}</div><div className="order-meta"><span>{booking.id}</span><span className="meta-dot" /><span>{booking.category}</span></div></td>
                    <td>{customer?.name}<div className="order-meta">{location?.area}, {location?.city}</div></td>
                    <td>{new Date(booking.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>
                      {professional ? <span>{professional.name}</span> : <span className="subtle">Unassigned</span>}
                      {professional && <select className="reassign-select" value={professional.id} onChange={(event) => reassign(booking, event.target.value)} aria-label={`Reassign ${booking.id}`}>
                        {data.professionals.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>}
                      {!professional && <select className="reassign-select" defaultValue="" onChange={(event) => reassign(booking, event.target.value)} aria-label={`Assign ${booking.id}`}>
                        <option value="" disabled>Assign professional</option>
                        {data.professionals.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>}
                    </td>
                    <td><span className="priority-pill priority-standard">{booking.status}</span></td>
                    <td className="row-actions">
                      <button className="row-action" title="Move to next status" onClick={() => advance(booking)}><CalendarDays size={15} /></button>
                      <button className="row-action" title="Edit booking" onClick={() => { setEditing(booking); setError(''); setShowForm(true); }}><Filter size={15} /></button>
                      <button className="row-action delete-action" title="Delete booking" onClick={() => remove(booking)}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}>
          <section className="modal">
            <div className="modal-header"><div><span className="modal-icon"><UserCheck size={18} /></span><h2>{editing ? 'Edit booking' : 'Create booking'}</h2><p>Linked to the simulated operations records.</p></div><button className="icon-button" onClick={() => setShowForm(false)}><X size={19} /></button></div>
            <form onSubmit={save}>
              <label className="form-field">Customer<select name="customerId" defaultValue={editing?.customerId ?? data.customers[0]?.id}>{data.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="form-field">Location<select name="locationId" defaultValue={editing?.locationId ?? data.locations[0]?.id}>{data.locations.map((item) => <option key={item.id} value={item.id}>{item.area}, {item.city}</option>)}</select></label>
              <label className="form-field">Service category<select name="category" defaultValue={editing?.category ?? 'Cleaning'}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="form-field">Service name<input name="serviceName" defaultValue={editing?.serviceName ?? ''} required /></label>
              <label className="form-field">Scheduled date and time<input name="scheduledAt" type="datetime-local" defaultValue={editing ? editing.scheduledAt.slice(0, 16) : ''} required /></label>
              <div className="form-row">
                <label className="form-field">Duration (minutes)<input name="duration" type="number" min="15" step="15" defaultValue={editing?.estimatedDurationMinutes ?? 60} required /></label>
                <label className="form-field">Estimated cost (₹)<input name="estimatedCost" type="number" min="0" step="50" defaultValue={editing?.estimatedCost ?? 800} required /></label>
              </div>
              {error && <div className="inline-error">{error}</div>}
              <div className="modal-actions"><button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="button-primary">{editing ? 'Save changes' : 'Create booking'}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
