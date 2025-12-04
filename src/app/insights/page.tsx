"use client";

import { AllocationHelper } from "@/components/insights/allocation-helper";
import { SpendingAnalysis } from "@/components/insights/spending-analysis";

export default function InsightsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Insights
        </h1>
      </div>
      <div className="grid gap-4 grid-cols-1">
        <SpendingAnalysis />
        <AllocationHelper />
      </div>
    </div>
  );
}
