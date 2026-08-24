import { describe, it, expect, beforeEach } from "vitest";
import { detectElementWarning, detectFieldValidationWarnings } from "../apps/extension/src/content/warning-detector";
import { executeAutofill } from "../apps/extension/src/content/autofill-engine";
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
  projects: [],
  skills: [{ id: "sk_1", category: "Languages", name: "TypeScript" }],
};

describe("Phase 8: Post-Autofill Validation Warning Detection & NVIDIA NIM Self-Correction", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Detects red text validation warning rendered below an invalid field", () => {
    document.body.innerHTML = `
      <div class="form-group">
        <label for="exp_ctc">Expected CTC (In Lakhs)*</label>
        <input type="text" id="exp_ctc" name="expected_ctc" value="3.5" />
        <span class="field-warning" style="color: red;">Please enter in numbers</span>
      </div>
    `;

    const input = document.getElementById("exp_ctc") as HTMLInputElement;
    const warning = detectElementWarning(input);

    expect(warning).toBe("Please enter in numbers");
  });

  it("Detects ARIA invalid and error message elements", () => {
    document.body.innerHTML = `
      <div>
        <label for="phone">Phone Number</label>
        <input type="text" id="phone" aria-invalid="true" aria-errormessage="phone-err" value="+91-882517" />
        <p id="phone-err" class="error-msg">Only digits allowed</p>
      </div>
    `;

    const input = document.getElementById("phone") as HTMLInputElement;
    const warning = detectElementWarning(input);

    expect(warning).toBe("Only digits allowed");
  });

  it("Builds prompt with validation warnings for self-correction", () => {
    const fields: FieldDescriptor[] = [
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
    ];

    const { system, user } = buildDynamicFieldAnswerPrompt({
      fields,
      profile: mockProfile,
      fieldWarnings: [
        {
          fieldId: "f_exp_ctc",
          attemptedValue: "3.5",
          warningMessage: "Please enter in numbers",
        },
      ],
    });

    expect(system).toContain("VALIDATION ERROR SELF-CORRECTION");
    expect(system).toContain("STRICT DATABASE ISOLATION");
    expect(user).toContain("Please enter in numbers");
    expect(user).toContain("3.5");
  });

  it("Generates compliant integer answer when warning indicates 'Please enter in numbers'", async () => {
    const fields: FieldDescriptor[] = [
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
    ];

    const result = await generateDynamicFieldAnswers(fields, mockProfile, [
      {
        fieldId: "f_exp_ctc",
        attemptedValue: "3.5",
        warningMessage: "Please enter in numbers",
      },
    ]);

    expect(result.mappings).toHaveLength(1);
    expect(result.mappings[0].fieldId).toBe("f_exp_ctc");
    expect(result.mappings[0].valueToFill).toBe("3");
    expect(result.mappings[0].action).toBe("fill");
  });

  it("Performs end-to-end autofill self-correction loop when field renders a validation warning", async () => {
    document.body.innerHTML = `
      <form id="app-form">
        <div class="form-group">
          <label for="exp_ctc">Expected CTC (In Lakhs)*</label>
          <input type="text" id="exp_ctc" name="expected_ctc" />
          <span id="ctc-err" style="display: none; color: red;">Please enter in numbers</span>
        </div>
      </form>
    `;

    const input = document.getElementById("exp_ctc") as HTMLInputElement;
    const errSpan = document.getElementById("ctc-err") as HTMLSpanElement;

    // Simulate page validation: when "3.5" is entered, page displays red error text
    input.addEventListener("input", () => {
      if (input.value === "3.5") {
        errSpan.style.display = "block";
      } else if (input.value === "3") {
        errSpan.style.display = "none";
      }
    });

    const fields: FieldDescriptor[] = [
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
    ];

    const mappings = [
      {
        fieldId: "f_exp_ctc",
        rawLabel: "Expected CTC (In Lakhs)*",
        normalizedLabel: "expected ctc in lakhs",
        profilePath: null,
        valueToFill: "3.5",
        confidence: 0.95,
        action: "fill" as const,
        source: "ai_strong" as const,
      },
    ];

    const result = await executeAutofill(fields, mappings, mockProfile);

    // Assert that self-correction kicked in and updated the input to "3"
    expect(input.value).toBe("3");
    expect(result.corrections).toBeDefined();
    expect(result.corrections?.length).toBeGreaterThan(0);
    expect(result.corrections?.[0].fieldId).toBe("f_exp_ctc");
    expect(result.corrections?.[0].previousValue).toBe("3.5");
    expect(result.corrections?.[0].correctedValue).toBe("3");
  });

  it("Self-corrects unselected required select dropdown (Months* -> '0') when flagged as 'This field is required.'", async () => {
    document.body.innerHTML = `
      <form id="exp-form">
        <div class="form-group">
          <label for="months">Months*</label>
          <select id="months" name="months">
            <option value="">Please Select</option>
            <option value="0">0 Months</option>
            <option value="1">1 Month</option>
            <option value="6">6 Months</option>
          </select>
          <span class="error-msg" style="color: red;">This field is required.</span>
        </div>
      </form>
    `;

    const select = document.getElementById("months") as HTMLSelectElement;

    const fields: FieldDescriptor[] = [
      {
        id: "f_months",
        frameId: 0,
        tag: "select",
        type: "select",
        name: "months",
        rawLabel: "Months*",
        normalizedLabel: "months",
        domSelector: "#months",
        domSelectorHash: "h_months",
        options: [
          { value: "", label: "Please Select" },
          { value: "0", label: "0 Months" },
          { value: "1", label: "1 Month" },
          { value: "6", label: "6 Months" },
        ],
        required: true,
      },
    ];

    const mappings = [
      {
        fieldId: "f_months",
        rawLabel: "Months*",
        normalizedLabel: "months",
        profilePath: null,
        valueToFill: "",
        confidence: 0.0,
        action: "review" as const,
        source: "ai_fast" as const,
      },
    ];

    const result = await executeAutofill(fields, mappings, mockProfile);

    expect(select.value).toBe("0");
    expect(result.filledFieldIds).toContain("f_months");
    expect(result.corrections).toBeDefined();
    expect(result.corrections?.some((c) => c.fieldId === "f_months")).toBe(true);
  });

  it("Accurately autofills Title* as 'Mr.' (never 'Miss.') and Country Code* as 'India (+91)' (never 'Afghanistan (+93)')", async () => {
    document.body.innerHTML = `
      <form id="jakson-form">
        <div class="form-group">
          <label for="title">Title*</label>
          <select id="title" name="title">
            <option value="">Please Select</option>
            <option value="Miss.">Miss.</option>
            <option value="Mr.">Mr.</option>
            <option value="Mrs.">Mrs.</option>
          </select>
        </div>
        <div class="form-group">
          <label for="country_code">Country Code*</label>
          <select id="country_code" name="country_code">
            <option value="">Please Select</option>
            <option value="AFG_93">Afghanistan (+93)</option>
            <option value="IND_91">India (+91)</option>
            <option value="USA_1">United States (+1)</option>
          </select>
        </div>
      </form>
    `;

    const titleSelect = document.getElementById("title") as HTMLSelectElement;
    const countryCodeSelect = document.getElementById("country_code") as HTMLSelectElement;

    const fields: FieldDescriptor[] = [
      {
        id: "f_title",
        frameId: 0,
        tag: "select",
        type: "select",
        name: "title",
        rawLabel: "Title*",
        normalizedLabel: "title",
        domSelector: "#title",
        domSelectorHash: "h_title",
      },
      {
        id: "f_country_code",
        frameId: 0,
        tag: "select",
        type: "select",
        name: "country_code",
        rawLabel: "Country Code*",
        normalizedLabel: "country code",
        domSelector: "#country_code",
        domSelectorHash: "h_country_code",
      },
    ];

    const mappings = [
      {
        fieldId: "f_title",
        rawLabel: "Title*",
        normalizedLabel: "title",
        profilePath: "personal.title",
        valueToFill: "Mr.",
        confidence: 0.98,
        action: "fill" as const,
        source: "rule" as const,
      },
      {
        fieldId: "f_country_code",
        rawLabel: "Country Code*",
        normalizedLabel: "country code",
        profilePath: "personal.countryCode",
        valueToFill: "+91",
        confidence: 0.98,
        action: "fill" as const,
        source: "rule" as const,
      },
    ];

    const result = await executeAutofill(fields, mappings, mockProfile);

    // Verify Title is Mr. (not Miss.)
    expect(titleSelect.value).toBe("Mr.");
    expect(titleSelect.options[titleSelect.selectedIndex].text).toBe("Mr.");

    // Verify Country Code is India (+91) (not Afghanistan)
    expect(countryCodeSelect.value).toBe("IND_91");
    expect(countryCodeSelect.options[countryCodeSelect.selectedIndex].text).toBe("India (+91)");

    expect(result.filledFieldIds).toContain("f_title");
    expect(result.filledFieldIds).toContain("f_country_code");
  });
});
