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
 * Checks if a file upload element or its parent container is part of the currently visible active DOM tree
 * (returns false if the input or any of its ancestor containers is hidden in an inactive wizard tab / step).
 */
export function isFileInputActive(element: HTMLInputElement): boolean {
  if (!element || !element.isConnected) return false;

  // 1. Check if the element itself or any ancestor has hidden attributes or common hidden classes
  if (
    element.closest(
      '[aria-hidden="true"], [hidden], .hidden, .hide, .d-none, .ng-hide, [style*="display: none"], [style*="display:none"], .tab-pane:not(.active), .step:not(.active), .wizard-pane:not(.active), .wizard-step:not(.active)'
    )
  ) {
    return false;
  }

  // 2. Iterate up the ancestor tree all the way to documentElement and verify computed visibility
  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    let curr: HTMLElement | null = element.parentElement;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      try {
        const style = window.getComputedStyle(curr);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
          return false;
        }
        if (curr.hasAttribute("hidden") || curr.getAttribute("aria-hidden") === "true") {
          return false;
        }
      } catch {}
      curr = curr.parentElement;
    }
  }

  return true;
}

/**
 * Searches the DOM and all accessible shadow roots for Resume / CV file upload elements.
 */
export function findResumeUploadInputs(): HTMLInputElement[] {
  const allFileInputs = querySelectorAllDeep('input[type="file"]') as HTMLInputElement[];
  const resumeInputs: HTMLInputElement[] = [];

  const resumeKeywords = /resume|cv\b|curriculum|biodata|profile[\s_-]?upload|attach[\s_-]?resume|upload[\s_-]?resume|upload[\s_-]?cv|upload[\s_-]?document|document/i;

  for (const input of allFileInputs) {
    if (!isFileInputActive(input)) {
      continue;
    }

    const name = input.getAttribute("name") || "";
    const id = input.getAttribute("id") || "";
    const accept = (input.getAttribute("accept") || "").toLowerCase();
    const ariaLabel = input.getAttribute("aria-label") || "";
    const parentText = (input.parentElement?.textContent || "").slice(0, 200);
    const label = input.closest("label") || (input.id ? document.querySelector(`label[for="${input.id}"]`) : null);
    const labelText = (label?.textContent || "").slice(0, 200);
    const container = input.closest('form, section, div[class*="upload"], div[class*="resume"], div[class*="drop"], div[class*="file"]');
    const containerText = (container?.textContent || "").slice(0, 300);
    const dataAutomation = input.getAttribute("data-automation-id") || "";

    const textBlob = `${name} ${id} ${ariaLabel} ${labelText} ${parentText} ${containerText} ${dataAutomation}`.toLowerCase();

    // Skip photo/avatar uploaders
    const isImageOnly = (accept.includes("image") || accept.includes("png") || accept.includes("jpeg") || accept.includes("jpg")) && !accept.includes("pdf") && !accept.includes("doc");
    const isAvatar = /avatar|photo|profile[\s_-]?pic|picture|selfie|headshot/i.test(textBlob);
    if (isImageOnly || isAvatar) {
      continue;
    }

    const isPdfAccept = accept.includes("pdf") || accept.includes("doc") || accept.includes("docx") || accept === "" || accept.includes("*");
    const matchesResumeKeyword = resumeKeywords.test(textBlob);

    // If accept matches or text matches or it is the primary file input on the active form
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
      let dataTransfer: DataTransfer | null = null;
      if (typeof DataTransfer !== "undefined") {
        dataTransfer = new DataTransfer();
        dataTransfer.items.add(pdfFile);
        input.files = dataTransfer.files;
      } else {
        Object.defineProperty(input, "files", {
          value: [pdfFile],
          writable: true,
          configurable: true,
        });
      }

      // Native prototype descriptor setter for React 18/19 synthetic event systems
      try {
        const proto = window.HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, "files");
        if (descriptor && descriptor.set && dataTransfer) {
          descriptor.set.call(input, dataTransfer.files);
        }
      } catch {}

      // Dispatch full bubbling events on input
      input.dispatchEvent(new Event("focus", { bubbles: true }));
      input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

      // Dispatch drag & drop event if page uses Dropzone / React Dropzone
      if (dataTransfer && typeof DragEvent !== "undefined") {
        try {
          const dropEvent = new DragEvent("drop", {
            bubbles: true,
            composed: true,
            dataTransfer,
          });
          input.dispatchEvent(dropEvent);
          if (input.parentElement) {
            input.parentElement.dispatchEvent(dropEvent);
          }
          const dropContainer = input.closest('div[class*="drop"], div[class*="upload"], label');
          if (dropContainer) {
            dropContainer.dispatchEvent(dropEvent);
          }
        } catch {}
      }

      // Also trigger on closest label
      const label = input.closest("label") || (input.id ? document.querySelector(`label[for="${input.id}"]`) : null);
      if (label) {
        label.dispatchEvent(new Event("change", { bubbles: true }));
      }

      input.dispatchEvent(new Event("blur", { bubbles: true }));

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
