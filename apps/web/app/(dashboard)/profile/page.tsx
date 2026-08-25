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
      <div className="max-w-5xl space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-slate-800 rounded w-56"></div>
            <div className="h-3 bg-slate-800 rounded w-96"></div>
          </div>
          <div className="h-9 bg-slate-800 rounded-lg w-32"></div>
        </div>
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="h-4 bg-slate-800 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-10 bg-slate-800 rounded-lg"></div>
            <div className="h-10 bg-slate-800 rounded-lg"></div>
            <div className="h-10 bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveAll} className="max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Profile Setup & Onboarding</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Autofill Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Fill these sections once. The Chrome extension and AI copilot will reuse them across all internship application forms.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-semibold transition shadow-lg shadow-indigo-950/60 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving All..." : "Save Profile"}
        </button>
      </div>

      {/* Progress & Completeness Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-white">Profile Readiness: {completenessPercentage}%</div>
            <p className="text-[11px] text-slate-400">
              {completedCount} of 6 profile sections complete. Marksheets and documents are managed in{" "}
              <Link href="/resumes" className="text-indigo-400 hover:underline font-medium inline-flex items-center gap-0.5">
                Resumes & Docs <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
        <div className="w-full sm:w-48 bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completenessPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
              : "bg-rose-950/60 border-rose-800 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Quick Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-800">
        {[
          { id: "all", label: "Overview & All Sections" },
          { id: "personal", label: "2.1 Personal & Contact" },
          { id: "education", label: "2.2 Current Education" },
          { id: "secondary", label: "2.3 10th Education" },
          { id: "higherSecondary", label: "2.4 12th Education" },
          { id: "skills", label: "2.5 Technical Skills" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2.1 Personal & Contact */}
      {(activeTab === "all" || activeTab === "personal") && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <User className="w-4 h-4 text-indigo-400" />
              <span>2.1 Personal & Contact</span>
            </div>
            <span className="text-[10px] text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
              Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={personal.firstName}
                onChange={handlePersonalChange}
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
                value={personal.middleName}
                onChange={handlePersonalChange}
                placeholder="Optional"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={personal.lastName}
                onChange={handlePersonalChange}
                placeholder="e.g. Kumar"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div>
              <label className="block text-slate-400 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={personal.email}
                onChange={handlePersonalChange}
                placeholder="sanjeev@example.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={personal.phone}
                onChange={handlePersonalChange}
                placeholder="e.g. 8825171882"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Current City *</label>
              <input
                type="text"
                name="city"
                value={personal.city}
                onChange={handlePersonalChange}
                placeholder="e.g. Greater Noida"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div>
              <label className="block text-slate-400 mb-1">Current State</label>
              <input
                type="text"
                name="state"
                value={personal.state}
                onChange={handlePersonalChange}
                placeholder="e.g. Uttar Pradesh"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={personal.country}
                onChange={handlePersonalChange}
                placeholder="e.g. India"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Pincode / Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={personal.postalCode}
                onChange={handlePersonalChange}
                placeholder="e.g. 201306"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-300 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Professional & Portfolio Links</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedin"
                  value={links.linkedin}
                  onChange={handleLinksChange}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">GitHub URL</label>
                <input
                  type="url"
                  name="github"
                  value={links.github}
                  onChange={handleLinksChange}
                  placeholder="https://github.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Portfolio URL</label>
                <input
                  type="url"
                  name="portfolio"
                  value={links.portfolio}
                  onChange={handleLinksChange}
                  placeholder="https://yourportfolio.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Password Autofill helper */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Password Autofill:</span>
              <span className="text-[11px] text-slate-400">Used when job portals ask to set up a new password</span>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={personal.password}
                onChange={handlePersonalChange}
                placeholder="Password@12345"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2.2 Current College / Education */}
      {(activeTab === "all" || activeTab === "education") && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>2.2 Current College / Education</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
              Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">College / University Name *</label>
              <input
                type="text"
                name="institution"
                value={education.institution}
                onChange={handleEducationChange}
                placeholder="e.g. Bennett University"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Degree *</label>
              <input
                type="text"
                name="degree"
                value={education.degree}
                onChange={handleEducationChange}
                placeholder="e.g. B.Tech, B.E., B.Sc, BCA"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div>
              <label className="block text-slate-400 mb-1">Branch / Major *</label>
              <input
                type="text"
                name="major"
                value={education.major}
                onChange={handleEducationChange}
                placeholder="e.g. Computer Science and Engineering"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={education.specialization}
                onChange={handleEducationChange}
                placeholder="e.g. Artificial Intelligence, Data Science"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Current Year *</label>
              <input
                type="text"
                name="currentYear"
                value={education.currentYear}
                onChange={handleEducationChange}
                placeholder="e.g. 3rd Year (or 3)"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div>
              <label className="block text-slate-400 mb-1">Current Semester</label>
              <input
                type="text"
                name="currentSemester"
                value={education.currentSemester}
                onChange={handleEducationChange}
                placeholder="e.g. 6th Semester (or 6)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Graduation Year *</label>
              <input
                type="text"
                name="graduationYear"
                value={education.graduationYear}
                onChange={handleEducationChange}
                placeholder="e.g. 2026"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">CGPA *</label>
              <input
                type="text"
                name="cgpa"
                value={education.cgpa}
                onChange={handleEducationChange}
                placeholder="e.g. 8.9"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">CGPA Scale</label>
              <input
                type="text"
                name="cgpaScale"
                value={education.cgpaScale}
                onChange={handleEducationChange}
                placeholder="e.g. 10.0 or 4.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2.3 10th / Secondary Education */}
      {(activeTab === "all" || activeTab === "secondary") && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <School className="w-4 h-4 text-cyan-400" />
              <span>2.3 10th / Secondary Education</span>
            </div>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
              Required / Common
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">10th Percentage / CGPA *</label>
              <input
                type="text"
                name="percentageOrCgpa"
                value={secondary.percentageOrCgpa}
                onChange={handleSecondaryChange}
                placeholder="e.g. 92.4 or 9.5"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">10th Passing Year *</label>
              <input
                type="text"
                name="passingYear"
                value={secondary.passingYear}
                onChange={handleSecondaryChange}
                placeholder="e.g. 2020"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">10th School Name</label>
              <input
                type="text"
                name="schoolName"
                value={secondary.schoolName}
                onChange={handleSecondaryChange}
                placeholder="e.g. St. Xavier's High School"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2.4 12th / Higher Secondary Education */}
      {(activeTab === "all" || activeTab === "higherSecondary") && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>2.4 12th / Higher Secondary Education</span>
            </div>
            <span className="text-[10px] text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/50">
              Required / Common
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">12th Percentage / CGPA *</label>
              <input
                type="text"
                name="percentageOrCgpa"
                value={higherSecondary.percentageOrCgpa}
                onChange={handleHigherSecondaryChange}
                placeholder="e.g. 94.8 or 9.2"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">12th Passing Year *</label>
              <input
                type="text"
                name="passingYear"
                value={higherSecondary.passingYear}
                onChange={handleHigherSecondaryChange}
                placeholder="e.g. 2022"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">12th School Name</label>
              <input
                type="text"
                name="schoolName"
                value={higherSecondary.schoolName}
                onChange={handleHigherSecondaryChange}
                placeholder="e.g. DPS International School"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">12th Stream</label>
              <input
                type="text"
                name="stream"
                value={higherSecondary.stream}
                onChange={handleHigherSecondaryChange}
                placeholder="e.g. Science (PCM), Commerce"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2.5 Technical Skills */}
      {(activeTab === "all" || activeTab === "skills") && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>2.5 Technical Skills</span>
            </div>
            <span className="text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
              Multi-value Tags ({skills.length} added)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Input to type and press Enter */}
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill (e.g. React, Docker, Python) and press Enter..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Added Skills Tags */}
            <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-slate-950 rounded-lg border border-slate-800/80">
              {skills.length === 0 ? (
                <span className="text-slate-500 text-[11px] self-center">No skills added yet. Type above or click suggestions below.</span>
              ) : (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/50 border border-amber-800/60 text-amber-200 text-xs font-medium"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-amber-400 hover:text-amber-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Popular skill quick suggestions */}
            <div>
              <div className="text-[11px] text-slate-400 mb-1.5">Quick Add Suggestions:</div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILLS.filter((s) => !skills.includes(s)).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-indigo-950 hover:text-indigo-300 hover:border-indigo-700 border border-slate-700/60 text-slate-400 text-[11px] transition cursor-pointer"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link to Category B Documents on Resumes page */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs">Category B — Resumes & Documents</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Upload and manage your Resume, 10th Marksheet, 12th Marksheet, College Transcript, and Cover Letter for instant auto-upload during form filling.
            </p>
          </div>
        </div>
        <Link
          href="/resumes"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition shrink-0"
        >
          <span>Manage Documents</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Floating Save Toolbar */}
      <div className="sticky bottom-4 z-20 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl flex items-center justify-between gap-4">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Ready to sync with Chrome Extension</span>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-semibold transition shadow-md shadow-indigo-950/60 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving Changes..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
