import { sessionService } from "../src/service/session.service.js";
import {
  CreateSessionRequestDto,
  UpdateSessionRequestDto,
} from "../src/dto/session/session.dto.js";

async function runTest() {
  console.log("Starting Session Store Test...");

  console.log("\n[1] Creating Session...");
  const createDto = CreateSessionRequestDto.parse({
    userId: "user-123",
    data: { problemId: "1001", language: "javascript" },
  });
  const createdSession = await sessionService.createSession(createDto);
  console.log("Created Session:", createdSession);

  if (createdSession.userId !== "user-123") throw new Error("User ID mismatch");

  console.log("\n[2] Getting Session...");
  const fetchedSession = await sessionService.getSession("user-123");
  console.log("Fetched Session:", fetchedSession);

  if (!fetchedSession) throw new Error("Session not found");

  console.log("\n[3] Updating Session...");
  const updateDto = UpdateSessionRequestDto.parse({
    data: {
      language: "python",
    },
  });
  const updatedSession = await sessionService.updateSessionData(
    "user-123",
    updateDto,
  );
  console.log("Updated Session:", updatedSession);

  if (updatedSession.data.language !== "python")
    throw new Error("Update failed");
  if (updatedSession.data.problemId !== "1001")
    throw new Error("Data lost during update");

  console.log("\n[4] Overwriting Session...");
  const newSessionDto = CreateSessionRequestDto.parse({
    userId: "user-123",
    data: { problemId: "9999", language: "go" },
  });
  const overwrittenSession = await sessionService.createSession(newSessionDto);
  console.log("Overwritten Session:", overwrittenSession);

  if (overwrittenSession.data.problemId !== "9999")
    throw new Error("Overwrite failed");

  console.log("\n[5] Deleting Session...");
  await sessionService.deleteSession("user-123");
  const deletedSession = await sessionService.getSession("user-123");
  console.log("Deleted Session (should be null):", deletedSession);

  if (deletedSession !== null) throw new Error("Delete failed");

  console.log("\nALL TESTS PASSED!");
}

runTest().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
