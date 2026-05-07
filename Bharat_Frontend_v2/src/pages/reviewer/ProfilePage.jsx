import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  EnvelopeSimple,
  PencilSimple,
  Trash,
  FloppyDisk,
  X,
  CheckCircle,
  Warning,
  Spinner,
  UserCircle,
} from "@phosphor-icons/react";
import {
  fetchProfileFresh,
  createProfile,
  updateProfile,
  deleteProfile,
} from "@/lib/profileApi";

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchProfileFresh();
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          phone_number: data.phone_number || "",
        });
        setIsNew(false);
      } else {
        setIsNew(true);
        setIsEditing(true);
        setFormData({
          full_name: user.name || "",
          phone_number: "",
        });
      }
    } catch {
      setToast({ type: "error", message: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      if (isNew) {
        result = await createProfile(formData);
        setToast({ type: "success", message: "Profile created successfully!" });
      } else {
        result = await updateProfile(formData);
        setToast({ type: "success", message: "Profile updated successfully!" });
      }
      setProfile(result);
      setIsNew(false);
      setIsEditing(false);
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteProfile();
      setProfile(null);
      setIsNew(true);
      setIsEditing(true);
      setShowDeleteConfirm(false);
      setFormData({ full_name: "", phone_number: "" });
      setToast({ type: "success", message: "Profile deleted successfully!" });
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 shadow-lg border-l-4 bg-white min-w-[300px] animate-in slide-in-from-bottom-5 fade-in duration-300 ${
            toast.type === "success"
              ? "border-l-green-500"
              : "border-l-red-500"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={20} className="text-green-600 shrink-0" weight="fill" />
          ) : (
            <Warning size={20} className="text-red-600 shrink-0" weight="bold" />
          )}
          <p className="text-sm font-semibold text-slate-800">{toast.message}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-8 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 flex items-center justify-center">
                <Warning size={22} className="text-red-600" weight="bold" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Profile</h3>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete your profile? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {isNew ? "Create Profile" : "My Profile"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isNew
              ? "Set up your profile information"
              : "Manage your personal information"}
          </p>
        </div>
        {!isNew && !isEditing && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              <PencilSimple size={16} weight="bold" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-colors"
            >
              <Trash size={16} weight="bold" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 shadow-sm">
        {/* Avatar Section */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <UserCircle size={48} className="text-slate-400" weight="duotone" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              {formData.full_name || user.name || "Your Name"}
            </h2>
            <p className="text-sm text-slate-500">{user.email || ""}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Full Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              <User size={14} weight="bold" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
              />
            ) : (
              <p className="text-sm text-[#0F172A] font-medium py-3 px-4 bg-slate-50 border border-slate-100">
                {profile?.full_name || "—"}
              </p>
            )}
          </div>



          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              <Phone size={14} weight="bold" />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+91-9876543210"
                className="w-full bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
              />
            ) : (
              <p className="text-sm text-[#0F172A] font-medium py-3 px-4 bg-slate-50 border border-slate-100">
                {profile?.phone_number || "—"}
              </p>
            )}
          </div>

          {/* Email (read-only from user data) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              <EnvelopeSimple size={14} weight="bold" />
              Email
            </label>
            <p className="text-sm text-[#0F172A] font-medium py-3 px-4 bg-slate-50 border border-slate-100">
              {user.email || "—"}
            </p>
          </div>


        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="border-t border-slate-100 p-6 md:p-8 flex justify-end gap-3">
            {!isNew && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <X size={16} weight="bold" />
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !formData.full_name}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Spinner size={16} className="animate-spin" />
              ) : (
                <FloppyDisk size={16} weight="bold" />
              )}
              {saving ? "Saving..." : isNew ? "Create Profile" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
