import { useMemo, useState, type FormEvent } from 'react';
import type { CustomerFeedback, OperationsData } from '../types/domain';

type Props = {
  data: OperationsData;
  onChange: (data: OperationsData, notice?: string) => void;
  qualityView: boolean;
};

export function InventoryQualityPage({ data, onChange, qualityView }: Props) {
  const lowStock = useMemo(() => data.inventory.filter((item) => item.quantity <= item.minimumStock), [data.inventory]);
  const [feedbackError, setFeedbackError] = useState('');

  function adjustStock(itemId: string, quantity: number) {
    if (!Number.isFinite(quantity) || quantity < 0) return;
    onChange({
      ...data,
      inventory: data.inventory.map((item) => item.id === itemId ? { ...item, quantity } : item),
    }, 'Inventory quantity updated.');
  }

  function addFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const bookingId = String(form.get('bookingId'));
    const rating = Number(form.get('rating'));
    const comment = String(form.get('comment') ?? '').trim();
    if (!data.bookings.some((booking) => booking.id === bookingId)) {
      setFeedbackError('Select a valid booking.');
      return;
    }
    const feedback: CustomerFeedback = {
      id: `FB-${String(data.feedback.length + 1).padStart(3, '0')}`,
      bookingId,
      rating,
      comment,
      complaintType: String(form.get('complaint')) as CustomerFeedback['complaintType'],
      resolutionStatus: 'Open',
      refundAmount: Number(form.get('refund') ?? 0),
      reworkRequired: form.get('rework') === 'on',
    };
    onChange({ ...data, feedback: [feedback, ...data.feedback] }, 'Customer feedback recorded.');
    setFeedbackError('');
    event.currentTarget.reset();
  }

  function resolveFeedback(id: string) {
    onChange({
      ...data,
      feedback: data.feedback.map((item) => item.id === id ? { ...item, resolutionStatus: 'Resolved' } : item),
    }, 'Feedback issue resolved.');
  }

  function recordArrival(bookingId: string) {
    const now = new Date().toISOString();
    onChange({
      ...data,
      slaRecords: data.slaRecords.map((record) => {
        if (record.bookingId !== bookingId) return record;
        const scheduled = new Date(record.scheduledArrivalAt).getTime();
        const actual = new Date(now).getTime();
        const onTime = actual - scheduled <= record.slaMinutes * 60_000;
        return { ...record, actualArrivalAt: now, onTime, slaBreached: !onTime };
      }),
    }, `Arrival recorded for ${bookingId}.`);
  }

  if (qualityView) {
    const average = data.feedback.length
      ? data.feedback.reduce((sum, item) => sum + item.rating, 0) / data.feedback.length
      : 0;
    return (
      <>
        <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> CUSTOMER EXPERIENCE</div><h1>Quality management</h1><p className="page-subtitle">Ratings, complaints, rework, refunds, and resolution records.</p></div></section>
        <section className="stats-grid"><div className="stat-card"><div className="stat-value">{average.toFixed(1)}</div><div className="stat-label">Average recorded rating</div></div><div className="stat-card"><div className="stat-value">{data.feedback.filter((item) => item.resolutionStatus !== 'Resolved').length}</div><div className="stat-label">Open quality issues</div></div><div className="stat-card"><div className="stat-value">{data.feedback.filter((item) => item.reworkRequired).length}</div><div className="stat-label">Rework requests</div></div><div className="stat-card"><div className="stat-value">₹{data.feedback.reduce((sum, item) => sum + item.refundAmount, 0)}</div><div className="stat-label">Recorded refunds</div></div></section>
        <section className="panel all-orders-panel"><div className="panel-header"><div><h2>SLA and arrival records</h2><p>Actual arrival values and recorded on-time status</p></div></div><div className="table-scroll"><table className="orders-table"><thead><tr><th>BOOKING</th><th>SCHEDULED ARRIVAL</th><th>ACTUAL ARRIVAL</th><th>ON-TIME</th><th>SLA STATUS</th><th>ACTION</th></tr></thead><tbody>{data.slaRecords.map((record) => <tr key={record.bookingId}><td>{record.bookingId}</td><td>{new Date(record.scheduledArrivalAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{record.actualArrivalAt ? new Date(record.actualArrivalAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded'}</td><td>{record.onTime === null ? 'Pending' : record.onTime ? 'Yes' : 'No'}</td><td>{record.slaBreached ? 'Breached' : 'Compliant'}</td><td>{record.actualArrivalAt === null && <button className="button-secondary" onClick={() => recordArrival(record.bookingId)}>Record arrival now</button>}</td></tr>)}</tbody></table></div></section>
        <section className="overview-grid">
          <div className="panel all-orders-panel"><div className="panel-header"><div><h2>Customer feedback</h2><p>{data.feedback.length} records</p></div></div><div className="table-scroll"><table className="orders-table"><thead><tr><th>BOOKING</th><th>RATING</th><th>ISSUE</th><th>COMMENT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{data.feedback.map((item) => <tr key={item.id}><td>{item.bookingId}</td><td>{item.rating.toFixed(1)}</td><td>{item.complaintType}</td><td>{item.comment}</td><td>{item.resolutionStatus}</td><td>{item.resolutionStatus !== 'Resolved' && <button className="button-secondary" onClick={() => resolveFeedback(item.id)}>Resolve</button>}</td></tr>)}</tbody></table></div></div>
          <div className="panel"><div className="panel-header"><div><h2>Record feedback</h2><p>Linked to an existing booking</p></div></div><form className="module-form" onSubmit={addFeedback}><label className="form-field">Booking<select name="bookingId"><option value="">Select booking</option>{data.bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.id}</option>)}</select></label><label className="form-field">Rating<input name="rating" type="number" min="1" max="5" step="0.1" defaultValue="4.5" required /></label><label className="form-field">Complaint type<select name="complaint"><option>None</option><option>Delay</option><option>Quality</option><option>Professional Behavior</option><option>Cost</option></select></label><label className="form-field">Comment<textarea name="comment" /></label><label className="form-field">Refund amount<input name="refund" type="number" min="0" defaultValue="0" /></label><label className="form-field checkbox-field"><input type="checkbox" name="rework" /> Rework required</label>{feedbackError && <div className="inline-error">{feedbackError}</div>}<button type="submit" className="button-primary">Save feedback</button></form></div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> RESOURCE CONTROL</div><h1>Inventory</h1><p className="page-subtitle">Track stock, minimum thresholds, reorder quantities, and supplier needs.</p></div></section>
      {lowStock.length > 0 && <div className="notice"><span>{lowStock.length} inventory item(s) are at or below minimum stock.</span></div>}
      <section className="panel all-orders-panel"><div className="panel-header"><div><h2>Stock records</h2><p>Actual quantities and reorder recommendations</p></div></div><div className="table-scroll"><table className="orders-table"><thead><tr><th>ITEM</th><th>CATEGORY</th><th>AVAILABLE</th><th>MINIMUM</th><th>REORDER</th><th>SUPPLIER</th><th>UNIT COST</th><th>UPDATE</th></tr></thead><tbody>{data.inventory.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.category}</td><td>{item.quantity} {item.unit}</td><td>{item.minimumStock}</td><td>{item.quantity <= item.minimumStock ? `${item.reorderQuantity} ${item.unit}` : 'Not required'}</td><td>{item.supplier}</td><td>₹{item.unitCost}</td><td><input className="stock-input" type="number" min="0" defaultValue={item.quantity} onBlur={(event) => adjustStock(item.id, Number(event.target.value))} /></td></tr>)}</tbody></table></div></section>
    </>
  );
}
