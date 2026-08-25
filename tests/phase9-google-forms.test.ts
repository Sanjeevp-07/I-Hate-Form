import { describe, it, expect, beforeEach } from "vitest";
import { scanFormFields } from "../apps/extension/src/content/dom-scanner";
import { executeAutofill } from "../apps/extension/src/content/autofill-engine";
import { mapFieldDeterministically } from "../apps/extension/src/content/field-mapper";
import { UserProfile } from "@internship-copilot/types";

describe("Phase 9: Google Forms Compatibility & Autofill", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  const mockProfile: UserProfile = {
    id: "user_test",
    email: "sanjeev1803t@gmail.com",
    personal: {
      firstName: "Sanjeev",
      lastName: "Kumar",
      email: "sanjeev1803t@gmail.com",
      phone: "8825171882",
      countryCode: "+91",
      city: "Greater Noida",
      state: "Uttar Pradesh",
      country: "India",
      postalCode: "201306",
      gender: "Male",
      nationality: "Indian",
      dob: "06/07/2005",
    },
    links: {
      linkedin: "https://www.linkedin.com/in/sanjeev-kumar-1803t/",
      github: "https://github.com/Sanjeevp-07",
    },
    education: [],
    experience: [],
    skills: [],
  };

  it("Accurately scans Google Forms questions using multi-ID aria-labelledby and question containers", () => {
    document.body.innerHTML = `
      <form class="freebirdFormviewerViewFormCard">
        <!-- Question 1: Full Name with multi-ID aria-labelledby -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="i1" class="M7eMe" role="heading">Your Full Name</div>
            <div id="i4" class="v3duvd">*</div>
            <div class="Xb9hP">
              <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" id="entry_123456" aria-labelledby="i1 i4" />
            </div>
          </div>
        </div>

        <!-- Question 2: Email Address -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="i6" class="M7eMe" role="heading">Email Address</div>
            <div class="Xb9hP">
              <input type="email" class="whsOnd zHQkBf" jsname="YPqjbf" id="entry_234567" aria-labelledby="i6" />
            </div>
          </div>
        </div>

        <!-- Question 3: Phone Number -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="i9" class="M7eMe" role="heading">Mobile Number</div>
            <div class="Xb9hP">
              <input type="tel" class="whsOnd zHQkBf" jsname="YPqjbf" id="entry_345678" aria-labelledby="i9" />
            </div>
          </div>
        </div>

        <!-- Question 4: LinkedIn Profile -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="i12" class="M7eMe" role="heading">LinkedIn Profile URL</div>
            <div class="Xb9hP">
              <input type="url" class="whsOnd zHQkBf" jsname="YPqjbf" id="entry_456789" aria-labelledby="i12" />
            </div>
          </div>
        </div>
      </form>
    `;

    const fields = scanFormFields();
    expect(fields.length).toBe(4);

    expect(fields[0].rawLabel).toContain("Your Full Name");
    expect(fields[1].rawLabel).toContain("Email Address");
    expect(fields[2].rawLabel).toContain("Mobile Number");
    expect(fields[3].rawLabel).toContain("LinkedIn Profile URL");
  });

  it("Autofills Google Forms input elements and dispatches proper synthetic events", async () => {
    document.body.innerHTML = `
      <form class="freebirdFormviewerViewFormCard">
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="q_name" class="M7eMe" role="heading">Full Name</div>
            <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" id="entry_1" aria-labelledby="q_name" />
          </div>
        </div>
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="q_email" class="M7eMe" role="heading">Email</div>
            <input type="email" class="whsOnd zHQkBf" jsname="YPqjbf" id="entry_2" aria-labelledby="q_email" />
          </div>
        </div>
      </form>
    `;

    const fields = scanFormFields();
    const mappings = fields.map((f) => {
      const mapped = mapFieldDeterministically(f, mockProfile);
      return {
        fieldId: f.id,
        profilePath: mapped.profilePath,
        valueToFill: mapped.profilePath === "personal.fullName" ? "Sanjeev Kumar" : mapped.profilePath === "personal.email" ? "sanjeev1803t@gmail.com" : mapped.value,
        confidence: mapped.confidence,
        strategy: mapped.strategy,
        action: "fill" as const,
      };
    });

    const autofillResult = await executeAutofill(fields, mappings, mockProfile);
    expect(autofillResult.filledFieldIds.length).toBe(2);

    const nameInput = document.getElementById("entry_1") as HTMLInputElement;
    const emailInput = document.getElementById("entry_2") as HTMLInputElement;

    expect(nameInput.value).toBe("Sanjeev Kumar");
    expect(emailInput.value).toBe("sanjeev1803t@gmail.com");
  });

  it("Accurately autofills realistic Google Form with hidden inputs, no IDs, and paragraph textareas without index drift", async () => {
    document.body.innerHTML = `
      <form class="freebirdFormviewerViewFormCard">
        <!-- Hidden Google Form system inputs -->
        <input type="hidden" name="fvv" value="1" />
        <input type="hidden" name="fbzx" value="-882910293812" />
        <input type="hidden" name="pageHistory" value="0" />
        <input type="hidden" name="draftResponse" value="[]" />

        <!-- Question 1: Full Name (No ID or name attribute) -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="i1" class="M7eMe" role="heading">Full Name</div>
            <div class="rFrNMe">
              <div class="Xb9hP">
                <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" aria-labelledby="i1" />
                <div class="ndJi5d">Your answer</div>
              </div>
            </div>
            <div class="RBEWZc" role="alert">This is a required question</div>
          </div>
        </div>

        <!-- Question 2: Email Address -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="i5" class="M7eMe" role="heading">Email Address</div>
            <div class="rFrNMe">
              <div class="Xb9hP">
                <input type="email" class="whsOnd zHQkBf" jsname="YPqjbf" aria-labelledby="i5" />
                <div class="ndJi5d">Your answer</div>
              </div>
            </div>
            <div class="RBEWZc" role="alert">This is a required question</div>
          </div>
        </div>

        <!-- Question 3: Phone / WhatsApp Number -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="i9" class="M7eMe" role="heading">Phone / WhatsApp Number</div>
            <div class="rFrNMe">
              <div class="Xb9hP">
                <input type="tel" class="whsOnd zHQkBf" jsname="YPqjbf" aria-labelledby="i9" />
                <div class="ndJi5d">Your answer</div>
              </div>
            </div>
            <div class="RBEWZc" role="alert">This is a required question</div>
          </div>
        </div>

        <!-- Question 4: Current Location (City, State, Country) -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="i13" class="M7eMe" role="heading">Current Location (City, State, Country)</div>
            <div class="rFrNMe">
              <div class="Xb9hP">
                <input type="text" class="whsOnd zHQkBf" jsname="YPqjbf" aria-labelledby="i13" />
                <div class="ndJi5d">Your answer</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Question 5: Why should we hire you? (Paragraph textarea) -->
        <div role="listitem" class="Qr7Oae">
          <div class="geS5n">
            <div id="i17" class="M7eMe" role="heading">Why should we hire you?</div>
            <div class="rFrNMe">
              <div class="Xb9hP">
                <textarea class="KHxj8b tL9Q4c" jsname="YPqjbf" aria-labelledby="i17"></textarea>
                <div class="ndJi5d">Your answer</div>
              </div>
            </div>
          </div>
        </div>
      </form>
    `;

    const fields = scanFormFields();
    expect(fields.length).toBe(5);

    expect(fields[0].rawLabel).toContain("Full Name");
    expect(fields[1].rawLabel).toContain("Email Address");
    expect(fields[2].rawLabel).toContain("Phone / WhatsApp Number");
    expect(fields[3].rawLabel).toContain("Current Location");
    expect(fields[4].rawLabel).toContain("Why should we hire you?");

    const mappings = [
      {
        fieldId: fields[0].id,
        rawLabel: fields[0].rawLabel,
        normalizedLabel: fields[0].normalizedLabel,
        profilePath: "personal.fullName",
        valueToFill: "Sanjeev Kumar",
        confidence: 0.99,
        action: "fill" as const,
        source: "rule" as const,
      },
      {
        fieldId: fields[1].id,
        rawLabel: fields[1].rawLabel,
        normalizedLabel: fields[1].normalizedLabel,
        profilePath: "personal.email",
        valueToFill: "sanjeev1803t@gmail.com",
        confidence: 0.99,
        action: "fill" as const,
        source: "rule" as const,
      },
      {
        fieldId: fields[2].id,
        rawLabel: fields[2].rawLabel,
        normalizedLabel: fields[2].normalizedLabel,
        profilePath: "personal.phone",
        valueToFill: "8825171882",
        confidence: 0.99,
        action: "fill" as const,
        source: "rule" as const,
      },
      {
        fieldId: fields[3].id,
        rawLabel: fields[3].rawLabel,
        normalizedLabel: fields[3].normalizedLabel,
        profilePath: "personal.city",
        valueToFill: "Greater Noida, Uttar Pradesh, India",
        confidence: 0.99,
        action: "fill" as const,
        source: "rule" as const,
      },
      {
        fieldId: fields[4].id,
        rawLabel: fields[4].rawLabel,
        normalizedLabel: fields[4].normalizedLabel,
        profilePath: null,
        valueToFill: "Throughout my academic journey, I have developed strong skills in TypeScript and React.",
        confidence: 0.95,
        action: "fill" as const,
        source: "ai_strong" as const,
      },
    ];

    const result = await executeAutofill(fields, mappings, mockProfile);
    expect(result.filledFieldIds.length).toBe(5);
    expect(result.errors.length).toBe(0);

    // Verify all DOM inputs received their EXACT respective values
    const textInputs = Array.from(document.querySelectorAll('input.whsOnd')) as HTMLInputElement[];
    const textarea = document.querySelector('textarea.KHxj8b') as HTMLTextAreaElement;

    expect(textInputs[0].value).toBe("Sanjeev Kumar");
    expect(textInputs[1].value).toBe("sanjeev1803t@gmail.com");
    expect(textInputs[2].value).toBe("8825171882");
    expect(textInputs[3].value).toBe("Greater Noida, Uttar Pradesh, India");
    expect(textarea.value).toBe("Throughout my academic journey, I have developed strong skills in TypeScript and React.");

    // Verify data-initial-value and container classes
    expect(textInputs[0].getAttribute("data-initial-value")).toBe("Sanjeev Kumar");
    expect(textarea.getAttribute("data-initial-value")).toBe("Throughout my academic journey, I have developed strong skills in TypeScript and React.");

    // Verify that "Your answer" placeholder divs (.ndJi5d) are hidden (display: none or opacity: 0)
    const placeholders = Array.from(document.querySelectorAll('.ndJi5d')) as HTMLElement[];
    placeholders.forEach((p) => {
      expect(p.style.display).toBe("none");
    });

    // Verify that "This is a required question" alerts (.RBEWZc) are hidden
    const alerts = Array.from(document.querySelectorAll('.RBEWZc')) as HTMLElement[];
    alerts.forEach((a) => {
      expect(a.style.display).toBe("none");
    });

    // Verify that containers received CDNmEc (content active class)
    const rFrNMeContainers = Array.from(document.querySelectorAll('.rFrNMe')) as HTMLElement[];
    rFrNMeContainers.forEach((c) => {
      expect(c.classList.contains("CDNmEc")).toBe(true);
    });
  });
});
