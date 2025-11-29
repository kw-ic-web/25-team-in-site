import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AuthService } from "../../../src/service/auth.service.js";
import { UserRepository } from "../../../src/repository/user.repository.js";
import { RegisterRequestDto } from "../../../src/dto/auth/register.request.dto.js";
import { LoginRequestDto } from "../../../src/dto/auth/login.request.dto.js";

const registerPayload = {
  user_id: "jester",
  email: "jester@example.com",
  password: "Password123!",
  language: "js",
  level: 3,
  purpose: "learn",
};

const buildRegisterDto = (overrides = {}) =>
  RegisterRequestDto.parse({ ...registerPayload, ...overrides });

describe("AuthService.register", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("새로운 사용자를 생성하고 토큰을 반환한다", async () => {
    const dto = buildRegisterDto();
    jest.spyOn(AuthService, "isIdAvailable").mockResolvedValue(true);
    jest.spyOn(AuthService, "isEmailAvailable").mockResolvedValue(true);
    jest.spyOn(UserRepository, "create").mockResolvedValue({
      user_id: dto.user_id,
      user_email: dto.email.toLowerCase(),
    });
    jest.spyOn(AuthService, "_generateToken").mockResolvedValue("token-123");

    const result = await AuthService.register(dto);

    expect(UserRepository.create).toHaveBeenCalledWith({
      user_id: dto.user_id,
      user_pw: dto.password,
      user_email: dto.email.toLowerCase(),
      prefer_language: dto.language,
      purpose: dto.purpose,
      metalevel: dto.level,
    });
    expect(result).toEqual({
      user_id: dto.user_id,
      email: dto.email.toLowerCase(),
      token: "token-123",
    });
  });

  it("아이디가 중복되면 예외를 던진다", async () => {
    jest.spyOn(AuthService, "isIdAvailable").mockResolvedValue(false);
    jest.spyOn(AuthService, "isEmailAvailable").mockResolvedValue(true);

    await expect(AuthService.register(buildRegisterDto())).rejects.toThrow(
      "이미 등록된 아이디입니다.",
    );
  });

  it("이메일이 중복되면 예외를 던진다", async () => {
    jest.spyOn(AuthService, "isIdAvailable").mockResolvedValue(true);
    jest.spyOn(AuthService, "isEmailAvailable").mockResolvedValue(false);

    await expect(AuthService.register(buildRegisterDto())).rejects.toThrow(
      "이미 등록된 이메일입니다.",
    );
  });

  it("UserRepository.create 실패 시 일반 에러를 전파한다", async () => {
    jest.spyOn(AuthService, "isIdAvailable").mockResolvedValue(true);
    jest.spyOn(AuthService, "isEmailAvailable").mockResolvedValue(true);
    const dbError = new Error("Database connection failed");
    jest.spyOn(UserRepository, "create").mockRejectedValue(dbError);

    const dto = buildRegisterDto();

    await expect(AuthService.register(dto)).rejects.toThrow(
      "Database connection failed",
    );
  });

  it("MongoDB duplicate key error (code 11000) 시 CONFLICT_RACE 에러를 던진다", async () => {
    jest.spyOn(AuthService, "isIdAvailable").mockResolvedValue(true);
    jest.spyOn(AuthService, "isEmailAvailable").mockResolvedValue(true);
    const mongoError = new Error("Duplicate key");
    mongoError.code = 11000;
    jest.spyOn(UserRepository, "create").mockRejectedValue(mongoError);

    const dto = buildRegisterDto();

    await expect(AuthService.register(dto)).rejects.toThrow(
      "아이디/이메일이 이미 존재합니다.",
    );
  });

  it("_generateToken이 실패하면 에러를 전파한다", async () => {
    jest.spyOn(AuthService, "isIdAvailable").mockResolvedValue(true);
    jest.spyOn(AuthService, "isEmailAvailable").mockResolvedValue(true);
    jest.spyOn(UserRepository, "create").mockResolvedValue({
      user_id: "tester",
      user_email: "tester@example.com",
    });
    const tokenError = new Error("JWT signing failed");
    jest.spyOn(AuthService, "_generateToken").mockRejectedValue(tokenError);

    const dto = buildRegisterDto();

    await expect(AuthService.register(dto)).rejects.toThrow(
      "JWT signing failed",
    );
  });

  it("AuthResponseDto.parse가 실패하면 에러를 전파한다", async () => {
    jest.spyOn(AuthService, "isIdAvailable").mockResolvedValue(true);
    jest.spyOn(AuthService, "isEmailAvailable").mockResolvedValue(true);
    jest.spyOn(UserRepository, "create").mockResolvedValue({
      user_id: "tester",
      user_email: "tester@example.com",
    });
    jest.spyOn(AuthService, "_generateToken").mockResolvedValue(null);

    const dto = buildRegisterDto();

    await expect(AuthService.register(dto)).rejects.toThrow();
  });
});

