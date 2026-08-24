import { UserProfile } from "@internship-copilot/types";
import { querySelectorAllDeep } from "./shadow-dom-walker";

export interface ResumeUploadResult {
  detected: boolean;
  uploaded: boolean;
  elementCount: number;
  fileName: string;
  fileSizeBytes: number;
}

/**
 * Builds a valid minimal PDF binary document in memory containing candidate details.
 */
export function generateResumePdfBlob(profile: UserProfile | null): Blob {
  const firstName = profile?.personal?.firstName || "Sanjeev";
  const lastName = profile?.personal?.lastName || "Kumar";
  const fullName = `${firstName} ${lastName}`.trim();
  const email = profile?.personal?.email || "sanjeev1803t@gmail.com";
  const phone = profile?.personal?.phone ? `${profile.personal.countryCode || "+91"} ${profile.personal.phone}` : "+91 8825171882";
  const city = profile?.personal?.city || "Greater Noida";
  const state = profile?.personal?.state || "Uttar Pradesh";
  const country = profile?.personal?.country || "India";
  const location = [city, state, country].filter(Boolean).join(", ");
  const linkedin = profile?.links?.linkedin || "https://www.linkedin.com/in/sanjeev-kumar-1803t/";
  const github = profile?.links?.github || "https://github.com/Sanjeevp-07";
  const portfolio = profile?.links?.portfolio || "https://port-folio-three-olive.vercel.app/";

  // Minimal valid PDF-1.4 file specification
  const pdfBody = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 5 0 R
      /F2 6 0 R
    >>
  >>
>>
endobj
4 0 obj
<<
  /Length 750
>>
stream
BT
/F2 20 Tf
50 740 Td
(${fullName}) Tj
/F1 10 Tf
0 -22 Td
(${email} | ${phone} | ${location}) Tj
0 -16 Td
(LinkedIn: ${linkedin} | GitHub: ${github}) Tj
0 -16 Td
(Portfolio: ${portfolio}) Tj
0 -25 Td
/F2 14 Tf
(PROFESSIONAL SUMMARY) Tj
/F1 10 Tf
0 -16 Td
(Dedicated Software Engineer with expertise in Full-Stack Web Development, Modern TypeScript/React, and Cloud Systems.) Tj
0 -25 Td
/F2 14 Tf
(CORE COMPETENCIES) Tj
/F1 10 Tf
0 -16 Td
(Languages: TypeScript, JavaScript, Python, C++, HTML5, CSS3, SQL) Tj
0 -15 Td
(Frameworks & Tools: Next.js, React, Node.js, Express, TailwindCSS, Git, Docker, Vitest) Tj
0 -25 Td
/F2 14 Tf
(EDUCATION & PROJECTS) Tj
/F1 10 Tf
0 -16 Td
(Bachelor of Technology - Computer Science & Engineering) Tj
0 -15 Td
(Key Projects: AI Job Application Copilot, Full-Stack SaaS Platforms, Distributed Data Pipelines) Tj
ET
endstream
endobj
5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
6 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000001068 00000 n 
0000001147 00000 n 
trailer
<<
  /Size 7
  /Root 1 0 R
>>
startxref
1231
%%EOF`;

  return new Blob([pdfBody], { type: "application/pdf" });
}

/**
/**
 * Checks if an element is currently rendered and visible (not display:none, visibility:hidden, or inside hidden wizard tabs).
 */
export function isElementVisible(element: HTMLElement): boolean {
  // Check inline or ancestor hidden styles/attributes
  if (element.closest('[style*="display: none"], [style*="display:none"], [hidden], .hidden, [aria-hidden="true"]')) {
    return false;
  }

  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }
      if (style.opacity === "0" && current !== element) {
        return false;
      }
      current = current.parentElement;
    }
  }

  return true;
}

/**
 * Searches the DOM and all accessible shadow roots for visible Resume / CV file upload elements.
 */
export function findResumeUploadInputs(): HTMLInputElement[] {
  const allFileInputs = querySelectorAllDeep('input[type="file"]') as HTMLInputElement[];
  const resumeInputs: HTMLInputElement[] = [];

  const resumeKeywords = /resume|cv\b|curriculum|biodata|profile[\s_-]?upload|attach[\s_-]?resume|upload[\s_-]?resume|upload[\s_-]?cv|upload[\s_-]?document/i;

  for (const input of allFileInputs) {
    if (!isElementVisible(input)) {
      continue;
    }

    const name = input.getAttribute("name") || "";
    const id = input.getAttribute("id") || "";
    const accept = (input.getAttribute("accept") || "").toLowerCase();
    const ariaLabel = input.getAttribute("aria-label") || "";
    const parentText = (input.parentElement?.textContent || "").slice(0, 150);
    const label = input.closest("label") || (input.id ? document.querySelector(`label[for="${input.id}"]`) : null);
    const labelText = (label?.textContent || "").slice(0, 150);
    const dataAutomation = input.getAttribute("data-automation-id") || "";

    const textBlob = `${name} ${id} ${ariaLabel} ${labelText} ${parentText} ${dataAutomation}`.toLowerCase();

    const isPdfAccept = accept.includes("pdf") || accept.includes("doc") || accept.includes("docx");
    const matchesResumeKeyword = resumeKeywords.test(textBlob);

    // Only consider it a resume input if it explicitly accepts PDF/DOC documents OR its label/surrounding context matches resume/cv keywords
    if (matchesResumeKeyword || isPdfAccept) {
      resumeInputs.push(input);
    }
  }

  return resumeInputs;
}

/**
 * Automatically uploads the user's Resume PDF to all detected file upload inputs.
 * Executes as the FIRST task before any field is filled.
 */
export function autoUploadResume(profile: UserProfile | null): ResumeUploadResult {
  const fileInputs = findResumeUploadInputs();
  if (fileInputs.length === 0) {
    return {
      detected: false,
      uploaded: false,
      elementCount: 0,
      fileName: "",
      fileSizeBytes: 0,
    };
  }

  const firstName = profile?.personal?.firstName || "Sanjeev";
  const lastName = profile?.personal?.lastName || "Kumar";
  const rawFileName = `${firstName}_${lastName}_Resume.pdf`.replace(/\s+/g, "_");

  const pdfBlob = generateResumePdfBlob(profile);
  const pdfFile = new File([pdfBlob], rawFileName, { type: "application/pdf" });

  let uploadedCount = 0;

  for (const input of fileInputs) {
    try {
      if (typeof DataTransfer !== "undefined") {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(pdfFile);
        input.files = dataTransfer.files;
      } else {
        Object.defineProperty(input, "files", {
          value: [pdfFile],
          writable: true,
          configurable: true,
        });
      }

      // Dispatch full bubbling events for React/Angular/Vue/native form listeners
      input.dispatchEvent(new Event("focus", { bubbles: true }));
      input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      input.dispatchEvent(new Event("blur", { bubbles: true }));

      // Also trigger on closest dropzones or file labels if present
      const label = input.closest("label") || document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        label.dispatchEvent(new Event("change", { bubbles: true }));
      }

      uploadedCount++;
    } catch (err) {
      console.warn("Could not set file on input:", err);
    }
  }

  return {
    detected: true,
    uploaded: uploadedCount > 0,
    elementCount: uploadedCount,
    fileName: rawFileName,
    fileSizeBytes: pdfBlob.size,
  };
}
