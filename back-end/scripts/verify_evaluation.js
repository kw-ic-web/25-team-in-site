import { EvaluationService } from "../src/service/evaluation.service.js";
import { ProblemRepository } from "../src/repository/problem.repository.js";

// Mock ProblemRepository
ProblemRepository.findProblemById = async (id) => {
  if (id === "test-problem-hello") {
    return {
      problem_id: "test-problem-hello",
      problem_evaluate_cases: [":::Hello"],
    };
  }
  if (id === "test-problem-add") {
    return {
      problem_id: "test-problem-add",
      problem_evaluate_cases: ["1 2:::3", "5 5:::10"],
    };
  }
  return null;
};

async function runVerification() {
  console.log("Starting Verification...");

  // Test 0: Hello World (No Input)
  console.log("\n[Test 0] Hello World (No Input)");
  const helloCode = `console.log("Hello");`;
  try {
    const result0 = await EvaluationService.evaluateCode({
      userId: "user1",
      problemId: "test-problem-hello",
      code: helloCode,
      language: "js",
    });
    console.log("Result 0:", JSON.stringify(result0, null, 2));
    if (result0.passed) console.log("✅ Test 0 Passed");
    console.log("Result 0:", JSON.stringify(result0, null, 2));
    if (result0.passed) console.log("✅ Test 0 Passed");
    else console.error("❌ Test 0 Failed");
  } catch (e) {
    console.error("❌ Test 0 Error:", e);
  }

  // Test 1: Addition (With Input)
  const addCode = `
    const fs = require('fs');
    const input = fs.readFileSync(0).toString().trim().split(' ');
    const a = parseInt(input[0]);
    const b = parseInt(input[1]);
    console.log(a + b);
    `;
  try {
    const result1 = await EvaluationService.evaluateCode({
      userId: "user1",
      problemId: "test-problem-add",
      code: addCode,
      language: "js",
    });
    console.log("Result 1:", JSON.stringify(result1, null, 2));
    if (result1.passed) console.log("✅ Test 1 Passed");
    else console.error("❌ Test 1 Failed");
  } catch (e) {
    console.error("❌ Test 1 Error:", e);
  }

  // Test 2: Infinite Loop
  console.log("\n[Test 2] Infinite Loop");
  const loopCode = `while(true){}`;
  try {
    const result2 = await EvaluationService.evaluateCode({
      userId: "user1",
      problemId: "test-problem-add",
      code: loopCode,
      language: "js",
    });
    console.log("Result 2:", JSON.stringify(result2, null, 2));
    if (!result2.passed && result2.results[0].error)
      console.log("✅ Test 2 Passed (Correctly timed out)");
    else console.error("❌ Test 2 Failed (Should have timed out)");
  } catch (e) {
    console.error("❌ Test 2 Error:", e);
  }
}

runVerification();
