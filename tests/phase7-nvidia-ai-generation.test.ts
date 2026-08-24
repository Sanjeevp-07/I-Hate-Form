import { describe, it, expect } from "vitest";
import { generateDynamicFieldAnswers } from "../packages/ai/src/dynamic-answer-generator";
import { buildDynamicFieldAnswerPrompt } from "../packages/ai/src/prompts/dynamic-answers";
import { FieldDescriptor, UserProfile } from "@internship-copilot/types";

const mockProfile: UserProfile = {
  id: "usr_sanjeev_1",
  userId: "user_sanjeev",
  personal: {
    firstName: "Sanjeev",
    lastName: "Kumar",
    email: "sanjeev1803t@gmail.com",
    phone: "8825171882",
    countryCode: "+91",
    country: "India",
    state: "Uttar Pradesh",
    city: "Greater Noida",
    postalCode: "201306",
    address: "Knowledge Park III",
    gender: "Male",
  },
  links: {
    linkedin: "https://linkedin.com/in/sanjeev-kumar",
    github: "https://github.com/sanjeevp-07",
  },
  education: [
    {
      id: "edu_1",
      institution: "Bennett University",
      degree: "B.Tech",
      fieldOfStudy: "Computer Science",
      startDate: "2022-08-01",
      endDate: "2026-06-01",
      isCurrent: true,
    },
  ],
  experience: [],
  projects: [
    {
      id: "proj_1",
      name: "I Hate Form",
      description: "AI job application autofill platform with NVIDIA NIM",
      technologies: ["React", "TypeScript", "Next.js", "NVIDIA NIM"],
    },
  ],
  skills: [
    { id: "sk_1", category: "Languages", name: "TypeScript" },
    { id: "sk_2", category: "Frameworks", name: "React" },
    { id: "sk_3", category: "AI", name: "NVIDIA NIM" },
  ],
};

describe("Phase 7: NVIDIA NIM AI Answer Generation for Unmapped & Dynamic Fields", () => {
  it("Builds structured prompt containing applicant profile context and unscored fields", () => {
    const fields: FieldDescriptor[] = [
      {
        id: "f_years",
        frameId: 0,
        tag: "input",
        type: "text",
        name: "experience_years",
        rawLabel: "Years*",
        normalizedLabel: "years",
        nearbyText: "Total Years of Work Experience Note : Freshers need to enter 0",
        domSelector: "#years",
        domSelectorHash: "h_years",
      },
    ];

    const { system, user } = buildDynamicFieldAnswerPrompt({ fields, profile: mockProfile });

    expect(system).toContain("NVIDIA NIM");
    expect(system).toContain("Freshers enter 0");
    expect(user).toContain("Bennett University");
    expect(user).toContain("Total Years of Work Experience");
  });

  it("Generates intelligent answers for fresher experience, CTC, and notice period", async () => {
    const fields: FieldDescriptor[] = [
      {
        id: "f_years",
        frameId: 0,
        tag: "input",
        type: "text",
        name: "years",
        rawLabel: "Years*",
        normalizedLabel: "years",
        nearbyText: "Total Years of Work Experience Note : Freshers need to enter 0",
        domSelector: "#years",
        domSelectorHash: "h_years",
      },
      {
        id: "f_months",
        frameId: 0,
        tag: "select",
        type: "select",
        name: "months",
        rawLabel: "Months*",
        normalizedLabel: "months",
        options: [
          { value: "", label: "Please Select" },
          { value: "0", label: "0" },
          { value: "1", label: "1" },
          { value: "6", label: "6" },
        ],
        domSelector: "#months",
        domSelectorHash: "h_months",
      },
      {
        id: "f_cur_ctc",
        frameId: 0,
        tag: "input",
        type: "text",
        name: "current_ctc",
        rawLabel: "Current CTC (In Lakhs)*",
        normalizedLabel: "current ctc in lakhs",
        nearbyText: "Cost to Company Note : Freshers need to enter 0",
        domSelector: "#cur_ctc",
        domSelectorHash: "h_cur_ctc",
      },
      {
        id: "f_exp_ctc",
        frameId: 0,
        tag: "input",
        type: "text",
        name: "expected_ctc",
        rawLabel: "Expected CTC (In Lakhs)*",
        normalizedLabel: "expected ctc in lakhs",
        domSelector: "#exp_ctc",
        domSelectorHash: "h_exp_ctc",
      },
      {
        id: "f_notice",
        frameId: 0,
        tag: "select",
        type: "select",
        name: "notice_period",
        rawLabel: "Notice Period*",
        normalizedLabel: "notice period",
        options: [
          { value: "", label: "Please Select" },
          { value: "imm", label: "Immediate (0-15 days)" },
          { value: "30d", label: "30 Days" },
          { value: "60d", label: "60 Days" },
          { value: "90d", label: "90 Days" },
        ],
        domSelector: "#notice",
        domSelectorHash: "h_notice",
      },
    ];

    const result = await generateDynamicFieldAnswers(fields, mockProfile);

    expect(result.mappings).toHaveLength(5);

    const yearsMap = result.mappings.find((m) => m.fieldId === "f_years");
    expect(yearsMap).toBeDefined();
    expect(yearsMap?.valueToFill).toBe("0");
    expect(yearsMap?.action).toBe("fill");

    const monthsMap = result.mappings.find((m) => m.fieldId === "f_months");
    expect(monthsMap).toBeDefined();
    expect(["0", "0 Months"]).toContain(monthsMap?.valueToFill);
    expect(monthsMap?.action).toBe("fill");

    const curCtcMap = result.mappings.find((m) => m.fieldId === "f_cur_ctc");
    expect(curCtcMap).toBeDefined();
    expect(curCtcMap?.valueToFill).toBe("0");

    const expCtcMap = result.mappings.find((m) => m.fieldId === "f_exp_ctc");
    expect(expCtcMap).toBeDefined();
    expect(expCtcMap?.valueToFill).toBeTruthy();

    const noticeMap = result.mappings.find((m) => m.fieldId === "f_notice");
    expect(noticeMap).toBeDefined();
    expect(["imm", "Immediate (0-15 days)", "Immediate"]).toContain(noticeMap?.valueToFill);
  });

  it("Generates tailored response for open-ended technical / behavioral questions", async () => {
    const fields: FieldDescriptor[] = [
      {
        id: "f_why_hire",
        frameId: 0,
        tag: "textarea",
        type: "textarea",
        name: "why_hire",
        rawLabel: "Why should we hire you for this internship?",
        normalizedLabel: "why should we hire you for this internship",
        domSelector: "#why_hire",
        domSelectorHash: "h_why_hire",
      },
    ];

    const result = await generateDynamicFieldAnswers(fields, mockProfile);

    expect(result.mappings).toHaveLength(1);
    const whyMap = result.mappings[0];
    expect(whyMap.action).toBe("fill");
    expect(typeof whyMap.valueToFill).toBe("string");
    expect((whyMap.valueToFill as string).length).toBeGreaterThan(20);
    expect(whyMap.confidence).toBeGreaterThanOrEqual(0.9);
  });
});
