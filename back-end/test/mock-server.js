// 1. Set Mock Env Vars
process.env.JWT_SECRET = "test_secret";
process.env.PORT = "3000";

// 2. Import App and Service
import app from "../src/app.js";
import { UserService } from "../src/service/user.service.js";
import jwt from "jsonwebtoken";
import config from "../src/config/env.config.js";

// Force overwrite config for mock server
config.jwtSecret = "test_secret";

// 3. Mock Service Method
UserService.getUserStats = async (userId) => {
  console.log(`[Mock] getUserStats called for ${userId}`);
  return {
    profile: {
      nickname: userId,
      avatarImage: "/images/level/3.png", // Mocking Level 3 Image
      bio: "열심히 배우는 중이에요 📚", // Mocking 'learn' purpose
      level: 3,
      exp: 1234,
      preferLanguage: "JavaScript",
      totalSolved: 10,
      rank: "Unranked",
    },
    stats: {
      streak: 0,
      todaySolved: 2,
      thisWeekSolved: 5,
      mostUsedLanguage: "JavaScript",
    },
    badges: [],
    levelDistribution: { 1: 2, 2: 3, 3: 5 },
    languageDistribution: { JavaScript: 8, Python: 2 },
    heatmap: [
      { date: "2023-11-27", count: 2 },
      { date: "2023-11-26", count: 3 },
    ],
  };
};

// 4. Start Server
const port = 3000;
app.listen(port, () => {
  console.log(`\n🚀 Mock Server running at http://localhost:${port}`);

  // Generate a valid token for the mock secret
  const token = jwt.sign({ user_id: "test_user" }, "test_secret");

  console.log("\n🔑 Use this token for Postman:");
  console.log(`Cookie: token=${token}`);
  console.log(
    "\n(Add this to the 'Headers' tab in Postman: Key='Cookie', Value='token=...')\n",
  );
});
