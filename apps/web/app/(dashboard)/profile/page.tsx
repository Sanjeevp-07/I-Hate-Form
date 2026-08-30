"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  GraduationCap,
  School,
  BookOpen,
  Code2,
  Plus,
  X,
  Sparkles,
  FileCheck2,
  FileText,
  ArrowRight,
} from "lucide-react";

const POPULAR_SKILLS = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Tailwind CSS",
  "Docker",
  "PostgreSQL",
  "MongoDB",
  "AI/ML",
  "PyTorch",
  "Git",
  "REST APIs",
  "GraphQL",
  "AWS",
  "C++",
  "Java",
  "FastAPI",
  "Redux",
];

export default function ProfilePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // 2.1 Personal & Contact
  const [personal, setPersonal] = useState({
    fullName: "",
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
    password: "Password@12345",
    requiresSponsorship: false,
    authorizedInCountry: true,
  });

  // Online Links
  const [links, setLinks] = useState({
    linkedin: "",
    github: "",
    portfolio: "",
  });

  // 2.2 Current College / Education
  const [education, setEducation] = useState({
    institution: "",
    degree: "",
    major: "",
    specialization: "",
    currentYear: "",
    currentSemester: "",
    graduationYear: "",
    cgpa: "",
    cgpaScale: "10.0",
  });

  // 2.3 10th / Secondary Education
  const [secondary, setSecondary] = useState({
    percentageOrCgpa: "",
    passingYear: "",
    schoolName: "",
  });

  // 2.4 12th / Higher Secondary Education
  const [higherSecondary, setHigherSecondary] = useState({
    percentageOrCgpa: "",
    passingYear: "",
    schoolName: "",
    stream: "",
  });

  // 2.5 Technical Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState<string>("");

  const fetchProfile = async () => {
    try {
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData?.profile) {
          const p = pData.profile.personal || {};
          const l = pData.profile.links || {};
          const e = pData.profile.education || pData.profile.currentEducation || {};
          const s10 = pData.profile.secondary || {};
          const s12 = pData.profile.higherSecondary || {};
          const sk = pData.profile.skills || pData.profile.skillsList || [];

          setPersonal({
            fullName: p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
            firstName: p.firstName || "",
            middleName: p.middleName || "",
            lastName: p.lastName || "",
            email: p.email || "",
            phone: p.phone || "",
            countryCode: p.countryCode || "+91",
            gender: p.gender || "",
            nationality: p.nationality || "Indian",
            dob: p.dob || "",
            country: p.country || "India",
            state: p.state || "Uttar Pradesh",
            city: p.city || "Greater Noida",
            postalCode: p.postalCode || "201306",
            address: p.address || "",
            password: p.password || "Password@12345",
            requiresSponsorship: !!p.requiresSponsorship,
            authorizedInCountry: p.authorizedInCountry !== false,
          });

          setLinks({
            linkedin: l.linkedin || "",
            github: l.github || "",
            portfolio: l.portfolio || "",
          });

          setEducation({
            institution: e.institution || "",
            degree: e.degree || "",
            major: e.major || e.fieldOfStudy || "",
            specialization: e.specialization || "",
            currentYear: String(e.currentYear || ""),
            currentSemester: String(e.currentSemester || ""),
            graduationYear: String(e.graduationYear || ""),
            cgpa: String(e.cgpa || e.gpa || ""),
            cgpaScale: String(e.cgpaScale || "10.0"),
          });

          setSecondary({
            percentageOrCgpa: String(s10.percentageOrCgpa || ""),
            passingYear: String(s10.passingYear || ""),
            schoolName: s10.schoolName || "",
          });

          setHigherSecondary({
            percentageOrCgpa: String(s12.percentageOrCgpa || ""),
            passingYear: String(s12.passingYear || ""),
            schoolName: s12.schoolName || "",
            stream: s12.stream || "",
          });

          setSkills(Array.isArray(sk) ? sk : []);
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setPersonal((prev) => ({ ...prev, [name]: checked }));
    } else {
      setPersonal((prev) => {
        const updated = { ...prev, [name]: value };
        if (name === "firstName" || name === "lastName") {
          updated.fullName = `${name === "firstName" ? value : prev.firstName} ${name === "lastName" ? value : prev.lastName}`.trim();
        }
        return updated;
      });
    }
  };

  const handleLinksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLinks((prev) => ({ ...prev, [name]: value }));
  };

  const handleEducationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEducation((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecondaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecondary((prev) => ({ ...prev, [name]: value }));
  };

  const handleHigherSecondaryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setHigherSecondary((prev) => ({ ...prev, [name]: value }));
  };

  // Skill tag management
  const handleAddSkill = (skillToAdd?: string) => {
    const val = (skillToAdd || skillInput).trim();
    if (!val) return;
    if (!skills.includes(val)) {
      setSkills((prev) => [...prev, val]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Save all profile sections
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        personal: {
          ...personal,
          fullName: personal.fullName || `${personal.firstName} ${personal.lastName}`.trim(),
        },
        links,
        education,
        secondary,
        higherSecondary,
        skills,
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Profile saved! The I Hate Form Chrome Extension and AI engine are updated with these exact details.",
        });
      } else {
        setMessage({ type: "error", text: "Failed to save profile. Please check required fields." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error saving profile." });
    } finally {
      setSaving(false);
    }
  };

  // Completeness check across 2.1 to 2.5
  const completedCount = [
    Boolean(personal.firstName && personal.lastName && personal.email && personal.phone),
    Boolean(personal.city && personal.country),
    Boolean(education.institution && education.degree && education.major),
    Boolean(secondary.percentageOrCgpa && secondary.passingYear),
    Boolean(higherSecondary.percentageOrCgpa && higherSecondary.passingYear),
    skills.length > 0,
  ].filter(Boolean).length;

  const completenessPercentage = Math.round((completedCount / 6) * 100);

  if (loading) {
    return (
      <div className="max-w-6xl space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-56"></div>
            <div className="h-3 bg-slate-200 rounded w-96"></div>
          </div>
          <div className="h-9 bg-slate-200 rounded-lg w-32"></div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="h-4 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-10 bg-slate-200 rounded-lg"></div>
            <div className="h-10 bg-slate-200 rounded-lg"></div>
            <div className="h-10 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveAll} className="max-w-6xl space-y-6 pb-16 text-slate-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Profile</h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0066FF]" />
              Autofill Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Keep your profile updated. The Chrome extension and AI copilot reuse these exact details across all job applications.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] active:scale-98 text-white text-xs font-semibold transition shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving All..." : "Save Profile"}
        </button>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-3 shadow-sm ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Two Column Layout Matching Reference Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Navigation & Progress Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Top Banner Card */}
          <div className="p-4 rounded-2xl bg-[#0066FF] text-white flex items-center justify-between shadow-md shadow-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-bold">Create your Resume</div>
            </div>
            <button
              type="button"
              onClick={() => (window.location.href = "/resumes")}
              className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition cursor-pointer"
            >
              + Create
            </button>
          </div>

          {/* Complete your Profile Progress Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900">Complete your Profile</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {completenessPercentage}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Stay ahead of the competition by regularly updating your profile.
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completenessPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Section Navigation List (Matching Left Menu in Image) */}
          <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-sm divide-y divide-slate-100">
            {[
              { id: "personal", label: "Basic Details", required: true, icon: User },
              { id: "education", label: "Current Education", required: true, icon: GraduationCap },
              { id: "secondary", label: "10th Education", required: true, icon: School },
              { id: "higherSecondary", label: "12th Education", required: true, icon: BookOpen },
              { id: "skills", label: "Technical Skills", required: true, icon: Code2 },
              { id: "all", label: "Overview & All Sections", required: false, icon: Globe },
            ].map((sec) => {
              const Icon = sec.icon;
              const isActive = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                    isActive
                      ? "bg-blue-50 text-[#0066FF] border border-blue-200 shadow-xs"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{sec.label}</span>
                  </div>
                  {sec.required && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200 shrink-0">
                      Required
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side Main Form Cards (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: "all", label: "All Sections" },
              { id: "personal", label: "Basic Details" },
              { id: "education", label: "Education" },
              { id: "secondary", label: "10th" },
              { id: "higherSecondary", label: "12th" },
              { id: "skills", label: "Skills" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition cursor-pointer text-xs border ${
                  activeTab === tab.id
                    ? "bg-[#0066FF] text-white border-[#0066FF] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 2.1 Basic Details & Personal */}
          {(activeTab === "all" || activeTab === "personal") && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Basic Details</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    Required
                  </span>
                </div>
              </div>

              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 p-1 flex items-center justify-center shadow-md">
                  <div className="w-full h-full rounded-full bg-slate-900/10 flex items-center justify-center text-white font-bold text-xl">
                    {personal.firstName ? personal.firstName.charAt(0).toUpperCase() : "U"}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{personal.fullName || "Your Profile Avatar"}</div>
                  <div className="text-xs text-slate-500">{personal.email || "No email added"}</div>
                </div>
              </div>

              {/* First Name & Last Name Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={personal.firstName}
                    onChange={handlePersonalChange}
                    placeholder="e.g. Sanjeev"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={personal.lastName}
                    onChange={handlePersonalChange}
                    placeholder="e.g. Kumar"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  />
                </div>
              </div>

              {/* Username Input */}
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1.5">Username *</label>
                <input
                  type="text"
                  readOnly
                  value={personal.firstName ? `${personal.firstName.toLowerCase()}_07` : "sanjeevp_07"}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              {/* Email Input */}
              <div className="text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">Email *</label>
                  <button type="button" className="text-[11px] font-semibold text-[#0066FF] hover:underline cursor-pointer">
                    Update Email
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={personal.email}
                    onChange={handlePersonalChange}
                    placeholder="sanjeev@example.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Mobile Input */}
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1.5">Mobile *</label>
                <div className="flex gap-2">
                  <select
                    name="countryCode"
                    value={personal.countryCode}
                    onChange={handlePersonalChange}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-[#0066FF]"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      name="phone"
                      value={personal.phone}
                      onChange={handlePersonalChange}
                      placeholder="8825171882"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Aadhaar / Identity Verification Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <span className="p-1 rounded bg-emerald-100 text-emerald-700">🪪</span>
                  <span>Aadhaar Verification</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-emerald-200 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Aadhaar is Verified
                  </span>
                  <span className="font-mono text-emerald-800">XXXXXXXX6674</span>
                </div>
              </div>

              {/* Gender Pill Selectors (Matching Reference Image) */}
              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-700">Gender *</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: "Male", label: "Male", icon: "♂" },
                    { id: "Female", label: "Female", icon: "♀" },
                    { id: "More Options", label: "More Options", icon: "👤" },
                  ].map((opt) => {
                    const isSelected = personal.gender === opt.id || (opt.id === "Male" && !personal.gender);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPersonal((prev) => ({ ...prev, gender: opt.id }))}
                        className={`px-5 py-2.5 rounded-full font-semibold transition cursor-pointer flex items-center gap-2 text-xs ${
                          isSelected
                            ? "border-2 border-[#0066FF] bg-blue-50 text-[#0066FF] shadow-xs"
                            : "border border-dashed border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Type Pill Selectors (Matching Reference Image) */}
              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-700">User Type *</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: "College Students", label: "College Students", icon: "🎓" },
                    { id: "Professional", label: "Professional", icon: "👔" },
                    { id: "School Student", label: "School Student", icon: "🎒" },
                    { id: "Fresher", label: "Fresher", icon: "📜" },
                  ].map((opt) => {
                    const isSelected = activeTab === opt.id || opt.id === "College Students";
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`px-5 py-2.5 rounded-full font-semibold transition cursor-pointer flex items-center gap-2 text-xs ${
                          isSelected
                            ? "border-2 border-[#0066FF] bg-blue-50 text-[#0066FF] shadow-xs"
                            : "border border-dashed border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={personal.city}
                    onChange={handlePersonalChange}
                    placeholder="e.g. Greater Noida"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">State</label>
                  <input
                    type="text"
                    name="state"
                    value={personal.state}
                    onChange={handlePersonalChange}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={personal.country}
                    onChange={handlePersonalChange}
                    placeholder="e.g. India"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  />
                </div>
              </div>

              {/* Online Links */}
              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#0066FF]" />
                  <span>Online & Social Profiles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">LinkedIn</label>
                    <input
                      type="url"
                      name="linkedin"
                      value={links.linkedin}
                      onChange={handleLinksChange}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">GitHub</label>
                    <input
                      type="url"
                      name="github"
                      value={links.github}
                      onChange={handleLinksChange}
                      placeholder="https://github.com/..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Portfolio</label>
                    <input
                      type="url"
                      name="portfolio"
                      value={links.portfolio}
                      onChange={handleLinksChange}
                      placeholder="https://portfolio.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2.2 Current Education */}
          {(activeTab === "all" || activeTab === "education") && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <span>2.2 Current College / Education</span>
                </div>
                <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1.5">College / University Name *</label>
                  <input
                    type="text"
                    name="institution"
                    value={education.institution}
                    onChange={handleEducationChange}
                    placeholder="e.g. Bennett University"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Degree *</label>
                  <input
                    type="text"
                    name="degree"
                    value={education.degree}
                    onChange={handleEducationChange}
                    placeholder="e.g. B.Tech, B.E., BCA"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Branch / Major *</label>
                  <input
                    type="text"
                    name="major"
                    value={education.major}
                    onChange={handleEducationChange}
                    placeholder="e.g. Computer Science"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Graduation Year *</label>
                  <input
                    type="text"
                    name="graduationYear"
                    value={education.graduationYear}
                    onChange={handleEducationChange}
                    placeholder="e.g. 2026"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">CGPA *</label>
                  <input
                    type="text"
                    name="cgpa"
                    value={education.cgpa}
                    onChange={handleEducationChange}
                    placeholder="e.g. 8.9"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2.3 10th & 2.4 12th Education */}
          {(activeTab === "all" || activeTab === "secondary" || activeTab === "higherSecondary") && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <School className="w-5 h-5 text-cyan-600" />
                  <span>10th & 12th Secondary Education</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-800">10th Standard</div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Percentage / CGPA *</label>
                    <input
                      type="text"
                      name="percentageOrCgpa"
                      value={secondary.percentageOrCgpa}
                      onChange={handleSecondaryChange}
                      placeholder="e.g. 92.4"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Passing Year *</label>
                    <input
                      type="text"
                      name="passingYear"
                      value={secondary.passingYear}
                      onChange={handleSecondaryChange}
                      placeholder="e.g. 2020"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-800">12th Standard</div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Percentage / CGPA *</label>
                    <input
                      type="text"
                      name="percentageOrCgpa"
                      value={higherSecondary.percentageOrCgpa}
                      onChange={handleHigherSecondaryChange}
                      placeholder="e.g. 94.8"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Passing Year *</label>
                    <input
                      type="text"
                      name="passingYear"
                      value={higherSecondary.passingYear}
                      onChange={handleHigherSecondaryChange}
                      placeholder="e.g. 2022"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2.5 Technical Skills */}
          {(activeTab === "all" || activeTab === "skills") && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Code2 className="w-5 h-5 text-amber-500" />
                  <span>Technical Skills</span>
                </div>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {skills.length} Skills Added
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Type skill (e.g. React, Python) and press Enter..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0066FF]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill()}
                    className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold flex items-center gap-1 cursor-pointer transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[42px] p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {skills.length === 0 ? (
                    <span className="text-slate-400 text-xs self-center">No skills added yet. Type above or click suggestions below.</span>
                  ) : (
                    skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0066FF] text-xs font-semibold shadow-2xs"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-blue-500 hover:text-blue-800 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">Quick Add Suggestions:</div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SKILLS.filter((s) => !skills.includes(s)).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleAddSkill(skill)}
                        className="px-3 py-1 rounded-full bg-white hover:bg-blue-50 hover:text-[#0066FF] hover:border-blue-300 border border-slate-200 text-slate-600 text-xs transition font-medium cursor-pointer shadow-2xs"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Bottom Save Action Bar */}
          <div className="sticky bottom-6 z-20 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl flex items-center justify-between gap-4">
            <div className="text-xs text-slate-600 flex items-center gap-2 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Single source of truth ready to sync with extension</span>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] active:scale-98 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
