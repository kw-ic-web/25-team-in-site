import { DEFAULT_PROMPT, VALIDATED_PROMPT } from "../src/constants/openai.constants.js";
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
    console.log("🚀 Starting Prompt Verification...\n");

    // Case 1: Syntax Error
    const syntaxErrorContext = `
[Problem]
Print "Hello World" 5 times using a loop.

[User Code]
for (let i = 0; i < 5 i++) {
    console.log("Hello World");
}

[Cursor]
Line 1: for (let i = 0; i < 5 i++) {

[Logs/Diffs]
SyntaxError: Unexpected identifier
`;
    await runTestCase("Syntax Error (Missing semicolon)", syntaxErrorContext);

    // Case 2: Logic Error
    const logicErrorContext = `
[Problem]
Calculate the N-th Fibonacci number.
Input: Integer N
Output: N-th Fibonacci number

[User Code]
function fib(n) {
  if (n === 1) return 1;
  return fib(n-1) + fib(n-2);
}

[Cursor]
Line 3: return fib(n-1) + fib(n-2);

[Logs/Diffs]
Stack overflow for large N.
`;
    await runTestCase("Logic Error (Infinite Recursion / Missing Base Case)", logicErrorContext);

    // Case 3: Empty Code
    const emptyCodeContext = `
[Problem]
Write a function to check if a string is a palindrome.

[User Code]
(Empty)

[Cursor]
Line 1

[Logs/Diffs]
No logs.
`;
    await runTestCase("Empty Code (Approach Guidance)", emptyCodeContext);

    // Case 4: Validation Test (Code Leakage Prevention)
    console.log(`\n🧪 Testing Case: Validation Test (Code Leakage Prevention)`);
    const leakedHint = "Here is the answer: `function add(a, b) { return a + b; }`. Use this code.";
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
