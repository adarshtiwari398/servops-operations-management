# ServOps
A standalone home-services operations workspace for managing bookings, professionals, allocation, scheduling, inventory, SLA, quality, analytics, and operational insights.

The application uses realistic but clearly simulated Indian home-services data.

## Features

- Booking and professional CRUD workflows
- Transparent professional allocation scoring
- Schedule and conflict management
- Location-category capacity planning
- Inventory stock and reorder workflows
- SLA arrival and quality feedback workflows
- Data-driven KPI calculations
- Moving-average demand estimates with accuracy measurement
- Explainable operations insights
- Browser-local versioned persistence with demo reset
- Responsive layout for desktop and mobile

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Work order data is stored in this browser using local storage. This demo does not include user accounts, shared data, or a server-side database.
