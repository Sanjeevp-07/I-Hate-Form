import { describe, it, expect, beforeEach } from "vitest";
import { findBestOptionMatch } from "../apps/extension/src/content/dropdown-matcher";
import { setNativeValue } from "../apps/extension/src/content/event-dispatcher";
import { executeAutofill } from "../apps/extension/src/content/autofill-engine";
import { FieldDescriptor, FieldMapping } from "@internship-copilot/types";

describe("Phase 3: Dropdown Option Matching & Robust Autofill", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("findBestOptionMatch", () => {
    it("matches Gender options accurately regardless of representation", () => {
      const options = [
        { index: 0, value: "", label: "Please Select" },
        { index: 1, value: "1", label: "Male" },
        { index: 2, value: "2", label: "Female" },
        { index: 3, value: "3", label: "Other" },
      ];

      const match = findBestOptionMatch(options, "Male");
      expect(match).not.toBeNull();
      expect(match?.matchedIndex).toBe(1);
      expect(match?.matchedValue).toBe("1");

      const matchF = findBestOptionMatch(options, "female");
      expect(matchF?.matchedIndex).toBe(2);
    });

    it("matches Country & Nationality options with aliases & codes", () => {
      const countryOptions = [
        { index: 0, value: "", label: "Select Country" },
        { index: 1, value: "US", label: "United States" },
        { index: 2, value: "IN", label: "India" },
        { index: 3, value: "GB", label: "United Kingdom" },
      ];

      const matchIndia = findBestOptionMatch(countryOptions, "India");
      expect(matchIndia?.matchedIndex).toBe(2);
      expect(matchIndia?.matchedValue).toBe("IN");

      const matchIndian = findBestOptionMatch(countryOptions, "Indian");
      expect(matchIndian?.matchedIndex).toBe(2);
    });

    it("matches State options with abbreviations and full names", () => {
      const stateOptions = [
        { index: 0, value: "", label: "--" },
        { index: 1, value: "DL", label: "Delhi" },
        { index: 2, value: "UP", label: "Uttar Pradesh" },
        { index: 3, value: "MH", label: "Maharashtra" },
      ];

      const matchUP = findBestOptionMatch(stateOptions, "Uttar Pradesh");
      expect(matchUP?.matchedIndex).toBe(2);
      expect(matchUP?.matchedValue).toBe("UP");
    });

    it("matches Country dial code options like 'India (+91)'", () => {
      const dialOptions = [
        { index: 0, value: "", label: "Select Dial Code" },
        { index: 1, value: "+1", label: "USA (+1)" },
        { index: 2, value: "+91", label: "India (+91)" },
      ];

      const matchDial = findBestOptionMatch(dialOptions, "+91");
      expect(matchDial?.matchedIndex).toBe(2);
    });

    it("matches numeric Months options like '0 months' when target is '0'", () => {
      const monthOptions = [
        { index: 0, value: "", label: "Please Select" },
        { index: 1, value: "0", label: "0 months" },
        { index: 2, value: "1", label: "1 months" },
        { index: 3, value: "2", label: "2 months" },
        { index: 11, value: "10", label: "10 months" },
        { index: 12, value: "11", label: "11 months" },
      ];

      const match0 = findBestOptionMatch(monthOptions, "0");
      expect(match0).not.toBeNull();
      expect(match0?.matchedIndex).toBe(1);
      expect(match0?.matchedText).toBe("0 months");

      const match10 = findBestOptionMatch(monthOptions, "10");
      expect(match10?.matchedIndex).toBe(11);
    });

    it("matches Notice Period options accurately", () => {
      const noticeOptions = [
        { index: 0, value: "", label: "Please Select" },
        { index: 1, value: "immediate_joiner", label: "Immediate Joiner" },
        { index: 2, value: "15_days", label: "15 Days" },
        { index: 3, value: "1_month", label: "1 Month" },
      ];

      const matchNotice = findBestOptionMatch(noticeOptions, "Immediate");
      expect(matchNotice).not.toBeNull();
      expect(matchNotice?.matchedIndex).toBe(1);
    });
  });

  describe("setNativeValue on HTMLSelectElement", () => {
    it("selects correct option and dispatches change and input events", () => {
      document.body.innerHTML = `
        <form>
          <label for="gender">Gender</label>
          <select id="gender" name="gender">
            <option value="">Please Select</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          <span id="selected-val">NONE</span>
        </form>
      `;

      const select = document.getElementById("gender") as HTMLSelectElement;
      const display = document.getElementById("selected-val") as HTMLSpanElement;

      select.addEventListener("change", () => {
        display.textContent = select.value;
      });

      const result = setNativeValue(select, "Male");
      expect(result.success).toBe(true);
      expect(select.selectedIndex).toBe(1);
      expect(select.value).toBe("M");
      expect(display.textContent).toBe("M");
    });
  });

  describe("executeAutofill with select elements", () => {
    it("autofills multiple dropdown fields on form including Gender, Country, Nationality", async () => {
      document.body.innerHTML = `
        <form id="job-form">
          <select id="title" name="title">
            <option value="">Select Title</option>
            <option value="Mr.">Mr.</option>
            <option value="Ms.">Ms.</option>
          </select>
          <select id="gender" name="gender">
            <option value="">Please Select</option>
            <option value="male_val">Male</option>
            <option value="female_val">Female</option>
          </select>
          <select id="country" name="country">
            <option value="">Select Country</option>
            <option value="101">India</option>
            <option value="102">United States</option>
          </select>
          <select id="nationality" name="nationality">
            <option value="">Please Select</option>
            <option value="IND">Indian</option>
            <option value="USA">American</option>
          </select>
        </form>
      `;

      const fields: FieldDescriptor[] = [
        {
          id: "f_0_0_title",
          frameId: 0,
          tag: "select",
          type: "select",
          domSelector: "#title",
          domSelectorHash: "h1",
          rawLabel: "Title",
          normalizedLabel: "title",
        },
        {
          id: "f_0_1_gender",
          frameId: 0,
          tag: "select",
          type: "select",
          domSelector: "#gender",
          domSelectorHash: "h2",
          rawLabel: "Gender",
          normalizedLabel: "gender",
        },
        {
          id: "f_0_2_country",
          frameId: 0,
          tag: "select",
          type: "select",
          domSelector: "#country",
          domSelectorHash: "h3",
          rawLabel: "Country",
          normalizedLabel: "country",
        },
        {
          id: "f_0_3_nationality",
          frameId: 0,
          tag: "select",
          type: "select",
          domSelector: "#nationality",
          domSelectorHash: "h4",
          rawLabel: "Nationality",
          normalizedLabel: "nationality",
        },
      ];

      const mappings: FieldMapping[] = [
        {
          fieldId: "f_0_0_title",
          rawLabel: "Title",
          normalizedLabel: "title",
          profilePath: "personal.title",
          valueToFill: "Mr.",
          confidence: 0.98,
          action: "fill",
          source: "rule",
        },
        {
          fieldId: "f_0_1_gender",
          rawLabel: "Gender",
          normalizedLabel: "gender",
          profilePath: "personal.gender",
          valueToFill: "Male",
          confidence: 0.98,
          action: "fill",
          source: "rule",
        },
        {
          fieldId: "f_0_2_country",
          rawLabel: "Country",
          normalizedLabel: "country",
          profilePath: "personal.country",
          valueToFill: "India",
          confidence: 0.98,
          action: "fill",
          source: "rule",
        },
        {
          fieldId: "f_0_3_nationality",
          rawLabel: "Nationality",
          normalizedLabel: "nationality",
          profilePath: "personal.nationality",
          valueToFill: "Indian",
          confidence: 0.98,
          action: "fill",
          source: "rule",
        },
      ];

      const result = await executeAutofill(fields, mappings);

      expect(result.filledFieldIds).toHaveLength(4);
      expect(result.errors).toHaveLength(0);

      const titleEl = document.getElementById("title") as HTMLSelectElement;
      const genderEl = document.getElementById("gender") as HTMLSelectElement;
      const countryEl = document.getElementById("country") as HTMLSelectElement;
      const nationalityEl = document.getElementById("nationality") as HTMLSelectElement;

      expect(titleEl.value).toBe("Mr.");
      expect(genderEl.value).toBe("male_val");
      expect(countryEl.value).toBe("101");
      expect(nationalityEl.value).toBe("IND");
    });

    it("autofills Gender and Nationality in forms with container divs and label associations", async () => {
      document.body.innerHTML = `
        <div class="form-container">
          <div class="form-group">
            <label for="ddlGender">Gender*</label>
            <select id="ddlGender" name="ddlGender">
              <option value="">Please Select</option>
              <option value="1">Male</option>
              <option value="2">Female</option>
              <option value="3">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="ddlNationality">Nationality</label>
            <select id="ddlNationality" name="ddlNationality">
              <option value="">Please Select</option>
              <option value="101">Indian</option>
              <option value="102">American</option>
            </select>
          </div>
        </div>
      `;

      const fields: FieldDescriptor[] = [
        {
          id: "f_gender",
          frameId: 0,
          tag: "select",
          type: "select",
          domSelector: "#ddlGender",
          domSelectorHash: "h_gen",
          rawLabel: "Gender*",
          normalizedLabel: "gender",
        },
        {
          id: "f_nationality",
          frameId: 0,
          tag: "select",
          type: "select",
          domSelector: "#ddlNationality",
          domSelectorHash: "h_nat",
          rawLabel: "Nationality",
          normalizedLabel: "nationality",
        },
      ];

      const mappings: FieldMapping[] = [
        {
          fieldId: "f_gender",
          rawLabel: "Gender*",
          normalizedLabel: "gender",
          profilePath: "personal.gender",
          valueToFill: "Male",
          confidence: 0.98,
          action: "fill",
          source: "rule",
        },
        {
          fieldId: "f_nationality",
          rawLabel: "Nationality",
          normalizedLabel: "nationality",
          profilePath: "personal.nationality",
          valueToFill: "Indian",
          confidence: 0.98,
          action: "fill",
          source: "rule",
        },
      ];

      const result = await executeAutofill(fields, mappings);

      expect(result.filledFieldIds).toContain("f_gender");
      expect(result.filledFieldIds).toContain("f_nationality");

      const genderSelect = document.getElementById("ddlGender") as HTMLSelectElement;
      const natSelect = document.getElementById("ddlNationality") as HTMLSelectElement;

      expect(genderSelect.value).toBe("1");
      expect(genderSelect.selectedIndex).toBe(1);
      expect(natSelect.value).toBe("101");
      expect(natSelect.selectedIndex).toBe(1);
    });
  });
});
