import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Ad {
  id: string;
  status: "active" | "paused" | "completed" | "draft";
  date: string;
  content: string;
  attachments: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

const sampleAds: Ad[] = [
  {
    id: "1",
    status: "active",
    date: "Dec 5, 2024",
    content: "Introducing our new product line - 50% off launch special!",
    attachments: 2,
    impressions: 45230,
    clicks: 1205,
    ctr: 2.66,
  },
  {
    id: "2",
    status: "active",
    date: "Dec 3, 2024",
    content: "Holiday sale starts now! Don't miss out on amazing deals.",
    attachments: 3,
    impressions: 32150,
    clicks: 876,
    ctr: 2.72,
  },
  {
    id: "3",
    status: "paused",
    date: "Dec 1, 2024",
    content: "Limited time offer: Free shipping on all orders over $50",
    attachments: 1,
    impressions: 28900,
    clicks: 654,
    ctr: 2.26,
  },
  {
    id: "4",
    status: "completed",
    date: "Nov 28, 2024",
    content: "Black Friday deals - Up to 70% off everything!",
    attachments: 4,
    impressions: 89500,
    clicks: 3420,
    ctr: 3.82,
  },
  {
    id: "5",
    status: "draft",
    date: "Nov 25, 2024",
    content: "New year, new you - Fitness collection launching soon",
    attachments: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
  },
];

const statusColors = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-secondary text-muted-foreground border-border",
  draft: "bg-secondary text-muted-foreground border-border",
};

const AdsTable = () => {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-medium text-foreground">Campaign Ads</h2>
        <p className="text-sm text-muted-foreground">
          Manage and monitor your active ad campaigns
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Date</TableHead>
            <TableHead className="text-muted-foreground">Content</TableHead>
            <TableHead className="text-muted-foreground">Attachments</TableHead>
            <TableHead className="text-muted-foreground text-right">
              Impressions
            </TableHead>
            <TableHead className="text-muted-foreground text-right">Clicks</TableHead>
            <TableHead className="text-muted-foreground text-right">CTR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleAds.map((ad) => (
            <TableRow
              key={ad.id}
              className="border-border hover:bg-secondary/50 cursor-pointer"
            >
              <TableCell>
                <Badge variant="outline" className={statusColors[ad.status]}>
                  {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{ad.date}</TableCell>
              <TableCell className="max-w-xs truncate text-foreground">
                {ad.content}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(ad.attachments, 3) }).map((_, i) => (
                    <div key={i} className="h-6 w-6 rounded bg-muted" />
                  ))}
                  {ad.attachments > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{ad.attachments - 3}
                    </span>
                  )}
                  {ad.attachments === 0 && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium text-foreground">
                {ad.impressions > 0 ? ad.impressions.toLocaleString() : "—"}
              </TableCell>
              <TableCell className="text-right font-medium text-foreground">
                {ad.clicks > 0 ? ad.clicks.toLocaleString() : "—"}
              </TableCell>
              <TableCell className="text-right font-medium text-foreground">
                {ad.ctr > 0 ? `${ad.ctr}%` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdsTable;
