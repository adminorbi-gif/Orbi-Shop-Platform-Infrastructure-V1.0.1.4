import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash, X, Shield, Users, CheckCircle, Clock, BarChart2, Star, Award } from "lucide-react";
import { useI18n } from "../../pages/AdminApp";
import { useDialog } from "../CustomDialogContext";
import { db } from "../../lib/db";

export function StaffAdmin({ currentStaff }: { currentStaff?: any }) {
  const [staff, setStaff] = useState<{id: string, name: string, email: string, role: string, status: string}[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useI18n();
  const { showAlert } = useDialog();
  const [showModal, setShowModal] = useState(false);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("worker");
  const [status, setStatus] = useState("pending_approval");

  const isSuperAdmin = currentStaff?.role === "super_admin";
  const isHR = currentStaff?.role === "human_resources";

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await db.getStaff();
      setStaff(data || []);
      const msgs = await db.getMessages();
      setMessages(msgs || []);
    } catch (e) {
      console.error("Failed to load staff & messages in StaffAdmin", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute staff performance KPIs
  const staffMetrics = useMemo(() => {
    const metrics: { [staffId: string]: { resolved: number; active: number } } = {};
    staff.forEach((st) => {
      const assigned = messages.filter((m) => m.assignedStaffId === st.id);
      const resolved = assigned.filter((m) => m.status === "resolved" || m.adminReply).length;
      const active = assigned.length - resolved;
      metrics[st.id] = { resolved, active };
    });
    return metrics;
  }, [staff, messages]);

  // Executive summary counts
  const summaryStats = useMemo(() => {
    const activeStaffCount = staff.filter((s) => s.status === "active").length;
    const supportAgents = staff.filter((s) => s.role === "support").length;
    const accountants = staff.filter((s) => s.role === "accountant").length;
    
    // Total resolved and pending tickets across staff
    const assignedTickets = messages.filter((m) => !!m.assignedStaffId);
    const resolvedCount = assignedTickets.filter((m) => m.status === "resolved" || m.adminReply).length;
    const pendingCount = assignedTickets.length - resolvedCount;

    return {
      activeStaffCount,
      supportAgents,
      accountants,
      resolvedCount,
      pendingCount,
    };
  }, [staff, messages]);

  const handleOpen = (s?: any) => {
    if (s) {
      if (!isSuperAdmin && s.role === 'super_admin') {
        showAlert("You do not have permission to edit Super Admin", "error");
        return;
      }
      setEditId(s.id);
      setName(s.name);
      setEmail(s.email);
      setRole(s.role || "worker");
      setStatus(s.status || "pending_approval");
    } else {
      setEditId(null);
      setName("");
      setEmail("");
      setRole("worker");
      setStatus(isSuperAdmin ? "active" : "pending_approval");
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let updated = [];
    
    const finalStatus = isSuperAdmin ? status : (editId ? status : "pending_approval");
    
    if (editId) {
      updated = staff.map(s => s.id === editId ? {id: editId, name, email: email.trim().toLowerCase(), role, status: finalStatus} : s);
    } else {
      updated = [...staff, {id: Date.now().toString(), name, email: email.trim().toLowerCase(), role, status: finalStatus}];
    }
    setStaff(updated);
    await db.saveStaff(updated as any);
    showAlert("Staff updated successfully", "success");
    setShowModal(false);
    loadData(); // Reload to refresh metrics
  };

  const removeStaff = async (id: string, name: string) => {
    const s = staff.find(x => x.id === id);
    if (!isSuperAdmin && s?.role === 'super_admin') {
      showAlert("Cannot remove Super Admin", "error");
      return;
    }
    if (!confirm(`Remove staff member ${name}?`)) return;
    const updated = staff.filter(x => x.id !== id);
    setStaff(updated);
    await db.saveStaff(updated as any);
    showAlert("Staff member removed", "success");
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading staff database...</div>;
  }

  if (!isSuperAdmin && !isHR) {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;
  }

  return (
    <div className="space-y-6" id="staff-admin-panel">
      {/* HR Executive Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Staff</p>
            <h4 className="text-xl font-black text-slate-800">{staff.length}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Active Staff</p>
            <h4 className="text-xl font-black text-slate-800">{summaryStats.activeStaffCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <BarChart2 size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Support Agents</p>
            <h4 className="text-xl font-black text-slate-800">{summaryStats.supportAgents}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <Clock size={18} className="animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Assigned Cases</p>
            <h4 className="text-xl font-black text-slate-800">{summaryStats.pendingCount} active</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Award size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Cases Resolved</p>
            <h4 className="text-xl font-black text-slate-800">{summaryStats.resolvedCount} closed</h4>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">
              Staff & HR Management
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Configure organizational roles, access clearances, and support metrics
            </p>
          </div>
          <button
            onClick={() => handleOpen()}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition hover:bg-slate-800 shadow-md border-none cursor-pointer"
          >
            <Plus size={14} /> Add Staff Member
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 font-extrabold text-slate-700">Staff Member</th>
                <th className="px-4 py-3 font-extrabold text-slate-700">System Clearance (Role)</th>
                <th className="px-4 py-3 font-extrabold text-slate-700">CRM Performance Metrics</th>
                <th className="px-4 py-3 font-extrabold text-slate-700">Clearance Status</th>
                <th className="px-4 py-3 font-extrabold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => {
                const kpi = staffMetrics[s.id] || { resolved: 0, active: 0 };
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800">{s.name}</span>
                        <span className="text-xs text-slate-400 font-medium">{s.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        s.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : s.role === 'support' 
                          ? 'bg-blue-100 text-blue-700' 
                          : s.role === 'accountant' 
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Shield size={10} />
                        {s.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {s.role === "support" || s.role === "super_admin" ? (
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle size={12} /> {kpi.resolved} Resolved
                          </span>
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <Clock size={12} /> {kpi.active} Active
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not Support Scoped</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        s.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : s.status === 'frozen' 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {s.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-4 space-x-2 text-right">
                      <button
                        onClick={() => handleOpen(s)}
                        className="text-slate-400 hover:text-indigo-600 transition p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-40 inline-flex"
                        disabled={!isSuperAdmin && s.role === 'super_admin'}
                        title="Edit profile & permissions"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => removeStaff(s.id, s.name)}
                        className="text-slate-400 hover:text-rose-600 transition p-1.5 hover:bg-rose-50 rounded-xl cursor-pointer disabled:opacity-40 inline-flex"
                        disabled={s.role === "super_admin" && staff.filter(x => x.role === "super_admin").length === 1}
                        title="Terminate contract"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    No registered staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm shadow-xl">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800">
                  {editId ? "Edit Staff Clearance" : "Add Staff Member"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition cursor-pointer border-none outline-none bg-transparent"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Corporate Email
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm"
                    placeholder="staff@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Clearance Role
                  </label>
                  <select
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm"
                    disabled={!isSuperAdmin && editId && staff.find(s=>s.id===editId)?.role === 'super_admin'}
                  >
                    <option value="worker">Worker (Restricted)</option>
                    <option value="support">Support Agent (Messages/Customers/CRM)</option>
                    <option value="accountant">Accountant (Orders/Payouts)</option>
                    <option value="human_resources">Human Resources (Staff/Contracts)</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin (Full Access)</option>}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Contract Status
                  </label>
                  <select
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm"
                    disabled={!isSuperAdmin}
                  >
                    <option value="pending_approval">Pending Approval</option>
                    <option value="active">Active</option>
                    <option value="frozen">Frozen (No Access)</option>
                  </select>
                  {!isSuperAdmin && (
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Only Super Admin can activate or freeze contracts.</p>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-slate-900 text-white hover:bg-slate-800 transition rounded-xl font-bold cursor-pointer border-none"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
