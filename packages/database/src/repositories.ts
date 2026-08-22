import { prisma, ApplicationStatus, MappingAction, MappingSource } from "./client";
import { UserProfile, FieldDescriptor, FieldMapping, FieldError } from "@internship-copilot/types";
import { logAudit } from "./audit";

export const ProfileRepository = {
  async getByUserId(userId: string) {
    try {
      return await prisma.profile.findUnique({
        where: { userId },
        include: {
          educations: true,
          experiences: true,
          projects: true,
          skills: true,
          achievements: true,
          certifications: true,
        },
      });
    } catch (err) {
      console.warn("Database unavailable, falling back in ProfileRepository.getByUserId", err);
      return null;
    }
  },

  async upsertProfile(userId: string, profileData: Partial<UserProfile>) {
    try {
      const result = await prisma.profile.upsert({
        where: { userId },
        update: {
          personal: (profileData.personal as object) || {},
          links: (profileData.links as object) || {},
        },
        create: {
          userId,
          personal: (profileData.personal as object) || {},
          links: (profileData.links as object) || {},
        },
      });

      await logAudit({
        userId,
        actorType: "USER",
        action: "UPDATE_PROFILE",
        targetType: "Profile",
        targetId: result.id,
      });

      return result;
    } catch (err) {
      console.warn("Database unavailable in ProfileRepository.upsertProfile", err);
      return null;
    }
  },
};

export const ApplicationRepository = {
  async createSession(userId: string, sessionData: { url: string; domain: string; title: string; sessionId: string }) {
    try {
      return await prisma.application.create({
        data: {
          userId,
          sessionId: sessionData.sessionId,
          url: sessionData.url,
          domain: sessionData.domain,
          jobTitle: sessionData.title,
          status: ApplicationStatus.IN_PROGRESS,
        },
      });
    } catch (err) {
      console.warn("Database unavailable in ApplicationRepository.createSession", err);
      return { id: sessionData.sessionId, ...sessionData, status: "IN_PROGRESS" };
    }
  },

  async completeSession(params: {
    sessionId: string;
    filledFieldIds: string[];
    skippedFieldIds: string[];
    errors: FieldError[];
    fields?: FieldDescriptor[];
    mappings?: FieldMapping[];
  }) {
    try {
      const status: ApplicationStatus =
        params.errors.length === 0
          ? ApplicationStatus.APPLIED
          : params.filledFieldIds.length > 0
          ? ApplicationStatus.IN_PROGRESS
          : ApplicationStatus.IN_PROGRESS;

      const app = await prisma.application.update({
        where: { sessionId: params.sessionId },
        data: { status },
      });

      // Save mapped fields for analytics and learning
      if (params.fields && params.mappings) {
        for (const mapping of params.mappings) {
          const fieldDesc = params.fields.find((f) => f.id === mapping.fieldId);
          if (!fieldDesc) continue;

          await prisma.applicationField.create({
            data: {
              applicationId: app.id,
              rawLabel: mapping.rawLabel,
              normalizedLabel: mapping.normalizedLabel,
              domSelectorHash: fieldDesc.domSelectorHash,
              profilePath: mapping.profilePath,
              confidence: mapping.confidence,
              action: mapping.action.toUpperCase() as MappingAction,
              source: mapping.source.toUpperCase() as MappingSource,
              finalValue: mapping.valueToFill ? String(mapping.valueToFill) : null,
            },
          });
        }
      }

      await logAudit({
        userId: app.userId,
        actorType: "SYSTEM",
        action: "COMPLETE_AUTOFILL_SESSION",
        targetType: "Application",
        targetId: app.id,
      });

      return app;
    } catch (err) {
      console.warn("Database unavailable in ApplicationRepository.completeSession", err);
      return { id: params.sessionId, status: "completed" };
    }
  },

  async listByUser(userId: string) {
    try {
      return await prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { fields: true },
      });
    } catch (err) {
      console.warn("Database unavailable in ApplicationRepository.listByUser", err);
      return [];
    }
  },

  async updateApplication(id: string, updates: { jobTitle?: string; status?: ApplicationStatus }) {
    try {
      return await prisma.application.update({
        where: { id },
        data: updates,
      });
    } catch (err) {
      console.warn("Database unavailable in ApplicationRepository.updateApplication", err);
      return { id, ...updates };
    }
  },
};

export const FieldMappingRepository = {
  async getLearnedMapping(userId: string, normalizedLabel: string, domain?: string) {
    try {
      return await prisma.fieldMapping.findFirst({
        where: {
          userId,
          normalizedLabel,
          OR: [{ domainScope: domain || null }, { domainScope: null }],
        },
        orderBy: { confidence: "desc" },
      });
    } catch (err) {
      console.warn("Database unavailable in FieldMappingRepository.getLearnedMapping", err);
      return null;
    }
  },

  async saveLearnedMapping(userId: string, data: { normalizedLabel: string; profilePath: string; domain?: string }) {
    try {
      return await prisma.fieldMapping.create({
        data: {
          userId,
          normalizedLabel: data.normalizedLabel,
          domainScope: data.domain || null,
          profilePath: data.profilePath,
          confidence: 1.0, // User explicit correction has 1.0 confidence
        },
      });
    } catch (err) {
      console.warn("Database unavailable in FieldMappingRepository.saveLearnedMapping", err);
      return null;
    }
  },
};
