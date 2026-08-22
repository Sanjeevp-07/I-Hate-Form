export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  authorizedInCountry?: boolean;
  requiresSponsorship?: boolean;
  gender?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
}

export interface ProfileLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  other?: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  gpa?: number;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description: string;
  skills?: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  repoUrl?: string;
}

export interface SkillItem {
  id: string;
  category: string; // e.g. "Languages", "Frameworks", "Tools"
  name: string;
  proficiency?: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface UserProfile {
  id: string;
  userId: string;
  personal: PersonalInfo;
  links: ProfileLinks;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillItem[];
  achievements?: string[];
  certifications?: string[];
}