describe("AuthService.login", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("이메일과 비밀번호가 올바르면 토큰을 반환한다", async () => {
    const mockUser = {
      user_id: "tester",
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
    jest.spyOn(AuthService, "_generateToken").mockResolvedValue("token-abc");

    const dto = LoginRequestDto.parse({
      email: "Tester@Example.com",
      password: "Password123!",
    });
    const result = await AuthService.login(dto);

    expect(UserRepository.findOne).toHaveBeenCalledWith(
      { user_email: "tester@example.com" },
      { includePassword: true },
    );
    expect(mockUser.comparePassword).toHaveBeenCalledWith("Password123!");
    expect(result).toEqual({
      user_id: "tester",
      email: "tester@example.com",
      token: "token-abc",
    });
  });

  it("이메일에 해당하는 사용자가 없으면 예외를 던진다", async () => {
    jest.spyOn(UserRepository, "findOne").mockResolvedValue(null);

    const dto = LoginRequestDto.parse({
      email: "Ghost@Example.com",
      password: "Password123!",
    });

    await expect(AuthService.login(dto)).rejects.toThrow(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );

    expect(UserRepository.findOne).toHaveBeenCalledWith(
      { user_email: "ghost@example.com" },
      { includePassword: true },
    );
  });

  it("비밀번호가 일치하지 않으면 예외를 던진다", async () => {
    const mockUser = {
      user_id: "tester",
      comparePassword: jest.fn().mockResolvedValue(false),
    };
    jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);

    const dto = LoginRequestDto.parse({
      email: "Tester@Example.com",
      password: "WrongPass123!",
    });

    await expect(AuthService.login(dto)).rejects.toThrow(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );

    expect(UserRepository.findOne).toHaveBeenCalledWith(
      { user_email: "tester@example.com" },
      { includePassword: true },
    );
  });

  it("_generateToken이 실패하면 에러를 전파한다", async () => {
    const mockUser = {
      user_id: "tester",
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
    const tokenError = new Error("JWT signing failed");
    jest.spyOn(AuthService, "_generateToken").mockRejectedValue(tokenError);

    const dto = LoginRequestDto.parse({
      email: "Tester@Example.com",
      password: "Password123!",
    });

    await expect(AuthService.login(dto)).rejects.toThrow(
      "JWT signing failed",
    );
  });

  it("AuthResponseDto.parse가 실패하면 에러를 전파한다", async () => {
    const mockUser = {
      user_id: "tester",
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
    jest.spyOn(AuthService, "_generateToken").mockResolvedValue(null);

    const dto = LoginRequestDto.parse({
      email: "Tester@Example.com",
      password: "Password123!",
    });

    await expect(AuthService.login(dto)).rejects.toThrow();
  });
});

describe("AuthService.isIdAvailable / isEmailAvailable", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("사용 가능한 아이디면 true를 반환한다", async () => {
    jest.spyOn(UserRepository, "findOne").mockResolvedValueOnce(null);

    await expect(AuthService.isIdAvailable("fresh_id")).resolves.toBe(true);
  });

  it("이미 존재하는 아이디면 false를 반환한다", async () => {
    jest.spyOn(UserRepository, "findOne").mockResolvedValueOnce({
      user_id: "duplicate",
    });

    await expect(AuthService.isIdAvailable("duplicate")).resolves.toBe(false);
  });

  it("사용 가능한 이메일이면 true를 반환한다", async () => {
    jest.spyOn(UserRepository, "findOne").mockResolvedValueOnce(null);

    await expect(
      AuthService.isEmailAvailable("new@example.com"),
    ).resolves.toBe(true);
  });

  it("이미 존재하는 이메일이면 false를 반환한다", async () => {
    jest.spyOn(UserRepository, "findOne").mockResolvedValueOnce({
      user_email: "dup@example.com",
    });

    await expect(
      AuthService.isEmailAvailable("dup@example.com"),
    ).resolves.toBe(false);
  });
});

