import React from "react";
import { Download, FileText, Database, ShieldAlert } from "lucide-react";
import { Student, FeeInvoice } from "../types";

interface ReportsViewProps {
  students: Student[];
  fees: Record<string, FeeInvoice[]>;
  attendance: Record<string, Array<{ studentId: string; status: string }>>;
}

export default function ReportsView({ students, fees, attendance }: ReportsViewProps) {
  const triggerDownload = (data: any, fileName: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportStudents = () => {
    triggerDownload(students, "dugsiga_students_roster.json");
  };

  const handleExportAttendance = () => {
    triggerDownload(attendance, "dugsiga_attendance_summary.json");
  };

  const handleExportFinancial = () => {
    triggerDownload(fees, "dugsiga_financial_ledger.json");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Warbixinnada & Analytics (Reports)
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Kala soo bax dhammaan xogta iyo dakhliyada dugsiga qaab nidaamsan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Export Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Diiwaanka Ardayda oo dhan</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Kala soo bax fayl dhamaystiran oo ka kooban magacyada, fasalrada, jinsiga, telefoonada waalidiinta, iyo xaalada firfircoonida ardayda oo idil.
            </p>
          </div>
          <button
            onClick={handleExportStudents}
            disabled={students.length === 0}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl border border-slate-100 dark:border-slate-600 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Download JSON
          </button>
        </div>

        {/* Attendance Export Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Diiwaanka Goobjoogga</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Kala soo bax dhaman xogta xaadirinta / goobjooga ardayda ee maalinlaha ah oo abaabulan taariikh ahaan si loo falanqeeyo maqnaanshaha.
            </p>
          </div>
          <button
            onClick={handleExportAttendance}
            disabled={Object.keys(attendance).length === 0}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl border border-slate-100 dark:border-slate-600 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Download JSON
          </button>
        </div>

        {/* Financial Export Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl w-fit">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xisaabaadka & Dakhliga</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Kala soo bax xogta biilasha iyo lacag bixinta ardayda, oo ay ku jiraan rasiidhada raad-raaca iyo inta dhiman ee la doonayo in lasoo xareeyo.
            </p>
          </div>
          <button
            onClick={handleExportFinancial}
            disabled={Object.keys(fees).length === 0}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl border border-slate-100 dark:border-slate-600 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Download JSON
          </button>
        </div>
      </div>
    </div>
  );
}
