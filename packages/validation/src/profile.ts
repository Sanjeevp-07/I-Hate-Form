import { z } from "zod";

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  authorizedInCountry: z.boolean().optional(),
  requiresSponsorship: z.boolean().optional(),
  gender: z.string().optional(),
  veteranStatus: z.string().optional(),
  disabilityStatus: z.string().optional(),
});

export const profileLinksSchema = z.object({
  linkedin: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  other: z.array(z.string().url()).optional(),
});

export const educationItemSchema = z.object({
  id: z.string().uuid(),
  institution: z.string().min(1, "Institution name required"),
  degree: z.string().min(1, "Degree required"),
  fieldOfStudy: z.string().min(1, "Field of study required"),
  gpa: z.number().min(0).max(4.0).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
});

export const experienceItemSchema = z.object({
  id: z.string().uuid(),
  company: z.string().min(1, "Company name required"),
  title: z.string().min(1, "Job title required"),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string(),
  skills: z.array(z.string()).optional(),
});

export const projectItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Project name required"),
  description: z.string(),
  technologies: z.array(z.string()),
  url: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
});

export const skillItemSchema = z.object({
  id: z.string().uuid(),
  category: z.string(),
  name: z.string().min(1, "Skill name required"),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
});

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  personal: personalInfoSchema,
  links: profileLinksSchema,
  education: z.array(educationItemSchema),
  experience: z.array(experienceItemSchema),
  projects: z.array(projectItemSchema),
  skills: z.array(skillItemSchema),
  achievements: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});
