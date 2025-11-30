import { AuthService } from "../service/auth.service.js";
import { ProblemsService } from "../service/problems.service.js";
import { TokenizerService } from "../service/code.tokenizer.service.js";
import { UserService } from "../service/user.service.js";
import { OpenAIService } from "../service/openai.service.js";
import { UserCodeService } from "../service/userCode.service.js";

export default (req, res, next) => {
  req.services = {
    auth: AuthService,
    problems: ProblemsService,
    tokenizer: TokenizerService,
    user: UserService,
    openai: OpenAIService,
    userCode: UserCodeService,
  };
  next();
};
