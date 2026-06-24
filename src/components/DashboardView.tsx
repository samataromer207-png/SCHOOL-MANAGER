import React from "react";
import { Users, UserCheck, DollarSign, AlertCircle, TrendingUp, CalendarDays } from "lucide-react";
import { Student, FeeInvoice, SchoolSettings } from "../types";

interface DashboardViewProps {
  students: Student[];
  fees: Record<string, FeeInvoice[]>;
  settings: SchoolSettings;
  attendance: Record<string, Array<{ studentId: string; status: string }>>;
}

export default function DashboardView({ students, fees, settings, attendance }: DashboardViewProps) {
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "active").length;

  let totalCollected = 0;
  let totalPending = 0;

  Object.values(fees).forEach((studentInvoices) => {
    studentInvoices.forEach((invoice) => {
      totalCollected += invoice.paidAmount || 0;
      totalPending += Math.max(0, invoice.amount - invoice.paidAmount);
    });
  });

  // Calculate simple stats for custom charts
  // 1. Attendance Overview (removing late)
  let presentCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  let totalAttRecords = 0;

  Object.values(attendance).forEach((dayRecords) => {
    dayRecords.forEach((rec) => {
      totalAttRecords++;
      if (rec.status === "Present") presentCount++;
      else if (rec.status === "Absent") absentCount++;
      else if (rec.status === "Excused") excusedCount++;
    });
  });

  // Default proportions if database is empty
  const presentPct = totalAttRecords > 0 ? Math.round((presentCount / totalAttRecords) * 100) : 88;
  const absentPct = totalAttRecords > 0 ? Math.round((absentCount / totalAttRecords) * 100) : 8;
  const excusedPct = totalAttRecords > 0 ? Math.round((excusedCount / totalAttRecords) * 100) : 4;

  // 2. Class-by-class student distribution
  const classCounts: Record<string, number> = {};
  students.forEach((s) => {
    if (s.status === "active") {
      classCounts[s.class] = (classCounts[s.class] || 0) + 1;
    }
  });

  const sortedClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            System Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time analytics and statistics for {settings.schoolName}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glow-card bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Students</span>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{totalStudents}</div>
            <p className="text-xs text-gray-400">Total registered profiles</p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
        </div>

        <div className="glow-card bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Students</span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{activeStudents}</div>
            <p className="text-xs text-gray-400">Students actively enrolled</p>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <UserCheck className="w-8 h-8" />
          </div>
        </div>

        <div className="glow-card bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fees Collected</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {settings.currency} {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-400">Total processed revenue</p>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>

        <div className="glow-card bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Balance</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {settings.currency} {totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-400">Awaiting clearance</p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl">
            <AlertCircle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Visual Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Finance collection breakdown diagram */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Financial Status Ratio
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
              Ledger
            </span>
          </div>

          {/* Combined Visual Stack */}
          {totalCollected + totalPending > 0 ? (
            <div className="space-y-6">
              <div className="relative h-6 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                <div
                  style={{ width: `${(totalCollected / (totalCollected + totalPending)) * 100}%` }}
                  className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-500"
                  title="Collected"
                />
                <div
                  style={{ width: `${(totalPending / (totalCollected + totalPending)) * 100}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title="Pending"
                />
              </div>

              {/* Legends with detail math */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Collected</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {Math.round((totalCollected / (totalCollected + totalPending)) * 100)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {settings.currency} {totalCollected.toFixed(2)}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pending</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {Math.round((totalPending / (totalCollected + totalPending)) * 100)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {settings.currency} {totalPending.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
              <p className="text-sm">No financial bills filed yet.</p>
            </div>
          )}

          {/* Class-wise Active student load list */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
              Student Distribution by Class
            </h4>
            {sortedClasses.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {sortedClasses.slice(0, 5).map(([className, count]) => {
                  const maxCount = Math.max(...Object.values(classCounts));
                  const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={className} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Class {className}</span>
                        <span className="font-semibold text-gray-400">{count} active students</span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="bg-indigo-500/80 h-full rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">No active students registered.</p>
            )}
          </div>
        </div>

        {/* Attendance Pie/Ratio block */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Attendance Rates
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                Log Statistics
              </span>
            </div>

            {/* Custom ratio bars */}
            <div className="space-y-4">
              {/* Present */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{presentPct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div style={{ width: `${presentPct}%` }} className="h-full bg-emerald-500 rounded-full" />
                </div>
              </div>

              {/* Absent */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
                  </span>
                  <span className="font-bold text-rose-500">{absentPct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div style={{ width: `${absentPct}%` }} className="h-full bg-rose-500 rounded-full" />
                </div>
              </div>

              {/* Excused */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Excused
                  </span>
                  <span className="font-bold text-blue-500">{excusedPct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div style={{ width: `${excusedPct}%` }} className="h-full bg-blue-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs text-gray-400 italic text-center mt-6">
            Rollcall entries are managed and calculated per shifts through the Attendance panel.
          </div>
        </div>
      </div>
    </div>
  );
}
