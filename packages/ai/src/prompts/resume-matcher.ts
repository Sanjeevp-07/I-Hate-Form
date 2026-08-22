export function buildResumeMatcherPrompt(params: {
  jobDescriptionSummary: string;
  resumes: Array<{ id: string; filename: string; tags: string[]; summarySnippet?: string }>;
}): { system: string; user: string } {
  const system = `You are a resume matching assistant for internship applications.
Analyze the target job description summary against candidate resume tags and profile summaries to select the single best matching resume version.`;

  const user = `<job_description_summary>
${params.jobDescriptionSummary}
</job_description_summary>

<candidate_resumes>
${JSON.stringify(params.resumes, null, 2)}
</candidate_resumes>

Select the best resume ID, match score (0-1), and short explanation adhering to the JSON schema.`;

  return { system, user };
}
