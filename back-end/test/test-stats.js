import connectDB from "../src/infrastructure/mongoConnection.infra.js";
import { UserService } from "../src/service/user.service.js";
import { User } from "../src/entity/user.entity.js";
import { Solved } from "../src/entity/solved.entity.js";
import { Problem } from "../src/entity/problem.entity.js";
import mongoose from "mongoose";

async function runTest() {
  let user, problem;

  try {
    await connectDB();
    console.log("DB Connected");

    // 1. Create Test User
    const userId = "test_user_" + Date.now();
    user = await User.create({
      user_id: userId,
      user_pw: "password123",
      user_email: `${userId}@example.com`,
      user_level: 3,
      prefer_language: "JavaScript",
      purpose: "learn",
    });
    console.log("User Created:", user.user_id);

    // 2. Create Test Problem
    problem = await Problem.create({
      problem_difficulty: 2,
      problem_lang: ["JavaScript"],
      problem_main_category: "Algorithm",
      problem_sub_category: "Sorting",
    });
    console.log("Problem Created:", problem._id);

    // 3. Create Solved Record
    await Solved.create({
      user_id: user._id,
      problem_id: problem._id,
      language: "JavaScript",
      solved_code: "console.log('hello')",
    });
    console.log("Solved Record Created");

    // 4. Call Service
    const stats = await UserService.getUserStats(userId);

    console.log("\n✅ API Response:");
    console.log(JSON.stringify(stats, null, 2));

    console.log("\n✨ Verification Points:");
    console.log(`1. Bio: ${stats.profile.bio}`);
    console.log(`2. Avatar: ${stats.profile.avatarImage}`);
    console.log(`3. Language: ${stats.profile.preferLanguage}`);

    // 5. Verification
    if (stats.profile.nickname !== userId) throw new Error("Nickname mismatch");
    if (stats.profile.avatarImage !== "/images/level/3.png")
      throw new Error("Avatar mismatch");
    if (stats.profile.totalSolved !== 1)
      throw new Error("Total solved mismatch");
    if (stats.stats.mostUsedLanguage !== "JavaScript")
      throw new Error("Language mismatch");
    if (stats.levelDistribution["2"] !== 1)
      throw new Error("Level distribution mismatch");

    console.log("\n✅ Test Passed!");
  } catch (error) {
    console.error("❌ Test Failed:", error);
  } finally {
    if (user?._id) {
      await User.deleteOne({ _id: user._id });
      await Solved.deleteMany({ user_id: user._id });
    }
    if (problem?._id) {
      await Problem.deleteOne({ _id: problem._id });
    }

    await mongoose.disconnect();
  }
}

runTest();
