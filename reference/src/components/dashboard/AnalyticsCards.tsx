interface AdCard {
  id: string;
  type: "Static" | "Video";
  title: string;
  spend: number;
  roas: number;
  cpa: number;
  convertScore: number;
  color: string;
}

const sampleAdCards: AdCard[] = [
  {
    id: "1",
    type: "Static",
    title: "Women's Wallets",
    spend: 50156,
    roas: 1.4,
    cpa: 19,
    convertScore: 62,
    color: "bg-rose-300",
  },
  {
    id: "2",
    type: "Video",
    title: "Quality Messaging",
    spend: 14849,
    roas: 2.1,
    cpa: 12,
    convertScore: 73,
    color: "bg-neutral-400",
  },
  {
    id: "3",
    type: "Static",
    title: "Hybrid Deep Pans",
    spend: 35834,
    roas: 1.7,
    cpa: 17,
    convertScore: 60,
    color: "bg-slate-500",
  },
  {
    id: "4",
    type: "Video",
    title: "Wedding Bands",
    spend: 104536,
    roas: 1.1,
    cpa: 33,
    convertScore: 73,
    color: "bg-amber-200",
  },
];

const getScoreColor = (score: number) => {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
};

const AnalyticsCards = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-foreground flex items-center gap-2">
            <span className="text-amber-500">⭐</span> Top creatives
          </h2>
          <p className="text-sm text-muted-foreground">
            This report shows top-spending creative with potential for real scale.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
            Last 14 days
          </button>
          <button className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
            Group by <span className="text-muted-foreground">Ad name</span>
          </button>
          <button className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
            + Add filter
          </button>
        </div>
      </div>

      {/* Metric pills */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            1
          </span>
          Spend
        </span>
        <span className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
            2
          </span>
          <span className="h-2 w-2 rounded-full bg-foreground" />
          ROAS
        </span>
        <span className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
            3
          </span>
          <span className="h-2 w-2 rounded-full bg-foreground" />
          CPA
        </span>
        <span className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
            4
          </span>
          Convert score
        </span>
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          + Add metric
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {sampleAdCards.map((ad) => (
          <div
            key={ad.id}
            className="overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg"
          >
            {/* Image placeholder */}
            <div className={`aspect-square ${ad.color} relative`}>
              {ad.type === "Video" && (
                <div className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80">
                  <div className="ml-0.5 h-0 w-0 border-l-[8px] border-t-[5px] border-b-[5px] border-l-foreground border-t-transparent border-b-transparent" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <h3 className="font-medium text-foreground">
                {ad.type} | {ad.title}
              </h3>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Spend</span>
                <span className="font-semibold text-foreground">
                  ${ad.spend.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-foreground" />
                  ROAS
                </span>
                <span className="font-semibold text-foreground">{ad.roas}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-foreground" />
                  CPA
                </span>
                <span className="font-semibold text-foreground">${ad.cpa}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Convert score</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${getScoreColor(ad.convertScore)}`}
                      style={{ width: `${ad.convertScore}%` }}
                    />
                  </div>
                  <span className="font-semibold text-foreground">{ad.convertScore}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsCards;
