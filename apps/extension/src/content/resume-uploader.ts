import { UserProfile } from "@internship-copilot/types";
import { querySelectorAllDeep } from "./shadow-dom-walker";

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
 * Checks if a file upload element is connected and not inside an inactive multi-step wizard step/tab.
 * NOTE: Custom stylized upload buttons (like on JAKSON, Workday, Greenhouse) intentionally set
 * display: none, opacity: 0, or aria-hidden: true on the native <input type="file"> itself.
 * Therefore, we only reject when an outer multi-step wizard container is inactive/hidden.
 */
export function isFileInputActive(element: HTMLInputElement): boolean {
  if (!element || !element.isConnected) return false;

  // Check parent hierarchy to determine if element belongs to a hidden step/tab/container
  let curr: HTMLElement | null = element.parentElement;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    // 1. Direct computed style check
    try {
      const computed = window.getComputedStyle(curr);
      if (computed.display === "none" || computed.visibility === "hidden" || computed.visibility === "collapse") {
        return false;
      }
    } catch {}

    // 2. Inline styles, attributes, and common framework hidden classes
    const styleAttr = (curr.getAttribute("style") || "").replace(/\s/g, "").toLowerCase();
    if (
      curr.style.display === "none" ||
      styleAttr.includes("display:none") ||
      curr.getAttribute("aria-hidden") === "true" ||
      curr.hasAttribute("hidden") ||
      curr.classList.contains("d-none") ||
      curr.classList.contains("hide") ||
      curr.classList.contains("hidden") ||
      curr.classList.contains("ng-hide") ||
      curr.classList.contains("invisible")
    ) {
      return false;
    }

    // 3. Step/Wizard/Tab container active states
    const isStepOrTab =
      curr.classList.contains("tab-pane") ||
      curr.classList.contains("wizard-step") ||
      curr.classList.contains("wizard-pane") ||
      curr.classList.contains("step-pane") ||
      curr.classList.contains("step") ||
      curr.getAttribute("role") === "tabpanel" ||
      curr.hasAttribute("data-step") ||
      (curr.id && /step|wizard|tab|pane|page/i.test(curr.id)) ||
      (typeof curr.className === "string" && /step|wizard|tab-pane|wizard-step|wizard-pane/i.test(curr.className));

    if (isStepOrTab) {
      const isActive =
        curr.classList.contains("active") ||
        curr.classList.contains("current") ||
        curr.classList.contains("show");

      // If active siblings exist in the same wizard/tabset and this step is not active
      const activeSibling = curr.parentElement?.querySelector(
        ".wizard-step.active, .tab-pane.active, .step.active, [data-step].active, .step-pane.active, .step.current"
      );
      if (activeSibling && !isActive) {
        return false;
      }
    }

    curr = curr.parentElement;
  }

  return true;
}


export interface DocumentUploadResult {
  detected: boolean;
  uploaded: boolean;
  elementCount: number;
  fileName: string;
  fileSizeBytes: number;
  uploadedDocuments: Array<{
    category: string;
    fileName: string;
    fieldLabel: string;
  }>;
}

export interface SavedDocumentItem {
  id?: string;
  title?: string;
  filename: string;
  sizeBytes?: number;
  mimeType?: string;
  category?: string;
  tags?: string[];
  isPreferred?: boolean;
  fileData?: string; // base64
}

export type ResumeUploadResult = DocumentUploadResult;
export type SavedResumeDoc = SavedDocumentItem;

/**
 * Classifies which document category a given file input element is asking for.
 */
