import React, { useState } from "react";
import { Plus, Edit2, Trash2, Clock, X, DollarSign, Calendar, Check, AlertCircle } from "lucide-react";
import { Student, FeeInvoice, SchoolSettings } from "../types";

interface FeesViewProps {
  students: Student[];
  fees: Record<string, FeeInvoice[]>;
  settings: SchoolSettings;
  onAddFee: (studentId: string, data: Omit<FeeInvoice, "id" | "createdAt" | "updatedAt" | "history">) => Promise<void>;
  onUpdateFee: (
    studentId: string,
    feeId: string,
    data: Partial<FeeInvoice> & { actionDesc?: string }
  ) => Promise<void>;
  onDeleteFee: (studentId: string, feeId: string) => Promise<void>;
}

export default function FeesView({ students, fees, settings, onAddFee, onUpdateFee, onDeleteFee }: FeesViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeInvoice | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Create/Edit Invoice Form
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [amount, setAmount] = useState(settings.feeAmount.toString());
  const [paidAmount, setPaidAmount] = useState("0");
  const [loading, setLoading] = useState(false);

  // Active students list for options
  const activeStudents = students.filter((s) => s.status === "active");

  // Flattened invoices linked with corresponding student names
  let invoiceList: Array<FeeInvoice & { studentId: string; studentName: string }> = [];
  Object.keys(fees).forEach((sid) => {
    const student = students.find((s) => s.id === sid);
    const studentName = student ? student.fullName : "Unknown Student";
    fees[sid].forEach((f) => {
      invoiceList.push({
        ...f,
        studentId: sid,
        studentName,
      });
    });
  });

  // Sort chronological order (newest billings first)
  invoiceList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openAddModal = () => {
    setSelectedFee(null);
    setSelectedStudentId("");
    setStudentId(activeStudents[0]?.id || "");
    setMonth(getMonthName(new Date().getMonth()));
    setYear(new Date().getFullYear().toString());
    setAmount(settings.feeAmount.toString());
    setPaidAmount("0");
    setModalOpen(true);
  };

  const openEditModal = (invoice: FeeInvoice & { studentId: string }) => {
    setSelectedFee(invoice);
    setSelectedStudentId(invoice.studentId);
    setStudentId(invoice.studentId);
    setMonth(invoice.month);
    setYear(invoice.year.toString());
    setAmount(invoice.amount.toString());
    setPaidAmount(invoice.paidAmount.toString());
    setModalOpen(true);
  };

  const openHistoryModal = (invoice: FeeInvoice & { studentId: string }) => {
    setSelectedFee(invoice);
    setSelectedStudentId(invoice.studentId);
    setHistoryModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !month || !year || !amount) return;

    setLoading(true);
    try {
      const amt = parseFloat(amount);
      const paid = parseFloat(paidAmount);

      if (selectedFee) {
        // Increment payment logic
        const paymentIncrement = paid - selectedFee.paidAmount;
        const msg = paymentIncrement > 0 
          ? `Recorded payment of ${settings.currency} ${paymentIncrement.toFixed(2)}` 
          : "Updated billing invoice details";

        await onUpdateFee(selectedStudentId, selectedFee.id, {
          month,
          year: parseInt(year),
          amount: amt,
          paidAmount: paid,
          actionDesc: msg,
        });
      } else {
        await onAddFee(studentId, {
          month,
          year: parseInt(year),
          amount: amt,
          paidAmount: paid,
          status: paid >= amt ? "paid" : paid > 0 ? "partial" : "unpaid",
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId: string, studentId: string, studentName: string, billingMonth: string) => {
    if (
      confirm(
        `Ma oday ka tahay inaad tirtirto biilka/invoice-ka bisha ${billingMonth} ee ardayga: ${studentName}? (Are you sure you want to delete this invoice?)`
      )
    ) {
      try {
        await onDeleteFee(studentId, invoiceId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  function getMonthName(index: number) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[index] || "January";
  }

  const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header controls layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Khidmadaha & Xisaabaadka (Fees & Finance)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Maamul biilasha ardayda, qaado lacagaha, oo baadh xisaabaadka
          </p>
        </div>
        <button
          onClick={openAddModal}
          disabled={activeStudents.length === 0}
          className="flex items-center gap-2 self-start md:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Ledger Table listing */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {invoiceList.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/20 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Student Name</th>
                  <th className="p-4">Billing Period</th>
                  <th className="p-4">Total Fee</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Billing Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm font-medium">
                {invoiceList.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group"
                  >
                    <td className="p-4 pl-6 font-semibold text-gray-900 dark:text-gray-100">
                      {invoice.studentName}
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-300 font-medium">
                      {invoice.month} {invoice.year}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-gray-100 font-bold">
                      {settings.currency} {invoice.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      {settings.currency} {invoice.paidAmount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`badge ${
                          invoice.status === "paid"
                            ? "success"
                            : invoice.status === "partial"
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-1 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(invoice)}
                        className="p-1 px-2.5 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-600 hover:text-indigo-600 hover:border-indigo-600 rounded-lg transition-all text-xs inline-flex items-center gap-1"
                        title="Diiwaangeli Lacag"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Modify/Pay
                      </button>
                      <button
                        onClick={() => openHistoryModal(invoice)}
                        className="p-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition-all inline-flex items-center gap-1 text-xs"
                        title="Audit Receipts Trail"
                      >
                        <Clock className="w-3.5 h-3.5" /> Receipts
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id, invoice.studentId, invoice.studentName, invoice.month)}
                        className="p-1 px-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all inline-flex items-center gap-1 text-xs"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <DollarSign className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
              <p className="font-semibold text-gray-500 dark:text-gray-300">No student billing records found.</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Create new monthly billing invoices for active students using the button above.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Adding/Editing invoice popup modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedFee ? "Modify Billing / Record Payment" : "Create New Tuition Invoice"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Select Student *
                </label>
                <select
                  disabled={!!selectedFee}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                >
                  {activeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} - (Class: {s.class})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Month *
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  >
                    {monthsList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Total Amount ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Amount Paid ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-all inline-flex items-center gap-1.5"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {selectedFee ? "Record Payment" : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Ledger timeline trails modal overlay */}
      {historyModalOpen && selectedFee && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-lg w-full rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Payment History Trial & Receipts
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  List of transactions and payments logged under Invoice ID: {selectedFee.id.slice(0, 11)}
                </p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-6">
              <div className="flow-root max-h-72 overflow-y-auto pr-1">
                <ul className="-mb-8">
                  {selectedFee.history && selectedFee.history.length > 0 ? (
                    selectedFee.history.map((h, hIdx) => (
                      <li key={hIdx}>
                        <div className="relative pb-8">
                          {hIdx !== selectedFee.history.length - 1 && (
                            <span
                              className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-700"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex items-start space-x-3">
                            <div>
                              <span className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center ring-8 ring-white dark:ring-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                #{hIdx + 1}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 py-1.5">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {h.action}
                              </p>
                              <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                                <span className="font-medium">Amount referenced: {settings.currency} {h.amount.toFixed(2)}</span>
                                <time className="font-semibold">{new Date(h.date).toLocaleString("so-SO")}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 text-xs py-4">No receipt history logged for this invoice.</p>
                  )}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-right">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
