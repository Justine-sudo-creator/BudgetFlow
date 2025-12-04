"use client";

import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Settings
        </h1>
      </div>
      <div className="grid gap-4">
        <SettingsForm />
      </div>
    </div>
  );
}
