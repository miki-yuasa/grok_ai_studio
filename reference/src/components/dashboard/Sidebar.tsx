import { Home, Inbox, Plus, FolderOpen, Trophy, Circle, Rocket, Zap, MousePointer, FileText, BarChart3, Video, Image, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
const Sidebar = ({
  activeTab,
  onTabChange
}: SidebarProps) => {
  const mainNavItems = [{
    id: "home",
    label: "Home",
    icon: Home
  }, {
    id: "inbox",
    label: "Inbox",
    icon: Inbox
  }];
  const reportItems = [{
    id: "top-creatives",
    label: "Top Creatives",
    icon: Trophy,
    color: "text-amber-500"
  }, {
    id: "all-active",
    label: "All Active Ads",
    icon: Circle,
    color: "text-emerald-500"
  }, {
    id: "new-launches",
    label: "New Launches",
    icon: Rocket,
    color: "text-rose-500"
  }, {
    id: "top-hooks",
    label: "Top Hooks",
    icon: Zap,
    color: "text-amber-400"
  }, {
    id: "top-clicks",
    label: "Top Clicks",
    icon: MousePointer,
    color: "text-orange-500"
  }, {
    id: "top-copy",
    label: "Top Copy",
    icon: FileText,
    color: "text-sky-500"
  }, {
    id: "ad-type",
    label: "Ad Type Comparison",
    icon: BarChart3,
    color: "text-orange-400"
  }, {
    id: "video",
    label: "Video Analysis",
    icon: Video,
    color: "text-violet-500"
  }, {
    id: "static",
    label: "Static Analysis",
    icon: Image,
    color: "text-neutral-400"
  }, {
    id: "length",
    label: "Ad Length Comparison",
    icon: Clock,
    color: "text-indigo-500"
  }];
  return <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* User section */}
      <div className="flex items-center gap-3 border-b border-sidebar-border p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
          U
        </div>
        <span className="font-medium text-foreground">User Account</span>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {mainNavItems.map(item => <button key={item.id} onClick={() => onTabChange(item.id)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", activeTab === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>)}
        </div>

        <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-sidebar-accent">
          <Plus className="h-4 w-4" />
          Create report
        </button>

        {/* Folders section */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Folders
            </span>
            <Plus className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-sidebar-foreground">Reports</span>
            </div>

            <div className="ml-4 space-y-1">
              {reportItems.map(item => <button key={item.id} onClick={() => onTabChange(item.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors", activeTab === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                  <item.icon className={cn("h-4 w-4", item.color)} />
                  {item.label}
                </button>)}
            </div>
          </div>
        </div>
      </nav>

      {/* Trial badge */}
      <div className="border-t border-sidebar-border p-4">
        
      </div>
    </div>;
};
export default Sidebar;