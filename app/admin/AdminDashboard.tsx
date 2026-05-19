"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";

type TenantRow = {
  id: string;
  slug: string;
  businessName: string;
  assignedTwilioNumber: string;
  status: string;
  voiceProvider: string;
  systemPrompt: string;
  calendarWebhookUrl?: string;
  huggingFaceModelId: string;
  maxMonthlyMinutes: number;
  maxMonthlySpendCents: number;
};

type Analytics = {
  callsHandled: number;
  appointmentsBooked: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [selected, setSelected] = useState<TenantRow | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    callsHandled: 0,
    appointmentsBooked: 0,
    revenueCents: 0,
    costCents: 0,
    profitCents: 0
  });
  const [status, setStatus] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/analytics");
    const data = await response.json();

    if (data.ok) {
      setTenants(data.tenants || []);
      setAnalytics(data.analytics?.totals || analytics);
      setSelected((current) => current || data.tenants?.[0] || null);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo<ColumnDef<TenantRow>[]>(
    () => [
      {
        header: "Business",
        accessorKey: "businessName"
      },
      {
        header: "Phone",
        accessorKey: "assignedTwilioNumber"
      },
      {
        header: "Status",
        accessorKey: "status"
      },
      {
        header: "Voice",
        accessorKey: "voiceProvider"
      }
    ],
    []
  );
  const table = useReactTable({
    data: tenants,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  async function saveSelected() {
    if (!selected) return;
    setStatus("Saving...");

    const response = await fetch(`/api/admin/tenants/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected)
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setStatus(data.error || "Could not save tenant.");
      return;
    }

    setStatus("Saved.");
    await refresh();
  }

  async function provisionVapi() {
    if (!selected) return;
    setStatus("Provisioning Vapi assistant...");

    const response = await fetch(`/api/admin/tenants/${selected.id}/provision-vapi`, {
      method: "POST"
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setStatus(data.error || "Could not provision Vapi.");
      return;
    }

    setStatus(`Vapi assistant ready: ${data.assistantId}`);
    await refresh();
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-8 text-[#101827]">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">
              Revenue Guard Command
            </p>
            <h1 className="text-4xl font-black">Admin dashboard</h1>
          </div>
          <button
            onClick={() => void refresh()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold shadow-sm"
          >
            Refresh
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Calls handled", analytics.callsHandled.toLocaleString()],
            ["Appointments booked", analytics.appointmentsBooked.toLocaleString()],
            ["Revenue", money(analytics.revenueCents)],
            ["Profit", money(analytics.profitCents)]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100">
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 font-black">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row.original)}
                    className="cursor-pointer border-t border-slate-100 hover:bg-blue-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Tenant editor</h2>
            {selected ? (
              <div className="mt-4 space-y-3">
                <input
                  value={selected.businessName}
                  onChange={(event) => setSelected({ ...selected, businessName: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  value={selected.assignedTwilioNumber}
                  onChange={(event) =>
                    setSelected({ ...selected, assignedTwilioNumber: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <select
                  value={selected.voiceProvider}
                  onChange={(event) => setSelected({ ...selected, voiceProvider: event.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="VAPI">Vapi</option>
                  <option value="LIVEKIT">LiveKit</option>
                  <option value="CUSTOM_STREAM">Custom Stream</option>
                  <option value="EXTERNAL_WEBHOOK">External Webhook</option>
                </select>
                <textarea
                  value={selected.systemPrompt}
                  onChange={(event) => setSelected({ ...selected, systemPrompt: event.target.value })}
                  rows={8}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  value={selected.calendarWebhookUrl || ""}
                  onChange={(event) =>
                    setSelected({ ...selected, calendarWebhookUrl: event.target.value })
                  }
                  placeholder="Calendar webhook URL"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={saveSelected} className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white">
                    Save tenant
                  </button>
                  <button
                    onClick={provisionVapi}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-bold"
                  >
                    Provision Vapi
                  </button>
                </div>
                {status ? <p className="text-sm font-bold text-blue-700">{status}</p> : null}
              </div>
            ) : (
              <p className="mt-4 text-slate-600">Select a tenant to edit.</p>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
