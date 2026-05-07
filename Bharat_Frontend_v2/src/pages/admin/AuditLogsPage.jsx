import { useState, useEffect } from "react";
import { API_USERS } from "../../lib/apiConfig.js";
import {
  Users,
  Search,
  UserCheck,
  UserPlus,
  ShieldAlert,
  ChevronDown
} from "lucide-react";

// ── Inline Dropdown ────────────────────────────────────────────────────────────

function InlineDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 text-[12px] font-bold text-[#0F172A] hover:border-slate-300 transition-colors"
      >
        {value}
        <ChevronDown size={12} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-lg z-50 py-1 min-w-full">
          {options.map((o) => (
            <button
              key={o}
              onMouseDown={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[12px] font-medium hover:bg-slate-50 whitespace-nowrap border-l-[3px] transition-colors
                ${value === o ? "text-[#0F172A] bg-slate-50 border-[#0F172A]" : "text-slate-600 border-transparent"}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AuditLogsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const ROLES = ["All", "Admin", "User", "Reviewer"];

  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_USERS, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.users) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.full_name && u.full_name.toLowerCase().includes(q)) || (u.phone_number && u.phone_number.includes(q));
    const matchRole = roleFilter === "All" || true; // Modify if role logic is added
    return matchSearch && matchRole;
  });

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">User Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Manage system users and access roles
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white text-[13px] font-bold hover:bg-slate-800 transition-colors">
            <UserPlus size={14} />
            Invite User
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm p-5 flex items-start gap-4">
          <div className="h-11 w-11 bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Users
            </p>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{users.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-5 flex items-start gap-4">
          <div className="h-11 w-11 bg-green-50 flex items-center justify-center shrink-0 text-green-500">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Active Users
            </p>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{users.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 border-l-4 border-l-amber-400 shadow-sm p-5 flex items-start gap-4">
          <div className="h-11 w-11 bg-amber-50 flex items-center justify-center shrink-0 text-amber-500">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pending Approvals
            </p>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">0</p>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name or Phone..."
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-slate-200 text-[13px] font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-slate-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role:</span>
          <InlineDropdown value={roleFilter} onChange={setRoleFilter} options={ROLES} />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[780px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-100">
                {["Joined Date", "Full Name", "Phone", "Email", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400 font-medium">
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400 font-medium">
                    No users match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((user, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-[12px] font-medium text-slate-500 font-mono">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-bold text-[#0F172A]">{user.full_name || "Unknown"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-medium text-slate-600">{user.phone_number || "N/A"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-medium text-slate-500">{user.email || "N/A"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider bg-green-100 text-green-700">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
