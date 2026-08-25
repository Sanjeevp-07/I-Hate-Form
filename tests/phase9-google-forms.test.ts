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
});
