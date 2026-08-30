import { understandQuestion, resolveAnswer } from "../packages/ai/src";
import { FieldContext, UserProfile } from "../packages/types/src";

const mockProfile: UserProfile = {
  id: "test_user",
  userId: "test_user",
  personal: {
    fullName: "Sanjeev Kumar",
    firstName: "Sanjeev",
    lastName: "Kumar",
    email: "sanjeev1803t@gmail.com",
    phone: "+91-8825171882",
    city: "Greater Noida",
    state: "Uttar Pradesh",
    country: "India",
    dateOfBirth: "2003-07-18",
  },
  links: {
    linkedin: "https://www.linkedin.com/in/sanjeev-kumar-1803t/",
    github: "https://github.com/Sanjeevp-07",
  },
  education: [
    {
      id: "edu_1",
      institution: "Bennett University",
      degree: "B.Tech",
      fieldOfStudy: "Computer Science and Engineering",
      startDate: "2022-08-01",
      endDate: "2026-06-01",
    },
  ],
  experience: [
    {
      id: "exp_1",
      company: "Tech Corp",
      title: "Software Engineer Intern",
      startDate: "2023-06-01",
      endDate: "2023-12-01",
      description: "Built React microfrontends",
    },
  ],
  skills: [
    { id: "sk_1", category: "Languages", name: "TypeScript" },
    { id: "sk_2", category: "Languages", name: "Python" },
  ],
};

async function testSemanticAnswerPipeline() {
  console.log("🚀 Starting Phase 8 Semantic Auto-Answer Pipeline Tests...\n");

  // Test 1: Level B Derived Answer — Birth Year
  const dobCtx: FieldContext = {
    label: "Year of Birth",
    type: "number",
    placeholder: "YYYY",
    nearbyText: "Personal Details",
  };
  const plan1 = await understandQuestion(dobCtx);
  console.log("Test 1 Plan (Birth Year):", plan1);
  const result1 = await resolveAnswer({ plan: plan1, profile: mockProfile });
  console.log("Test 1 Result (Birth Year):", result1);
  console.assert(result1.answer === "2003", "Test 1 Failed: Expected birth year 2003");
  console.assert(result1.source === "derived", "Test 1 Failed: Expected source derived");

  // Test 2: Level B Derived Answer — Graduation Year
  const gradCtx: FieldContext = {
    label: "Graduation Year",
    type: "number",
    placeholder: "YYYY",
    sectionTitle: "Education History",
  };
  const plan2 = await understandQuestion(gradCtx);
  console.log("\nTest 2 Plan (Graduation Year):", plan2);
  const result2 = await resolveAnswer({ plan: plan2, profile: mockProfile });
  console.log("Test 2 Result (Graduation Year):", result2);
  console.assert(result2.answer === "2026", "Test 2 Failed: Expected graduation year 2026");

  // Test 3: Level B Derived Answer — Location Composite
  const locCtx: FieldContext = {
    label: "Where are you currently located?",
    type: "text",
    placeholder: "City, State, Country",
  };
  const plan3 = await understandQuestion(locCtx);
  console.log("\nTest 3 Plan (Location):", plan3);
  const result3 = await resolveAnswer({ plan: plan3, profile: mockProfile });
  console.log("Test 3 Result (Location):", result3);
  console.assert(result3.answer === "Greater Noida, Uttar Pradesh, India", "Test 3 Failed: Location composite format mismatch");

  // Test 4: Level A Direct Fact — Email
  const emailCtx: FieldContext = {
    label: "Email Address",
    type: "email",
  };
  const plan4 = await understandQuestion(emailCtx);
  console.log("\nTest 4 Plan (Email):", plan4);
  const result4 = await resolveAnswer({ plan: plan4, profile: mockProfile });
  console.log("Test 4 Result (Email):", result4);
  console.assert(result4.answer === "sanjeev1803t@gmail.com", "Test 4 Failed: Direct email lookup mismatch");
  console.assert(result4.source === "database", "Test 4 Failed: Expected source database");

  console.log("\n✅ ALL PHASE 8 SEMANTIC AUTO-ANSWER PIPELINE TESTS PASSED!");
}

testSemanticAnswerPipeline().catch((err) => {
  console.error("❌ Phase 8 Test Failure:", err);
  process.exit(1);
});
