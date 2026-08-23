import { describe, it, expect, beforeEach } from "vitest";
import { scanFormFieldsWithStats } from "../apps/extension/src/content/dom-scanner";
import { FrameRegistry } from "../apps/extension/src/content/frame-registry";

describe("Phase 2 Acceptance: Multi-Frame & Deep Shadow DOM Scanner (§16)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Fixture 1: Correctly enumerates standard inputs with raw & normalized labels", () => {
    document.body.innerHTML = `
      <form id="standard-form">
        <label for="first-name">First Name *</label>
        <input type="text" id="first-name" name="firstName" required />
        <label for="email">Email Address:</label>
        <input type="email" id="email" name="email" required />
      </form>
    `;

    const result = scanFormFieldsWithStats();
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].rawLabel).toContain("First Name");
    expect(result.fields[0].normalizedLabel).toBe("first name");
    expect(result.fields[0].required).toBe(true);
    expect(result.fields[1].normalizedLabel).toBe("email address");
  });

  it("Fixture 2: Open Shadow DOM — Pierces shadow root and extracts nested fields", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <div class="workday-component">
        <label for="shadow-phone">Mobile Phone</label>
        <input type="tel" id="shadow-phone" name="phone" />
      </div>
    `;

    const result = scanFormFieldsWithStats();
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].normalizedLabel).toBe("mobile phone");
    expect(result.fields[0].type).toBe("tel");
  });

  it("Fixture 3: Closed Shadow DOM — Honest reporting without false successes (§8.5)", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    // Closed shadow roots cannot be pierced by DOM walker
    host.attachShadow({ mode: "closed" });

    const result = scanFormFieldsWithStats();
    expect(result.fields).toHaveLength(0);
    // Closed root is safely bypassed without throwing errors
  });

  it("Fixture 4: Framework select and textareas extracted with options", () => {
    document.body.innerHTML = `
      <form>
        <label for="country">Country</label>
        <select id="country" name="country">
          <option value="US">United States</option>
          <option value="CA">Canada</option>
        </select>
        <label for="cover-letter">Cover Letter</label>
        <textarea id="cover-letter" name="coverLetter"></textarea>
      </form>
    `;

    const result = scanFormFieldsWithStats();
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].type).toBe("select");
    expect(result.fields[0].options).toHaveLength(2);
    expect(result.fields[1].type).toBe("textarea");
  });

  it("Fixture 5: FrameRegistry assigns valid frameId metadata to scanned fields (§8.3)", () => {
    FrameRegistry.initialize();
    document.body.innerHTML = `
      <label for="f-field">Full Legal Name</label>
      <input type="text" id="f-field" />
    `;

    const result = scanFormFieldsWithStats();
    expect(result.fields[0].frameId).toBeDefined();
    expect(typeof result.fields[0].frameId).toBe("number");
    expect(result.isTopFrame).toBe(true);
  });
});
