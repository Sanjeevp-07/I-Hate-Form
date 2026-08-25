import { describe, it, expect, beforeEach } from "vitest";
import { setNativeValue } from "../apps/extension/src/content/event-dispatcher";
import { executeAutofill } from "../apps/extension/src/content/autofill-engine";
import { mapFieldDeterministically } from "../apps/extension/src/content/field-mapper";
import { FieldDescriptor, FieldMapping } from "@internship-copilot/types";

describe("Phase 3 Acceptance: Framework-Controlled Inputs Autofill Engine (§8.6 & §16)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Verifies native prototype setter triggers React/Vue synthetic change listener", () => {
    document.body.innerHTML = `
      <form id="controlled-form">
        <label for="controlled-name">Full Name</label>
        <input type="text" id="controlled-name" name="name" />
        <span id="registered-state">EMPTY</span>
      </form>
    `;

    const input = document.getElementById("controlled-name") as HTMLInputElement;
    const stateDisplay = document.getElementById("registered-state") as HTMLSpanElement;

    // Simulate React controlled onChange / onInput state hook
    input.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      stateDisplay.textContent = `REGISTERED:${target.value}`;
    });

    const dispatchResult = setNativeValue(input, "Sanjeev Kumar");

    expect(dispatchResult.success).toBe(true);
    expect(dispatchResult.valueRegistered).toBe(true);
    expect(input.value).toBe("Sanjeev Kumar");
    // Verify state listener fired
    expect(stateDisplay.textContent).toBe("REGISTERED:Sanjeev Kumar");
  });

  it("Executes autofill and returns filled field IDs without false successes", async () => {
    document.body.innerHTML = `
      <form>
        <label for="email">Email</label>
        <input type="email" id="email" name="email" />
      </form>
    `;

    const fields: FieldDescriptor[] = [
      {
        id: "field_email_1",
        frameId: 0,
        tag: "input",
        type: "email",
        name: "email",
        rawLabel: "Email",
        normalizedLabel: "email",
        domSelector: "#email",
        domSelectorHash: "hash123",
      },
    ];

    const mappings: FieldMapping[] = [
      {
        fieldId: "field_email_1",
        rawLabel: "Email",
        normalizedLabel: "email",
        profilePath: "personal.email",
        valueToFill: "test@example.com",
        confidence: 0.99,
        action: "fill",
        source: "rule",
      },
    ];

    const result = await executeAutofill(fields, mappings);

    expect(result.filledFieldIds).toContain("field_email_1");
    expect(result.skippedFieldIds).toHaveLength(0);
    expect(result.errors).toHaveLength(0);

    const input = document.getElementById("email") as HTMLInputElement;
    expect(input.value).toBe("test@example.com");
  });

  it("Ensures EMAIL ADDRESS maps to personal.email and never to physical personal.address", () => {
    const dummyProfile: any = {
      id: "u1",
      userId: "u1",
      personal: {
        firstName: "Sanjeev",
        lastName: "Kumar",
        email: "sanjeev1803t@gmail.com",
        phone: "8825171882",
        address: "Lakhnawali, back of RCS School",
        password: "MySecurePassword@999",
      },
      links: {},
      education: [],
      experience: [],
      projects: [],
      skills: [],
    };

    const emailField: FieldDescriptor = {
      id: "f_email",
      frameId: 0,
      tag: "input",
      type: "email",
      rawLabel: "EMAIL ADDRESS",
      normalizedLabel: "email address",
      domSelector: "#email",
      domSelectorHash: "hash_email",
    };

    const addressField: FieldDescriptor = {
      id: "f_address",
      frameId: 0,
      tag: "input",
      type: "text",
      rawLabel: "STREET ADDRESS",
      normalizedLabel: "street address",
      domSelector: "#address",
      domSelectorHash: "hash_address",
    };

    const passwordField: FieldDescriptor = {
      id: "f_pwd",
      frameId: 0,
      tag: "input",
      type: "text",
      rawLabel: "PASSWORD",
      normalizedLabel: "password",
      domSelector: "#pwd",
      domSelectorHash: "hash_pwd",
    };

    const confirmPasswordField: FieldDescriptor = {
      id: "f_cpwd",
      frameId: 0,
      tag: "input",
      type: "text",
      rawLabel: "CONFIRM PASSWORD",
      normalizedLabel: "confirm password",
      domSelector: "#cpwd",
      domSelectorHash: "hash_cpwd",
    };

    const emailMapping = mapFieldDeterministically(emailField, dummyProfile);
    expect(emailMapping.profilePath).toBe("personal.email");
    expect(emailMapping.valueToFill).toBe("sanjeev1803t@gmail.com");

    const addressMapping = mapFieldDeterministically(addressField, dummyProfile);
    expect(addressMapping.profilePath).toBe("personal.address");
    expect(addressMapping.valueToFill).toBe("Lakhnawali, back of RCS School");

    const pwdMapping = mapFieldDeterministically(passwordField, dummyProfile);
    expect(pwdMapping.profilePath).toBe("personal.password");
    expect(pwdMapping.valueToFill).toBe("MySecurePassword@999");

    const cpwdMapping = mapFieldDeterministically(confirmPasswordField, dummyProfile);
    expect(cpwdMapping.profilePath).toBe("personal.confirmPassword");
    expect(cpwdMapping.valueToFill).toBe("MySecurePassword@999");
  });
});
