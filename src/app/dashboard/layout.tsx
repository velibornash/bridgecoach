"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardDataProvider } from "@/components/dashboard/DashboardDataProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The provider fetches /api/dashboard once for the whole dashboard tree, so
    // every child component reads real persisted progress instead of fixtures
    // and no component issues its own request (Sprint 58 §11, §26).
    <DashboardDataProvider>
      <div className="min-h-screen bg-bg-primary">
        <DashboardHeader />
        {children}
      </div>
    </DashboardDataProvider>
  );
}
