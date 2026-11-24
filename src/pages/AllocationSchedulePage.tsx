import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { OperationsData } from '../types/domain';
import { ALLOCATION_WEIGHTS, rankProfessionals } from '../domain/allocation';
import { reassignBooking } from '../services/operationsCrud';

type Props = {
  data: OperationsData;
  onChange: (data: OperationsData, notice?: string) => void;
  scheduleView: boolean;
};

export function AllocationSchedulePage({ data, onChange, scheduleView }: Props) {
  const [bookingId, setBookingId] = useState(
    data.bookings.find((booking) => !booking.professionalId)?.id ?? data.bookings[0]?.id ?? '',
  );
  const booking = data.bookings.find((item) => item.id === bookingId) ?? data.bookings[0];
  const candidates = useMemo(() => booking ? rankProfessionals(data, booking) : [], [data, booking]);

  function assign(professionalId: string) {
    if (!booking) return;
    const result = reassignBooking(data, booking, professionalId);
    if (result.error) {
      onChange(data, result.error);
      return;
    }
    onChange(result.data, `Booking ${booking.id} allocated to ${data.professionals.find((item) => item.id === professionalId)?.name}.`);
  }

  if (scheduleView) {
    return (
      <>
        <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> SCHEDULE CONTROL</div><h1>Service schedule</h1><p className="page-subtitle">Assignments, time conflicts, and booking capacity.</p></div></section>
        <section className="panel all-orders-panel">
          <div className="panel-header"><div><h2>Professional schedule</h2><p>{data.scheduleAssignments.length} scheduled assignments</p></div></div>
          <div className="table-scroll"><table className="orders-table"><thead><tr><th>PROFESSIONAL</th><th>BOOKING</th><th>SERVICE</th><th>START</th><th>END</th><th>STATUS</th></tr></thead><tbody>
            {data.scheduleAssignments.map((assignment) => {
              const professional = data.professionals.find((item) => item.id === assignment.professionalId);
              const scheduledBooking = data.bookings.find((item) => item.id === assignment.bookingId);
              return <tr key={assignment.id}><td>{professional?.name}</td><td>{assignment.bookingId}</td><td>{scheduledBooking?.serviceName}</td><td>{new Date(assignment.startAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{new Date(assignment.endAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td><td><span className="priority-pill priority-standard">{scheduledBooking?.status}</span></td></tr>;
            })}
          </tbody></table></div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> TRANSPARENT RULE-BASED ALLOCATION</div><h1>Professional allocation</h1><p className="page-subtitle">Every recommendation shows eligibility and weighted scoring.</p></div></section>
      <section className="allocation-layout">
        <div className="panel allocation-booking">
          <div className="panel-header"><div><h2>Booking for allocation</h2><p>Select a booking to rank candidates</p></div></div>
          <div className="allocation-body">
            <select className="booking-filter allocation-select" value={bookingId} onChange={(event) => setBookingId(event.target.value)}>
              {data.bookings.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.serviceName}</option>)}
            </select>
            {booking && <div className="allocation-summary"><strong>{booking.serviceName}</strong><span>{booking.category} · {booking.estimatedDurationMinutes} minutes</span><span>{new Date(booking.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>}
            <div className="weight-list">
              <strong>Documented weights</strong>
              <span>Skill {ALLOCATION_WEIGHTS.skill}%</span>
              <span>Availability {ALLOCATION_WEIGHTS.availability}%</span>
              <span>Distance {ALLOCATION_WEIGHTS.distance}%</span>
              <span>Workload {ALLOCATION_WEIGHTS.workload}%</span>
              <span>Rating {ALLOCATION_WEIGHTS.rating}%</span>
            </div>
          </div>
        </div>
        <div className="panel candidate-panel">
          <div className="panel-header"><div><h2>Ranked professionals</h2><p>Eligibility is required before a score is awarded</p></div></div>
          <div className="candidate-list">
            {candidates.map((candidate) => (
              <article className={`candidate ${candidate.eligible ? '' : 'candidate-ineligible'}`} key={candidate.professional.id}>
                <div className="candidate-top"><div><strong>{candidate.professional.name}</strong><span>{candidate.professional.skills.join(', ')}</span></div><div className="candidate-score"><strong>{candidate.score}</strong><span>/ 100</span></div></div>
                <div className="score-bars">
                  <span>Skill {candidate.breakdown.skill}/{ALLOCATION_WEIGHTS.skill}</span>
                  <span>Availability {candidate.breakdown.availability}/{ALLOCATION_WEIGHTS.availability}</span>
                  <span>Distance {candidate.breakdown.distance.toFixed(1)}/{ALLOCATION_WEIGHTS.distance}</span>
                  <span>Workload {candidate.breakdown.workload.toFixed(1)}/{ALLOCATION_WEIGHTS.workload}</span>
                  <span>Rating {candidate.breakdown.rating.toFixed(1)}/{ALLOCATION_WEIGHTS.rating}</span>
                </div>
                <ul>{candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                <button className="button-secondary" disabled={!candidate.eligible} onClick={() => assign(candidate.professional.id)}><CheckCircle2 size={15} /> {candidate.eligible ? 'Assign manually' : 'Ineligible'}</button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
