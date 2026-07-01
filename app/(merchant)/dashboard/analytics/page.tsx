// Placeholder while this screen is wired to the backend (legacy-dashboard
// alignment track). The legacy design for it lives in dashboard-legacy/.
export default function AnalyticsPage() {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
      <h1 className="text-xl font-semibold text-foreground mb-2">Analytics</h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Performance insights arrive with the analytics engine — revenue, top products, search terms and more.
      </p>
    </div>
  )
}
