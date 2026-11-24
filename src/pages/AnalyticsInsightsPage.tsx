import type { OperationsData } from '../types/domain';
import { calculateCapacity, calculateKpis, calculateMovingAverage } from '../domain/analytics';

type Props = {
  data: OperationsData;
  insightsView: boolean;
};

export function AnalyticsInsightsPage({ data, insightsView }: Props) {
  const kpis = calculateKpis(data);
  const historyCounts = data.demandHistory.map((item) => item.bookingCount);
  const forecast = calculateMovingAverage(historyCounts);
  const nextForecast = forecast.forecasts.at(-1) ?? 0;
  const capacityRows = data.locations.flatMap((location) =>
    ['Cleaning', 'Plumbing', 'Electrical', 'Appliance Repair', 'Salon & Beauty'].map((category) => ({
      location,
      category,
      ...calculateCapacity(data, location.id, category as 'Cleaning' | 'Plumbing' | 'Electrical' | 'Appliance Repair' | 'Salon & Beauty'),
    })),
  ).filter((row) => row.demand > 0);

  if (insightsView) {
    const insights: Array<{ problem: string; evidence: string; cause: string; action: string }> = [];
    capacityRows.filter((row) => row.gap > 0).forEach((row) => insights.push({
      problem: `Demand exceeds professional capacity in ${row.location.area} for ${row.category}.`,
      evidence: `${row.demand} demand units against ${row.availableCapacity} capacity units.`,
      cause: 'Insufficient category-skilled workforce or concentration of bookings in the locality.',
      action: `Plan ${row.additionalProfessionalsRequired} additional professional(s), or reallocate nearby capacity.`,
    }));
    low: {
      const low = data.inventory.filter((item) => item.quantity <= item.minimumStock);
      low.forEach((item) => insights.push({
        problem: `${item.name} inventory is at or below minimum stock.`,
        evidence: `${item.quantity} ${item.unit} available; minimum is ${item.minimumStock}.`,
        cause: 'Consumption exceeded replenishment or the reorder threshold was reached.',
        action: `Order ${item.reorderQuantity} ${item.unit} from ${item.supplier}.`,
      }));
    }
    data.professionals.filter((professional) => professional.cancellationRate >= 3).forEach((professional) => insights.push({
      problem: `${professional.name} has an elevated cancellation or rejection risk.`,
      evidence: `${professional.cancellationRate}% cancellation and ${professional.rejectionRate}% rejection recorded.`,
      cause: 'Possible route, fit, availability, or schedule mismatch.',
      action: 'Review recent assignment outcomes and adjust availability or category matching.',
    }));
    const poorRatings = data.feedback.filter((item) => item.rating < 4);
    if (poorRatings.length) insights.push({
      problem: 'Customer satisfaction is below the 4.0 operational threshold.',
      evidence: `${poorRatings.length} feedback record(s) are below 4.0.`,
      cause: 'Service quality, delay, cost, or professional behavior may be contributing.',
      action: 'Prioritize open complaints and assign rework or escalation review.',
    });

    return (
      <>
        <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> EXPLAINABLE OPERATIONS INTELLIGENCE</div><h1>Operations Insights</h1><p className="page-subtitle">Problems, supporting actual data, likely causes, and corrective actions.</p></div></section>
        {insights.length === 0 ? <div className="panel empty-state"><strong>No threshold breaches detected</strong><span>Current simulated records do not trigger the documented rules.</span></div> : <div className="insights-grid">{insights.map((insight, index) => <article className="panel insight-card" key={`${insight.problem}-${index}`}><span className="insight-index">RULE {index + 1}</span><h2>{insight.problem}</h2><div><strong>Supporting data</strong><p>{insight.evidence}</p></div><div><strong>Possible cause</strong><p>{insight.cause}</p></div><div><strong>Recommended action</strong><p>{insight.action}</p></div></article>)}</div>}
      </>
    );
  }

  return (
    <>
      <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> RECORDED PERFORMANCE</div><h1>Operations analytics</h1><p className="page-subtitle">Actual KPIs, simulated forecast estimates, and location-category capacity.</p></div></section>
      <section className="stats-grid">
        <div className="stat-card"><div className="stat-value">{kpis.totalBookings}</div><div className="stat-label">Total bookings — actual</div></div>
        <div className="stat-card"><div className="stat-value">{kpis.completedBookings}</div><div className="stat-label">Completed bookings — actual</div></div>
        <div className="stat-card"><div className="stat-value">{kpis.cancellationRate.toFixed(1)}%</div><div className="stat-label">Cancellation rate — actual</div></div>
        <div className="stat-card"><div className="stat-value">₹{kpis.costPerCompletedService.toFixed(0)}</div><div className="stat-label">Cost per completed booking — actual</div></div>
        <div className="stat-card"><div className="stat-value">{kpis.onTimeArrivalRate.toFixed(1)}%</div><div className="stat-label">On-time arrival — actual</div></div>
        <div className="stat-card"><div className="stat-value">{kpis.slaCompliance.toFixed(1)}%</div><div className="stat-label">SLA compliance — actual</div></div>
        <div className="stat-card"><div className="stat-value">{kpis.averageRating.toFixed(1)}</div><div className="stat-label">Average rating — actual</div></div>
        <div className="stat-card"><div className="stat-value">{kpis.professionalUtilization.toFixed(1)}%</div><div className="stat-label">Professional utilization — estimate</div></div>
      </section>
      <section className="overview-grid">
        <div className="panel"><div className="panel-header"><div><h2>Capacity gaps</h2><p>Demand units compared with location-category capacity</p></div></div><div className="table-scroll"><table className="orders-table"><thead><tr><th>LOCATION</th><th>CATEGORY</th><th>DEMAND</th><th>CAPACITY</th><th>GAP</th><th>ADDITIONAL NEED</th></tr></thead><tbody>{capacityRows.map((row) => <tr key={`${row.location.id}-${row.category}`}><td>{row.location.area}</td><td>{row.category}</td><td>{row.demand}</td><td>{row.availableCapacity}</td><td>{row.gap}</td><td>{row.additionalProfessionalsRequired} professional(s)</td></tr>)}</tbody></table></div></div>
        <div className="panel"><div className="panel-header"><div><h2>Demand forecast</h2><p>Moving average — estimate, not actual</p></div></div><div className="forecast-body"><strong>{nextForecast.toFixed(1)}</strong><span>Next-period demand estimate</span><div>Historical accuracy: {forecast.accuracy === null ? 'Not available' : `${forecast.accuracy.toFixed(1)}%`}</div><div>Method: trailing 3-period moving average</div></div></div>
      </section>
      <section className="panel resource-note"><div><strong>Estimated vs actual cost</strong><p>₹{kpis.estimatedVsActualCost.estimated} estimated · ₹{kpis.estimatedVsActualCost.actual} recorded actual for completed bookings</p></div></section>
    </>
  );
}
