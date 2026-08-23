"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Globe, Save, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+91",
    gender: "",
    nationality: "",
    dob: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
    address: "",
    requiresSponsorship: false,
    authorizedInCountry: true,
    linkedin: "",
    github: "",
    portfolio: "",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data?.profile?.personal) {
          const p = data.profile.personal;
          const l = data.profile.links || {};
          setForm({
            firstName: p.firstName || "",
            middleName: p.middleName || "",
            lastName: p.lastName || "",
            email: p.email || "",
            phone: p.phone || "",
            countryCode: p.countryCode || "+91",
            gender: p.gender || "",
            nationality: p.nationality || "",
            dob: p.dob || "",
            country: p.country || "",
            state: p.state || "",
            city: p.city || "",
            postalCode: p.postalCode || "",
            address: p.address || "",
            requiresSponsorship: !!p.requiresSponsorship,
            authorizedInCountry: p.authorizedInCountry !== false,
            linkedin: l.linkedin || "",
            github: l.github || "",
            portfolio: l.portfolio || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        personal: {
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          countryCode: form.countryCode,
          gender: form.gender,
          nationality: form.nationality,
          dob: form.dob,
          country: form.country,
          state: form.state,
          city: form.city,
          postalCode: form.postalCode,
          address: form.address,
          requiresSponsorship: form.requiresSponsorship,
          authorizedInCountry: form.authorizedInCountry,
        },
        links: {
          linkedin: form.linkedin,
          github: form.github,
          portfolio: form.portfolio,
        },
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profile information saved! The extension will now use these exact values." });
      } else {
        setMessage({ type: "error", text: "Failed to save profile. Please try again." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error saving profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-slate-800 rounded w-48"></div>
            <div className="h-3 bg-slate-800 rounded w-80"></div>
          </div>
          <div className="h-9 bg-slate-800 rounded-lg w-28"></div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="h-4 bg-slate-800 rounded w-36"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-9 bg-slate-800 rounded-lg"></div>
            <div className="h-9 bg-slate-800 rounded-lg"></div>
            <div className="h-9 bg-slate-800 rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-9 bg-slate-800 rounded-lg"></div>
            <div className="h-9 bg-slate-800 rounded-lg"></div>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="h-4 bg-slate-800 rounded w-36"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-9 bg-slate-800 rounded-lg"></div>
            <div className="h-9 bg-slate-800 rounded-lg"></div>
            <div className="h-9 bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Applicant Profile</h1>
          <p className="text-xs text-slate-400 mt-1">
            Single source of truth. The I Hate Form Chrome Extension reads directly from here.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-medium transition shadow-md shadow-indigo-950/50 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
              : "bg-rose-950/50 border-rose-800 text-rose-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Personal Info Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-semibold text-white">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Personal Information</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="e.g. Sanjeev"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Middle Name</label>
            <input
              type="text"
              name="middleName"
              value={form.middleName}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="e.g. Kumar"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div>
            <label className="block text-slate-400 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="sanjeev@example.com"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Country Code</label>
            <input
              type="text"
              name="countryCode"
              value={form.countryCode}
              onChange={handleChange}
              placeholder="+91 or +1"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Mobile Number *</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div>
            <label className="block text-slate-400 mb-1">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Please Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Decline to state">Decline to state</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Date of Birth</label>
            <input
              type="text"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              placeholder="DD/MM/YYYY or YYYY-MM-DD"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Nationality</label>
            <input
              type="text"
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              placeholder="e.g. Indian"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Address Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-semibold text-white">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Location & Address</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="e.g. India"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">State / Province</label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="e.g. Delhi, Maharashtra, California"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g. New Delhi"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block text-slate-400 mb-1">Pincode / Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              placeholder="e.g. 110001"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Current Street / Locality / Area</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Sector 14, Main Road"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Online Profiles & Links */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-semibold text-white">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>Online Profiles & Links</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">LinkedIn URL</label>
            <input
              type="url"
              name="linkedin"
              value={form.linkedin}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">GitHub URL</label>
            <input
              type="url"
              name="github"
              value={form.github}
              onChange={handleChange}
              placeholder="https://github.com/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Portfolio / Personal Website</label>
            <input
              type="url"
              name="portfolio"
              value={form.portfolio}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