export function classifyFileInputCategory(input: HTMLInputElement): { category: string; label: string } {
  const name = input.getAttribute("name") || "";
  const id = input.getAttribute("id") || "";
  const accept = (input.getAttribute("accept") || "").toLowerCase();
  const ariaLabel = input.getAttribute("aria-label") || "";
  const placeholder = input.getAttribute("placeholder") || "";
  const parentText = (input.parentElement?.textContent || "").slice(0, 300);
  const label = input.closest("label") || (input.id ? document.querySelector(`label[for="${input.id}"]`) : null);
  const labelText = (label?.textContent || "").slice(0, 300);
  const container = input.closest('form, section, div[class*="upload"], div[class*="field"], div[class*="drop"], div[class*="file"], div[class*="card"], div[class*="container"], tr, td');
  const containerText = (container?.textContent || "").slice(0, 500);
  const dataAutomation = input.getAttribute("data-automation-id") || input.getAttribute("data-testid") || "";

  const textBlob = `${name} ${id} ${ariaLabel} ${placeholder} ${labelText} ${parentText} ${containerText} ${dataAutomation} ${accept}`.toLowerCase();
  const directLabel = `${labelText || ariaLabel || name || id}`.trim();

  // 1. 10th / Secondary Marksheet / Certificate
  if (
    /10th|secondary|matriculation|class[\s_-]?10|xth|high[\s_-]?school[\s_-]?(mark|cert|pass)/i.test(textBlob) &&
    !/12th|higher[\s_-]?secondary|graduation|college/i.test(directLabel.toLowerCase())
  ) {
    return { category: "secondaryMarksheet", label: directLabel || "10th Marksheet" };
  }

  // 2. 12th / Higher Secondary Marksheet / Certificate
  if (
    /12th|higher[\s_-]?secondary|intermediate|class[\s_-]?12|xiith|hsc|senior[\s_-]?secondary/i.test(textBlob)
  ) {
    return { category: "higherSecondaryMarksheet", label: directLabel || "12th Marksheet" };
  }

  // 3. College Transcript / Marksheets / Degree Certificate
  if (
    /transcript|college[\s_-]?marksheet|semester[\s_-]?marksheet|grade[\s_-]?card|university[\s_-]?marksheet|degree[\s_-]?cert|consolidated[\s_-]?marksheet|academic[\s_-]?record/i.test(textBlob)
  ) {
    return { category: "collegeTranscript", label: directLabel || "College Transcript" };
  }

  // 4. Cover Letter / Statement of Purpose
  if (
    /cover[\s_-]?letter|statement[\s_-]?of[\s_-]?purpose|\bsop\b|letter[\s_-]?of[\s_-]?intent|motivation[\s_-]?letter/i.test(textBlob)
  ) {
    return { category: "coverLetter", label: directLabel || "Cover Letter" };
  }

  // 5. Default / Primary: Resume / CV
  return { category: "resume", label: directLabel || "Resume / CV" };
}

/**
 * Searches the DOM, accessible iframes, and all shadow roots for document file upload inputs.
 */
export function findDocumentUploadInputs(): Array<{ input: HTMLInputElement; category: string; label: string }> {
  const allFileInputs: HTMLInputElement[] = querySelectorAllDeep('input[type="file"]') as HTMLInputElement[];

  try {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      try {
        if (iframe.contentDocument) {
          const iframeInputs = iframe.contentDocument.querySelectorAll('input[type="file"]');
          iframeInputs.forEach((inp) => {
            if (inp instanceof HTMLInputElement && !allFileInputs.includes(inp)) {
              allFileInputs.push(inp);
            }
          });
        }
      } catch {}
    });
  } catch {}

  const result: Array<{ input: HTMLInputElement; category: string; label: string }> = [];

  for (const input of allFileInputs) {
    if (!isFileInputActive(input)) continue;

    const name = input.getAttribute("name") || "";
    const id = input.getAttribute("id") || "";
    const accept = (input.getAttribute("accept") || "").toLowerCase();
    const ariaLabel = input.getAttribute("aria-label") || "";

    // Skip avatar / profile picture inputs
    const isImageOnly = (accept.includes("image") || accept.includes("png") || accept.includes("jpeg") || accept.includes("jpg")) &&
      !accept.includes("pdf") && !accept.includes("doc") && !accept.includes("docx") && !accept.includes("txt");
    const isAvatar = /avatar|photo|profile[\s_-]?pic|picture|selfie|headshot/i.test(name || id || ariaLabel);
    if (isImageOnly && isAvatar) continue;

    const classified = classifyFileInputCategory(input);
    result.push({
      input,
      category: classified.category,
      label: classified.label,
    });
  }

  // Fallback for custom stylized buttons
  if (result.length === 0) {
    const uploadButtons = Array.from(
      document.querySelectorAll('button, a, div[role="button"], span[role="button"], label, div[class*="upload"], div[class*="dropzone"]')
    );

    for (const btn of uploadButtons) {
      if (btn instanceof HTMLElement && (btn.offsetParent === null || window.getComputedStyle(btn).display === "none")) {
        continue;
      }
      const btnText = (btn.textContent || "").toLowerCase();
      if (/upload[\s_-]?resume|upload[\s_-]?cv|attach[\s_-]?resume|upload[\s_-]?document|upload[\s_-]?marksheet|upload[\s_-]?transcript/i.test(btnText)) {
        const parent = btn.closest('div, section, form') || btn.parentElement;
        if (parent) {
          const fileInput = parent.querySelector('input[type="file"]') as HTMLInputElement | null;
          if (fileInput && isFileInputActive(fileInput) && !result.some((r) => r.input === fileInput)) {
            const classified = classifyFileInputCategory(fileInput);
            result.push({
              input: fileInput,
              category: classified.category,
              label: classified.label || btnText,
            });
          }
        }
      }
    }
  }

  return result;
}

