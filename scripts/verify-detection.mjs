// Test script to verify counterfactual detection, validation, and ambiguity handling
import { validateTimelineDetectionResult } from "../src/lib/validation.ts";
import { detectTimeline } from "../src/lib/counterfactualGenerator.ts";

async function runTests() {
  console.log("=== RUNNING TVA ATDS SYSTEM VERIFICATION ===");

  // 1. Test Ambiguity Detection
  console.log("\n[TEST 1] Testing Ambiguous Query Handling ('WAR')...");
  const ambigRes = await detectTimeline("WAR");
  if (!ambigRes.isAmbiguous || !ambigRes.ambiguitySuggestions?.length) {
    console.error("FAIL: Ambiguity was not properly flagged for 'WAR':", ambigRes);
    process.exit(1);
  }
  console.log("PASS: Ambiguity caught successfully with suggestions:", ambigRes.ambiguitySuggestions);

  // 2. Test Detection and Generation for Arbitrary Query ('TITANIC')
  console.log("\n[TEST 2] Testing Counterfactual Generation for Query ('TITANIC')...");
  const titanicRes = await detectTimeline("TITANIC");
  if (!titanicRes.success || !titanicRes.data) {
    console.error("FAIL: Could not detect timeline for Titanic:", titanicRes);
    process.exit(1);
  }
  const titanicVal = validateTimelineDetectionResult(titanicRes.data);
  if (!titanicVal.isValid) {
    console.error("FAIL: Generated Titanic result failed validation:", titanicVal.errors);
    process.exit(1);
  }
  console.log("PASS: Titanic counterfactual generated and strictly validated!");
  console.log("  Query:", titanicRes.data.query);
  console.log("  Baseline events count:", titanicRes.data.baseline.events.length);
  console.log("  Alternatives count:", titanicRes.data.alternatives.length);
  titanicRes.data.alternatives.forEach((b, i) => {
    console.log(`  Branch 0${i + 1} (${b.position}): ${b.title} [POD: ${b.pointOfDivergence.dateStr}]`);
  });

  // 3. Test Detection for Historical Query ('APOLLO 11')
  console.log("\n[TEST 3] Testing Counterfactual Generation for Query ('APOLLO 11')...");
  const apolloRes = await detectTimeline("APOLLO 11");
  if (!apolloRes.success || !apolloRes.data) {
    console.error("FAIL: Could not detect timeline for Apollo 11:", apolloRes);
    process.exit(1);
  }
  const apolloVal = validateTimelineDetectionResult(apolloRes.data);
  if (!apolloVal.isValid) {
    console.error("FAIL: Generated Apollo 11 result failed validation:", apolloVal.errors);
    process.exit(1);
  }
  console.log("PASS: Apollo 11 counterfactual generated and strictly validated!");
  console.log("  Query:", apolloRes.data.query);
  console.log("  Baseline summary:", apolloRes.data.baseline.summary);
  console.log("  Alternatives count:", apolloRes.data.alternatives.length);

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
