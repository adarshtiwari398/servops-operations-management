import { useMemo, useState, type FormEvent } from 'react';
import { Plus, Search, UserRound, Users, X } from 'lucide-react';
import type { OperationsData, Professional, ServiceCategory } from '../types/domain';
import { validateProfessional } from '../services/operationsCrud';

type Props = {
  data: OperationsData;
  onChange: (data: OperationsData, notice?: string) => void;
};

const categories: ServiceCategory[] = ['Cleaning', 'Plumbing', 'Electrical', 'Appliance Repair', 'Salon & Beauty'];

export function ProfessionalsPage({ data, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Professional | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const professionals = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.professionals.filter((professional) =>
      !normalized ||
      [professional.name, professional.id, ...professional.skills]
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [data.professionals, query]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const skills = categories.filter((category) => form.getAll('skills').includes(category));
    const input: Professional = {
      id: editing?.id ?? `PRO-${201 + data.professionals.length}`,
      name: String(form.get('name') ?? '').trim(),
      phoneMasked: editing?.phoneMasked ?? '****0000',
      baseLocationId: String(form.get('locationId') ?? data.locations[0].id),
      skills,
      workingHours: {
        start: String(form.get('start') ?? '09:00'),
        end: String(form.get('end') ?? '18:00'),
      },
      rating: editing?.rating ?? 4.5,
      completedJobs: editing?.completedJobs ?? 0,
      cancellationRate: editing?.cancellationRate ?? 0,
      rejectionRate: editing?.rejectionRate ?? 0,
      active: form.get('active') === 'on',
    };
    const validationError = validateProfessional(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    const next = editing
      ? data.professionals.map((item) => item.id === editing.id ? input : item)
      : [input, ...data.professionals];
    onChange({ ...data, professionals: next }, `${input.name} saved.`);
    setEditing(null);
    setShowForm(false);
    setError('');
  }

  function toggleActive(professional: Professional) {
    onChange({
      ...data,
      professionals: data.professionals.map((item) =>
        item.id === professional.id ? { ...item, active: !item.active } : item,
      ),
    }, `${professional.name} is now ${professional.active ? 'inactive' : 'active'}.`);
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="live-dot" /> PEOPLE & CAPACITY</div>
          <h1>Professionals</h1>
          <p className="page-subtitle">Manage skills, working hours, availability, and performance.</p>
        </div>
        <div className="heading-actions">
          <button className="button-primary" onClick={() => { setEditing(null); setError(''); setShowForm(true); }}><Plus size={17} /> Add professional</button>
        </div>
      </section>

      <section className="panel all-orders-panel">
        <div className="panel-header"><div><h2>Professional roster</h2><p>{professionals.length} simulated professionals in the current view</p></div></div>
        <div className="filter-row">
          <div className="top-search booking-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search professionals..." /></div>
        </div>
        <div className="table-scroll">
          <table className="orders-table">
            <thead><tr><th>PROFESSIONAL</th><th>BASE LOCATION</th><th>SKILLS</th><th>WORKING HOURS</th><th>PERFORMANCE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {professionals.map((professional) => {
                const location = data.locations.find((item) => item.id === professional.baseLocationId);
                const assignments = data.bookings.filter((booking) =>
                  booking.professionalId === professional.id &&
                  !['Cancelled', 'Service Completed'].includes(booking.status),
                ).length;
                return (
                  <tr key={professional.id}>
                    <td><div className="order-title">{professional.name}</div><div className="order-meta">{professional.id}</div></td>
                    <td>{location?.area}, {location?.city}</td>
                    <td>{professional.skills.join(', ')}</td>
                    <td>{professional.workingHours.start}–{professional.workingHours.end}</td>
                    <td>{professional.rating.toFixed(1)} rating · {professional.completedJobs} jobs · {assignments} active</td>
                    <td><span className={`priority-pill ${professional.active ? 'priority-standard' : 'priority-urgent'}`}>{professional.active ? 'Active' : 'Inactive'}</span></td>
                    <td className="row-actions">
                      <button className="row-action" title="Edit professional" onClick={() => { setEditing(professional); setError(''); setShowForm(true); }}><UserRound size={15} /></button>
                      <button className="row-action" title={professional.active ? 'Deactivate professional' : 'Activate professional'} onClick={() => toggleActive(professional)}><Users size={15} /></button>
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
            <div className="modal-header"><div><span className="modal-icon"><Users size={18} /></span><h2>{editing ? 'Edit professional' : 'Add professional'}</h2><p>Configure eligibility and availability.</p></div><button className="icon-button" onClick={() => setShowForm(false)}><X size={19} /></button></div>
            <form onSubmit={save}>
              <label className="form-field">Professional name<input name="name" defaultValue={editing?.name ?? ''} required /></label>
              <label className="form-field">Base location<select name="locationId" defaultValue={editing?.baseLocationId ?? data.locations[0]?.id}>{data.locations.map((item) => <option key={item.id} value={item.id}>{item.area}, {item.city}</option>)}</select></label>
              <fieldset className="skill-fieldset"><legend>Service skills</legend>{categories.map((category) => <label key={category}><input type="checkbox" name="skills" value={category} defaultChecked={editing?.skills.includes(category)} /> {category}</label>)}</fieldset>
              <div className="form-row">
                <label className="form-field">Start time<input name="start" type="time" defaultValue={editing?.workingHours.start ?? '09:00'} required /></label>
                <label className="form-field">End time<input name="end" type="time" defaultValue={editing?.workingHours.end ?? '18:00'} required /></label>
              </div>
              <label className="form-field checkbox-field"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Active for assignments</label>
              {error && <div className="inline-error">{error}</div>}
              <div className="modal-actions"><button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="button-primary">{editing ? 'Save changes' : 'Add professional'}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
