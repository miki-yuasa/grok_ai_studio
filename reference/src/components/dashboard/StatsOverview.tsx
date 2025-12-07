import { ArrowRight } from "lucide-react";

const StatsOverview = () => {
  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
          ✨ Account insights
        </div>
        <h2 className="mb-2 text-xl font-medium text-foreground">Your reports are ready</h2>
        <p className="mb-4 text-muted-foreground">
          We've created your first reports to help you analyze your ad performance
        </p>
        <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:underline">
          View your first report <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week at a glance */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h3 className="text-lg font-medium text-foreground">This week at a glance</h3>
          <span className="text-sm text-muted-foreground">Last 7 days</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Total spend</p>
            <p className="text-2xl font-semibold text-foreground">$12,450</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Purchases</p>
            <p className="text-2xl font-semibold text-foreground">847</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Creatives launched</p>
            <p className="text-2xl font-semibold text-foreground">23</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
