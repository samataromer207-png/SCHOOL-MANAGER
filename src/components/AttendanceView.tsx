import React, { useState, useEffect } from "react";
import { Calendar, Save, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Student, AttendanceRecord } from "../types";

interface AttendanceViewProps {
  students: Student[];
  onSaveAttendance: (date: string, records: Array<{ studentId: string; status: string }>) => Promise<void>;
  fetchAttendanceForDate: (date: string) => Promise<AttendanceRecord[]>;
}

export default function AttendanceView({ students, onSaveAttendance, fetchAttendanceForDate }: AttendanceViewProps) {
  const getTodayString = () => new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [session, setSession] = useState<"before" | "after">("before");
  const [statusMap, setStatusMap] = useState<Record<string, "Present" | "Absent" | "Excused">>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter students who are active
  const activeStudents = students.filter((s) => s.status === "active");

  useEffect(() => {
    let active = true;
    const loadAttendance = async () => {
      setLoading(true);
      try {
        const queryKey = `${selectedDate}_${session}`;
        const records = await fetchAttendanceForDate(queryKey);
        if (!active) return;

        const newMap: Record<string, "Present" | "Absent" | "Excused"> = {};
        // Pre-fill matching records
        records.forEach((r) => {
          if (r.status !== "Late" as any) {
            newMap[r.studentId] = r.status;
          } else {
            newMap[r.studentId] = "Present"; // Fallback safety
          }
        });

        // For any student without a record, default to 'Present'
        activeStudents.forEach((student) => {
          if (!newMap[student.id]) {
            newMap[student.id] = "Present";
          }
        });

        setStatusMap(newMap);
      } catch (err) {
        console.error("Failed to load attendance", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAttendance();
    return () => {
      active = false;
    };
  }, [selectedDate, session, students]);

  const handleStatusChange = (studentId: string, status: "Present" | "Absent" | "Excused") => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: "Present" | "Absent") => {
    const newMap = { ...statusMap };
    activeStudents.forEach((s) => {
      newMap[s.id] = status;
    });
    setStatusMap(newMap);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = activeStudents.map((s) => ({
        studentId: s.id,
        status: statusMap[s.id] || "Present",
      }));
      const saveKey = `${selectedDate}_${session}`;
      await onSaveAttendance(saveKey, records);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upper header action blocks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            Daily Attendance
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Record student attendance for today or any specific date
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="date"
              max={getTodayString()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || activeStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Attendance
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-55 bg-indigo-50/20 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Active Session Selection</h4>
            <p className="text-xs text-gray-500 dark:text-gray-405">Configure daily rollcalls for both shifts.</p>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSession("before")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              session === "before"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Before Break Time
          </button>
          <button
            onClick={() => setSession("after")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              session === "after"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            After Break Time
          </button>
        </div>
      </div>

      {/* Main sheet view card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {/* Rapid control presets headers */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-bold text-gray-500 dark:text-gray-400 text-xs">Quick Actions:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll("Present")}
              disabled={loading || activeStudents.length === 0}
              className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/55 border border-emerald-200/50 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll("Absent")}
              disabled={loading || activeStudents.length === 0}
              className="text-xs font-semibold px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/55 border border-rose-200/50 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-lg transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Loading state / Attendance records table list */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-xs font-semibold">Loading attendance details...</p>
          </div>
        ) : activeStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Student Name</th>
                  <th className="p-4">Class</th>
                  <th className="p-4 text-center pr-6">Attendance Status ({session === "before" ? "Before Break" : "After Break"})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm font-medium">
                {activeStudents.map((s) => {
                  const currentStatus = statusMap[s.id] || "Present";
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-semibold text-gray-900 dark:text-white">{s.fullName}</div>
                      </td>
                      <td className="p-4 text-gray-400 text-xs">Class {s.class}</td>
                      <td className="p-4 pr-6">
                        {/* Custom Radios for Status */}
                        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                          {[
                            { value: "Present", label: "Present", color: "peer-checked:bg-emerald-600 peer-checked:text-white hover:bg-emerald-50 text-emerald-800 border-emerald-200 dark:hover:bg-emerald-950/20 bg-emerald-500/5 dark:bg-emerald-500/10 peer-checked:border-emerald-600" },
                            { value: "Absent", label: "Absent", color: "peer-checked:bg-rose-500 peer-checked:text-white hover:bg-rose-50 text-rose-800 border-rose-200 dark:hover:bg-rose-950/20 bg-rose-500/5 dark:bg-rose-500/10 peer-checked:border-rose-500" },
                            { value: "Excused", label: "Excused", color: "peer-checked:bg-blue-600 peer-checked:text-white hover:bg-blue-50 text-blue-800 border-blue-200 dark:hover:bg-blue-950/20 bg-blue-500/5 dark:bg-blue-500/10 peer-checked:border-blue-600" },
                          ].map((option) => (
                            <label key={option.value} className="cursor-pointer relative">
                              <input
                                type="radio"
                                name={`attendance_${s.id}`}
                                value={option.value}
                                checked={currentStatus === option.value}
                                onChange={() => handleStatusChange(s.id, option.value as any)}
                                className="sr-only peer"
                              />
                              <span className={`block px-4 py-1.5 text-xs font-bold rounded-lg border transition-all select-none ${option.color}`}>
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <XCircle className="w-16 h-16 text-slate-300 dark:text-slate-650 mb-2 stroke-1" />
            <p className="font-semibold text-gray-500 dark:text-gray-300">No Active Students.</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Please register active students to record attendance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
