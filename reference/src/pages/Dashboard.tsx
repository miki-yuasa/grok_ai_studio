import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import AdsTable from "@/components/dashboard/AdsTable";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import StatsOverview from "@/components/dashboard/StatsOverview";
import { Sparkles } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    if (activeTab === "top-creatives") {
      return <AnalyticsCards />;
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium text-foreground">Welcome to your Dashboard</h1>
          <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            <Sparkles className="h-4 w-4" />
            Explore AI tasks
          </button>
        </div>

        <StatsOverview />
        <AdsTable />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default Dashboard;
