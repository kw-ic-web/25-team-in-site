import { DEFAULT_PROMPT, VALIDATED_PROMPT, EVALUATION_PROMPT } from "../src/constants/openai.constants.js";
import { openaiClient } from "../src/infrastructure/openaiClient.infra.js";

async function runTestCase(title, userContext) {
    console.log(`\n🧪 Testing Case: ${title}`);

    const messages = [
        { role: "system", content: DEFAULT_PROMPT },
        { role: "user", content: userContext }
    ];

    try {
        const completion = await openaiClient.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
        });

        console.log("🤖 AI Response:");
        console.log(completion.choices[0].message.content);
        console.log("-".repeat(50));
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function testPrompt() {
    console.log("🚀 Starting Prompt Verification (L0-L5)...\n");

    // Case L0: Checklist (New Problem)
    const l0Context = `
[Problem]
Find the longest substring without repeating characters.
[User Code]
(Empty)
[Logs/Diffs]
No logs.
`;
    await runTestCase("L0: Checklist (New Problem)", l0Context);

    // Case L1: Strategy (Big N)
    const l1Context = `
[Problem]
Find two numbers that add up to Target. N=100,000.
[User Code]
for(i=0..n) for(j=i+1..n) ...
[Logs/Diffs]
Time Limit Exceeded.
`;
    await runTestCase("L1: Strategy (Time Limit Exceeded)", l1Context);

    // Case L2: Procedure (Stuck on implementation)
    const l2Context = `
[Problem]
Implement LRU Cache.
[User Code]
Class LRUCache { ... }
[Logs/Diffs]
I know I need a HashMap and Doubly Linked List, but how do I connect them?
`;
    await runTestCase("L2: Procedure (Implementation Steps)", l2Context);

    // Case L3: Pseudocode (Logic Stuck)
    const l3Context = `
[Problem]
Merge Intervals.
[User Code]
intervals.sort();
for(i=0..n) { if(overlap) ... }
[Logs/Diffs]
I can't get the merge logic right. It keeps skipping intervals.
`;
    await runTestCase("L3: Pseudocode (Logic Help)", l3Context);

    // Case L4: Debugging (Failure)
    const l4Context = `
[Problem]
Valid Parentheses.
[User Code]
stack.push(c);
if(stack.pop() !== map[c]) return false;
[Logs/Diffs]
Input: "()[]{}" -> Output: true
Input: "(]" -> Output: false
Input: "([)]" -> Output: true (Expected: false)
`;
    await runTestCase("L4: Debugging (Wrong Answer)", l4Context);

    // Case L5: Refactoring (Working but messy)
    const l5Context = `
[Problem]
Reverse Linked List.
[User Code]
// It works but uses O(N) space with an array.
[Logs/Diffs]
All tests passed.
`;
    await runTestCase("L5: Refactoring (Optimization)", l5Context);

    // Case L5: Evaluation (New Prompt)
    console.log(`\n🧪 Testing Case: L5 Evaluation (Deficiency/Blocker/Improvement)`);
    const evaluationContext = `
[Problem]
Two Sum.
[User Code]
for(i=0; i<n; i++) {
  for(j=0; j<n; j++) {
    if(nums[i] + nums[j] == target) return [i, j];
  }
}
[Logs/Diffs]
It works but it's slow.
`;
    const evaluationMessages = [
        { role: "system", content: EVALUATION_PROMPT },
        { role: "user", content: evaluationContext }
    ];

    try {
        const completion = await openaiClient.chat.completions.create({
            model: "gpt-4o",
            messages: evaluationMessages,
        });

        console.log("🤖 AI Response (Evaluation):");
        console.log(completion.choices[0].message.content);
        console.log("-".repeat(50));
    } catch (error) {
        console.error("❌ Error:", error.message);
    }


    // Validation Test
    console.log(`\n🧪 Testing Case: Validation Test (Code Leakage Prevention)`);
    const leakedHint = "Here is the code: `function solve() { return 42; }`. Copy this.";
    const validationMessages = [
        { role: "system", content: VALIDATED_PROMPT },
        { role: "user", content: leakedHint }
    ];

    try {
        const completion = await openaiClient.chat.completions.create({
            model: "gpt-4o",
            messages: validationMessages,
        });

        console.log("🤖 AI Response (Sanitized Hint):");
        console.log(completion.choices[0].message.content);
        console.log("-".repeat(50));
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testPrompt();
