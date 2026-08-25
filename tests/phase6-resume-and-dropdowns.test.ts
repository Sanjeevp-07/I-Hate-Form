import { describe, it, expect, beforeEach } from "vitest";
import { mapFieldDeterministically } from "../apps/extension/src/content/field-mapper";
import { executeAutofill } from "../apps/extension/src/content/autofill-engine";
import { autoUploadResume } from "../apps/extension/src/content/resume-uploader";
import { FieldDescriptor, UserProfile } from "@internship-copilot/types";

describe("Phase 6: Country Mapping, Dropdown Autofill & Resume PDF Auto-Upload", () => {
  const mockProfile: UserProfile = {
    personal: {
      firstName: "Sanjeev",
      lastName: "Kumar",
      email: "sanjeev1803t@gmail.com",
      phone: "8825171882",
      countryCode: "+91",
      gender: "Male",
      nationality: "Indian",
      dob: "2005-07-06",
      country: "India",
      state: "Uttar Pradesh",
      city: "Greater Noida",
      postalCode: "201306",
      address: "Lakhnawali",
    },
    links: {
      linkedin: "https://www.linkedin.com/in/sanjeev-kumar-1803t/",
      github: "https://github.com/Sanjeevp-07",
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    customAnswers: [],
  };

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Country field maps to 'India' with high confidence (not user full name)", () => {
    const countryField: FieldDescriptor = {
      id: "f_0_1_country",
      frameId: 0,
      tag: "select",
      type: "select",
      name: "country",
      rawLabel: "Country*",
      normalizedLabel: "country",
      domSelector: "#country",
      domSelectorHash: "hash_country",
      nearbyText: "Please select your country of residence. Full Name and Contact Info required.",
      options: [
        { value: "", label: "Select Country" },
        { value: "IN", label: "India" },
        { value: "US", label: "United States" },
      ],
    };

    const mapping = mapFieldDeterministically(countryField, mockProfile);

    expect(mapping.profilePath).toBe("personal.country");
    expect(mapping.valueToFill).toBe("India");
    expect(mapping.confidence).toBeGreaterThanOrEqual(0.95);
    expect(mapping.valueToFill).not.toBe("Sanjeev Kumar");
  });

  it("Full name field explicitly maps to 'Sanjeev Kumar'", () => {
    const nameField: FieldDescriptor = {
      id: "f_0_0_name",
      frameId: 0,
      tag: "input",
      type: "text",
      name: "fullName",
      rawLabel: "Full Name*",
      normalizedLabel: "full name",
      domSelector: "#fullName",
      domSelectorHash: "hash_name",
    };

    const mapping = mapFieldDeterministically(nameField, mockProfile);

    expect(mapping.profilePath).toBe("personal.fullName");
    expect(mapping.valueToFill).toBe("Sanjeev Kumar");
  });

  it("Detects and auto-uploads Resume PDF as the very first task", () => {
    document.body.innerHTML = `
      <form id="job-form">
        <label for="resume-upload">Upload Resume / CV (PDF)</label>
        <input type="file" id="resume-upload" name="resume" accept=".pdf,.doc,.docx" />
      </form>
    `;

    const result = autoUploadResume(mockProfile);

    expect(result.detected).toBe(true);
    expect(result.uploaded).toBe(true);
    expect(result.fileName).toContain("Sanjeev_Kumar_Resume.pdf");

    const input = document.getElementById("resume-upload") as HTMLInputElement;
    expect(input.files).not.toBeNull();
    expect(input.files?.length).toBe(1);
    expect(input.files?.[0].name).toBe("Sanjeev_Kumar_Resume.pdf");
    expect(input.files?.[0].type).toBe("application/pdf");
  });

  it("Does NOT upload resume when no file input is present on the page", () => {
    document.body.innerHTML = `
      <form id="step-2-form">
        <label for="experience">Total Experience</label>
        <input type="text" id="experience" name="experience" />
      </form>
    `;

    const result = autoUploadResume(mockProfile);

    expect(result.detected).toBe(false);
    expect(result.uploaded).toBe(false);
    expect(result.elementCount).toBe(0);
  });

  it("Does NOT upload resume when file input is in a hidden wizard step (display: none)", () => {
    document.body.innerHTML = `
      <div id="wizard-step-1" style="display: none;">
        <label for="resume-step1">Upload Resume</label>
        <input type="file" id="resume-step1" name="resume" accept=".pdf" />
      </div>
      <div id="wizard-step-2" style="display: block;">
        <label for="experience">Total Experience</label>
        <input type="text" id="experience" name="experience" />
      </div>
    `;

    const result = autoUploadResume(mockProfile);

    expect(result.detected).toBe(false);
    expect(result.uploaded).toBe(false);
    expect(result.elementCount).toBe(0);
  });

  it("Does NOT upload resume when input is inside a deeply nested hidden wizard panel (e.g. .d-none or [aria-hidden='true'])", () => {
    document.body.innerHTML = `
      <div class="phenom-wizard">
        <div class="wizard-step step-1 d-none" aria-hidden="true">
          <div class="section-container">
            <div class="file-upload-wrapper">
              <label for="resumeUpload">Upload Resume</label>
              <input type="file" id="resumeUpload" name="resume" accept=".pdf,.doc,.docx" />
            </div>
          </div>
        </div>
        <div class="wizard-step step-2 active">
          <label for="exp_years">Years*</label>
          <input type="text" id="exp_years" name="years" />
        </div>
      </div>
    `;

    const result = autoUploadResume(mockProfile);

    expect(result.detected).toBe(false);
    expect(result.uploaded).toBe(false);
    expect(result.elementCount).toBe(0);
  });

  it("Detects and auto-uploads Resume PDF to custom ATS stylized upload containers (hidden file input with Upload Resume button)", () => {
    document.body.innerHTML = `
      <div class="resume-section">
        <p>*Make completing your job application easier by uploading your resume or CV.</p>
        <p>Upload either DOC, DOCX, PDF or TXT file types (3MB max)</p>
        <input type="file" id="resume_hidden_input" name="resumeFile" style="display:none;" accept=".doc,.docx,.pdf,.txt" />
        <button type="button" class="btn btn-primary">Upload Resume</button>
      </div>
    `;

    const result = autoUploadResume(mockProfile);

    expect(result.detected).toBe(true);
    expect(result.uploaded).toBe(true);
    expect(result.fileName).toContain("Sanjeev_Kumar_Resume.pdf");

    const input = document.getElementById("resume_hidden_input") as HTMLInputElement;
    expect(input.files).not.toBeNull();
    expect(input.files?.length).toBe(1);
    expect(input.files?.[0].name).toBe("Sanjeev_Kumar_Resume.pdf");
  });

  it("Detects and auto-uploads Resume PDF to dropzone upload containers", () => {
    document.body.innerHTML = `
      <div class="dropzone file-drop-area">
        <span class="choose-file-button">Upload or drag & drop your CV / Resume</span>
        <input type="file" class="file-input" name="cv_attachment" accept="application/pdf,application/msword" />
      </div>
    `;

    const result = autoUploadResume(mockProfile);

    expect(result.detected).toBe(true);
    expect(result.uploaded).toBe(true);
    expect(result.fileName).toContain("Sanjeev_Kumar_Resume.pdf");
  });

  it("Does NOT upload resume to generic non-document file inputs (e.g. photo avatar uploaders)", () => {
    document.body.innerHTML = `
      <form id="profile-pic-form">
        <label for="avatar">Upload Profile Picture</label>
        <input type="file" id="avatar" name="avatar_pic" accept="image/png,image/jpeg" />
      </form>
    `;

    const result = autoUploadResume(mockProfile);

    expect(result.detected).toBe(false);
    expect(result.uploaded).toBe(false);
    expect(result.elementCount).toBe(0);
  });

  it("Autofills dependent dropdown (Country -> State) on the 1st autofill attempt without requiring a 2nd click", async () => {
    document.body.innerHTML = `
      <form id="app-form">
        <label for="country">Country</label>
        <select id="country" name="country">
          <option value="">Select Country</option>
          <option value="IN">India</option>
          <option value="US">United States</option>
        </select>

        <label for="state">State</label>
        <select id="state" name="state">
          <option value="">Select State</option>
        </select>
      </form>
    `;

    const countrySelect = document.getElementById("country") as HTMLSelectElement;
    const stateSelect = document.getElementById("state") as HTMLSelectElement;

    // Simulate page dynamically populating states when country is selected
    countrySelect.addEventListener("change", () => {
      if (countrySelect.value === "IN") {
        stateSelect.innerHTML = `
          <option value="">Select State</option>
          <option value="UP">Uttar Pradesh</option>
          <option value="MH">Maharashtra</option>
          <option value="DL">Delhi</option>
        `;
      }
    });

    const fields: FieldDescriptor[] = [
      {
        id: "f_country",
        frameId: 0,
        tag: "select",
        type: "select",
        name: "country",
        rawLabel: "Country",
        normalizedLabel: "country",
        domSelector: "#country",
        domSelectorHash: "h_country",
      },
      {
        id: "f_state",
        frameId: 0,
        tag: "select",
        type: "select",
        name: "state",
        rawLabel: "State",
        normalizedLabel: "state",
        domSelector: "#state",
        domSelectorHash: "h_state",
      },
    ];

    const mappings = [
      {
        fieldId: "f_country",
        rawLabel: "Country",
        normalizedLabel: "country",
        profilePath: "personal.country",
        valueToFill: "India",
        confidence: 0.98,
        action: "fill" as const,
        source: "rule" as const,
      },
      {
        fieldId: "f_state",
        rawLabel: "State",
        normalizedLabel: "state",
        profilePath: "personal.state",
        valueToFill: "Uttar Pradesh",
        confidence: 0.98,
        action: "fill" as const,
        source: "rule" as const,
      },
    ];

    const result = await executeAutofill(fields, mappings, mockProfile);

    expect(countrySelect.value).toBe("IN");
    expect(stateSelect.value).toBe("UP");
    expect(result.filledFieldIds).toContain("f_country");
    expect(result.filledFieldIds).toContain("f_state");
  });
});