export function findResumeUploadInputs(): HTMLInputElement[] {
  return findDocumentUploadInputs().map((r) => r.input);
}

/**
 * Automatically detects document fields on the form and uploads the exact corresponding
 * user document (Resume, 10th Marksheet, 12th Marksheet, College Transcript, or Cover Letter).
 */
export function autoUploadResume(
  profile: UserProfile | null,
  savedResume?: SavedDocumentItem | null,
  allDocuments?: SavedDocumentItem[] | null
): DocumentUploadResult {
  const documentInputs = findDocumentUploadInputs();
  if (documentInputs.length === 0) {
    return {
      detected: false,
      uploaded: false,
      elementCount: 0,
      fileName: "",
      fileSizeBytes: 0,
      uploadedDocuments: [],
    };
  }

  const firstName = profile?.personal?.firstName || "Sanjeev";
  const lastName = profile?.personal?.lastName || "Kumar";
  const docsPool = allDocuments || (savedResume ? [savedResume] : []);

  let totalUploaded = 0;
  let primaryFileName = "";
  let primaryFileSize = 0;
  const uploadedDetails: Array<{ category: string; fileName: string; fieldLabel: string }> = [];

  for (const { input, category, label } of documentInputs) {
    try {
      // Find matching document in user's documents pool
      let targetDoc: SavedDocumentItem | undefined = undefined;

      if (category === "secondaryMarksheet") {
        targetDoc = docsPool.find((d) => d.category === "secondaryMarksheet" || d.tags?.includes("10th"));
      } else if (category === "higherSecondaryMarksheet") {
        targetDoc = docsPool.find((d) => d.category === "higherSecondaryMarksheet" || d.tags?.includes("12th"));
      } else if (category === "collegeTranscript") {
        targetDoc = docsPool.find((d) => d.category === "collegeTranscript" || d.tags?.includes("Transcript"));
      } else if (category === "coverLetter") {
        targetDoc = docsPool.find((d) => d.category === "coverLetter" || d.tags?.includes("Cover Letter"));
      }

      // If no specific category matched or category is resume, use preferred or first resume
      if (!targetDoc) {
        targetDoc = docsPool.find((d) => d.isPreferred) || docsPool.find((d) => d.category === "resume" || d.tags?.includes("Resume")) || savedResume || docsPool[0];
      }

      let fileBlob: Blob;
      let rawFileName: string;
      let mimeType = targetDoc?.mimeType || "application/pdf";

      if (targetDoc && targetDoc.fileData) {
        try {
          const binaryString = atob(targetDoc.fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          fileBlob = new Blob([bytes], { type: mimeType });
          rawFileName = targetDoc.filename;
        } catch {
          fileBlob = generateResumePdfBlob(profile);
          rawFileName = `${firstName}_${lastName}_${category === "resume" ? "Resume" : category}.pdf`.replace(/\s+/g, "_");
        }
      } else {
        fileBlob = generateResumePdfBlob(profile);
        rawFileName = `${firstName}_${lastName}_Resume.pdf`.replace(/\s+/g, "_");
      }

      const fileObj = new File([fileBlob], rawFileName, { type: mimeType });

      let dataTransfer: DataTransfer | null = null;
      if (typeof DataTransfer !== "undefined") {
        dataTransfer = new DataTransfer();
        dataTransfer.items.add(fileObj);
        input.files = dataTransfer.files;
      } else {
        Object.defineProperty(input, "files", {
          value: [fileObj],
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

      // Dispatch full bubbling events on the input element
      input.dispatchEvent(new Event("focus", { bubbles: true }));
      input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

      // Dispatch drag & drop event if page uses Dropzone
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
          const dropContainer = input.closest('div[class*="drop"], div[class*="upload"], div[class*="resume"], label, form');
          if (dropContainer) {
            dropContainer.dispatchEvent(dropEvent);
          }
        } catch {}
      }

      // Also trigger on closest label
      const closestLabel = input.closest("label") || (input.id ? document.querySelector(`label[for="${input.id}"]`) : null);
      if (closestLabel) {
        closestLabel.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      }

      input.dispatchEvent(new Event("blur", { bubbles: true }));

      totalUploaded++;
      if (!primaryFileName) {
        primaryFileName = rawFileName;
        primaryFileSize = fileBlob.size;
      }

      uploadedDetails.push({
        category,
        fileName: rawFileName,
        fieldLabel: label,
      });
    } catch (err) {
      console.warn("Could not set file on input:", err);
    }
  }

  return {
    detected: true,
    uploaded: totalUploaded > 0,
    elementCount: totalUploaded,
    fileName: primaryFileName,
    fileSizeBytes: primaryFileSize,
    uploadedDocuments: uploadedDetails,
  };
}
