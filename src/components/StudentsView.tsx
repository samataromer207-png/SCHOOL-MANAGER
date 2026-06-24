import React, { useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  GraduationCap,
  Phone,
  User,
  Check,
  AlertTriangle,
  Mail,
  Calendar,
  MapPin,
  Award,
  BookOpen,
} from "lucide-react";
import { Student, Course } from "../types";

interface StudentsViewProps {
  students: Student[];
  currentUser: any;
  courses: Course[];
  onAddStudent: (data: Omit<Student, "id" | "createdAt">) => Promise<void>;
  onUpdateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onAddGrade: (studentId: string, gradeData: any) => Promise<void>;
  onDeleteGrade: (studentId: string, gradeId: string) => Promise<void>;
}

export default function StudentsView({
  students,
  currentUser,
  courses,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddGrade,
  onDeleteGrade,
}: StudentsViewProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [curStudent, setCurStudent] = useState<Student | null>(null);

  // Form Fields for Student Personal Info & Contact Info
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [gender, setGender] = useState("Male");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);

  // Academic History Management Overlay state
  const [academicModalOpen, setAcademicModalOpen] = useState(false);
  const [selectedStudentForAcademic, setSelectedStudentForAcademic] = useState<Student | null>(null);

  // Grade Form state
  const [gradeCourseName, setGradeCourseName] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [gradeTerm, setGradeTerm] = useState("Term 1");
  const [gradeComments, setGradeComments] = useState("");

  const userRole = currentUser?.role || "Admin";
  const isStudent = userRole === "Student";
  const isTeacher = userRole === "Teacher";
  const isAdmin = userRole === "Admin";

  // Filter student list
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.class.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const openAddModal = () => {
    setCurStudent(null);
    setFullName("");
    setStudentClass("");
    setGender("Male");
    setGuardianPhone("");
    setStatus("active");
    setDateOfBirth("");
    setAddress("");
    setEmail("");
    setPhone("");
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setCurStudent(student);
    setFullName(student.fullName);
    setStudentClass(student.class);
    setGender(student.gender || "Male");
    setGuardianPhone(student.guardianPhone || "");
    setStatus(student.status);
    setDateOfBirth(student.dateOfBirth || "");
    setAddress(student.address || "");
    setEmail(student.email || "");
    setPhone(student.phone || "");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !studentClass) return;

    setLoading(true);
    try {
      if (curStudent) {
        await onUpdateStudent(curStudent.id, {
          fullName,
          class: studentClass,
          gender,
          guardianPhone,
          status,
          dateOfBirth,
          address,
          email,
          phone,
        });
      } else {
        await onAddStudent({
          fullName,
          class: studentClass,
          gender,
          guardianPhone,
          status,
          dateOfBirth,
          address,
          email,
          phone,
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Ma oday ka tahay inaad tirtirto ardayga: ${name}? (Are you sure you want to delete ${name}?)`)) {
      try {
        await onDeleteStudent(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Open Performance Module Modal
  const openAcademicModal = (student: Student) => {
    setSelectedStudentForAcademic(student);
    setGradeValue("");
    setGradeComments("");
    setGradeCourseName("");
    setAcademicModalOpen(true);
  };

  // Handlers for Academic Grades
  const handleAddGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAcademic) return;
    if (!gradeCourseName.trim() || !gradeValue.trim()) {
      alert("Please enter the course name and grade value.");
      return;
    }

    // Assigned class constraint check for Teachers
    if (isTeacher && currentUser?.teacherClass) {
      if (selectedStudentForAcademic.class.trim().toLowerCase() !== currentUser.teacherClass.trim().toLowerCase()) {
        alert(`Access restricted to your assigned class: ${currentUser.teacherClass}.`);
        return;
      }
    }

    const payload = {
      courseId: "manual-" + Math.random().toString(36).substring(2, 7),
      courseName: gradeCourseName.trim(),
      grade: gradeValue.trim(),
      term: gradeTerm,
      comments: gradeComments.trim(),
    };

    try {
      await onAddGrade(selectedStudentForAcademic.id, payload);
      // Refresh current local overlay object references
      const freshStudent = students.find((s) => s.id === selectedStudentForAcademic.id);
      if (freshStudent) {
        setSelectedStudentForAcademic(freshStudent);
      }
      setGradeValue("");
      setGradeComments("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeDelete = async (gradeId: string) => {
    if (!selectedStudentForAcademic) return;
    
    // Assigned class check for Teachers
    if (isTeacher && currentUser?.teacherClass) {
      if (selectedStudentForAcademic.class.trim().toLowerCase() !== currentUser.teacherClass.trim().toLowerCase()) {
        alert("Eber! Kaliya waxaad tirtiri kartaa dhibcaha fasalkaaga laguu xil-saaray.");
        return;
      }
    }

    if (confirm("Ma hubtaa inaad tirtirto dhibcahan maadada?")) {
      try {
        await onDeleteGrade(selectedStudentForAcademic.id, gradeId);
        const freshStudent = students.find((s) => s.id === selectedStudentForAcademic.id);
        if (freshStudent) {
          setSelectedStudentForAcademic(freshStudent);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Check if students have current record
  const viewStudentGradesList = selectedStudentForAcademic
    ? students.find((s) => s.id === selectedStudentForAcademic.id)?.academicHistory || []
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header with Search + Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Maamulka Ardayda (Student Database)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Diiwaangeli, koontarool, oo maamul macluumaadka ardayda iyo dhibcahooda maadooyinka
          </p>
        </div>
        {!isStudent && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 self-start md:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        )}
      </div>

      {/* Primary list filter card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Search Header layout */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Raadi magaca ardayga, iimaylka, fasalka, ama heerka..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none border-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 font-medium"
          />
        </div>

        {/* Database Table Rendering */}
        <div className="overflow-x-auto">
          {filteredStudents.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-900/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Student Name</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Contact Detail</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Academic Log</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm font-medium">
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group"
                  >
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold font-heading text-xs">
                        {s.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-950 dark:text-gray-100">
                          {s.fullName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          ID: {s.id}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-350">
                      {s.class}
                    </td>
                    <td className="p-4 text-xs text-gray-500 dark:text-gray-350 space-y-0.5">
                      {s.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</div>}
                      {s.phone ? (
                        <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</div>
                      ) : (
                        s.guardianPhone && <div className="flex items-center gap-1"><User className="w-3 h-3" />{s.guardianPhone} (Waalid)</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        s.gender === "Female"
                          ? "bg-fuchsia-50 dark:bg-fuchsia-950 text-fuchsia-600 dark:text-fuchsia-300"
                          : "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300"
                      }`}>
                        {s.gender === "Female" ? "Dhedig" : "Lab"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => openAcademicModal(s)}
                        className="p-1 px-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-350 rounded-lg hover:bg-emerald-100 transition-all text-xs inline-flex items-center gap-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Grades ({s.academicHistory?.length || 0})
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${s.status === "active" ? "success" : "danger"}`}>
                        {s.status === "active" ? "Firfircoon" : "Hakin"}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-1.5 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {!isStudent && (
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1 px-2.5 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-600 hover:text-indigo-600 hover:border-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all text-xs inline-flex items-center gap-1"
                          title="Tafatir"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(s.id, s.fullName)}
                          className="p-1 px-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-all text-xs inline-flex items-center gap-1"
                          title="Tirtir"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                      {isStudent && (
                        <span className="text-xs text-slate-400 italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
              <p className="font-semibold text-gray-500 dark:text-gray-300">Arday lama helin (No students found).</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Ma jiro arday buuxiyey shuruudaha ama raadinta hadda.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Primary CRUD student profile popup dialog overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-2xl w-full rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fade-in max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {curStudent ? "Tafatir Ardayg (Edit Student Profile)" : "Ku Kordhi Ardayg (Create Student SIS Record)"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b pb-1">
                Xogta Shaqsiga ah (Personal Info)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-450 dark:text-gray-300 block mb-1">
                    Magaca oo Dhamaystiran (Full Name) *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="t.g. Ayuub Maxamuud"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-450 dark:text-gray-300 block mb-1">
                    Taariikhda dhashay (Date of Birth)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-450 dark:text-gray-300 block mb-1">
                    Fasalka (Class) *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="t.g. Form 4B"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-450 dark:text-gray-300 block mb-1">
                    Jinsiga (Gender)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                  >
                    <option value="Male">Lab (Male)</option>
                    <option value="Female">Dhedig (Female)</option>
                  </select>
                </div>
              </div>

              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b pb-1 pt-2">
                Xiriirka & Maamulida (Contact Details)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-450 dark:text-gray-300 block mb-1">
                    Iimaylka ardayga (Student Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ayuub@dugsiga.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-450 dark:text-gray-300 block mb-1">
                    Telefoonka gaarka ah (Personal Phone)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="t.g. +25261..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-450 dark:text-gray-300 block mb-1">
                    Telefoonka Waalidka (Guardian Phone)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="t.g. +25261xxxxxxx"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-450 dark:text-gray-300 block mb-1">
                    Xaaladda Firfircoonida (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                  >
                    <option value="active">Active (Firfircoon/Dugsan)</option>
                    <option value="inactive">Inactive (Hakin/Dhiman)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-450 dark:text-gray-300 block mb-1">
                  Cinwaanka Guriga (Physical Address)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="t.g. Wadada Makka Al-Mukarrama, Hodan, Mogadishu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel (Ka tanaasul)
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
                  Save Profile (Diiwaangeli)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Special academic report list history performance management modal */}
      {academicModalOpen && selectedStudentForAcademic && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-3xl w-full rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fade-in max-h-[92vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-indigo-50/10 dark:bg-slate-900/30">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-indigo-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    Taariikhda Waxbarashada (Academic Record log)
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ardayga: <b className="text-indigo-600 dark:text-indigo-400">{selectedStudentForAcademic.fullName}</b> | Class: <b>{selectedStudentForAcademic.class}</b>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAcademicModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Form to append new grade values - restricted to Admins and Teachers */}
              {!isStudent ? (
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 block mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Record New Academic Grade
                  </h3>

                  <form onSubmit={handleAddGradeSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-450 dark:text-gray-300 block mb-0.5 uppercase tracking-wider">
                          Course / Subject Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mathematics"
                          value={gradeCourseName}
                          onChange={(e) => setGradeCourseName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-450 dark:text-gray-300 block mb-0.5 uppercase tracking-wider">
                          Grade Value *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. A, B+, 95%"
                          value={gradeValue}
                          onChange={(e) => setGradeValue(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-450 dark:text-gray-300 block mb-0.5 uppercase tracking-wider">
                          Term / Semester
                        </label>
                        <select
                          value={gradeTerm}
                          onChange={(e) => setGradeTerm(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500 font-semibold"
                        >
                          <option value="Term 1">Term 1</option>
                          <option value="Term 2">Term 2</option>
                          <option value="Term 3">Term 3</option>
                          <option value="Semester A">Semester A</option>
                          <option value="Semester B">Semester B</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-450 dark:text-gray-300 block mb-0.5 uppercase tracking-wider">
                        Remarks / Comments
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Excellent classroom participation and test scores..."
                        value={gradeComments}
                        onChange={(e) => setGradeComments(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
                      >
                        Post Grade
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              {/* History list elements */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Xogta dhibcaha ee hore loo dhigay (Academic Performance Logs)
                </h3>

                {viewStudentGradesList.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                    {viewStudentGradesList.map((g) => (
                      <div
                        key={g.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium dark:text-gray-200"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-950 dark:text-white">
                              {g.courseName}
                            </span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 text-slate-500 rounded font-semibold">
                              {g.term}
                            </span>
                          </div>
                          
                          {g.comments && (
                            <p className="text-gray-400 italic text-xs leading-relaxed">
                              " {g.comments} "
                            </p>
                          )}
                          
                          <div className="text-[10px] text-gray-400 space-x-1 font-mono">
                            <span>Macallin:</span>
                            <span className="text-indigo-600 font-semibold">{g.teacherName || "Nidaamka"}</span>
                            <span>• {g.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="flex flex-col items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-xl text-sm font-sans border border-indigo-100 dark:border-indigo-900">
                            {g.grade}
                          </div>

                          {!isStudent && (
                            <button
                              onClick={() => handleGradeDelete(g.id)}
                              className="p-1 px-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-100 rounded-md transition-all text-[10px] inline-flex items-center"
                              title="Tirtir dhibcaha"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Award className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto stroke-1 mb-2" />
                    <p className="font-medium text-xs">Wax dhibco ah looma hayo ardayga hadda (No academic grades recorded yet).</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-900/30">
              <button
                onClick={() => setAcademicModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition-all"
              >
                Done (Xir)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
