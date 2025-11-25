import { AuthService } from "../service/auth.service.js";
import { ProblemsService } from "../service/problems.service.js";
import { TokenizerService } from "../service/code.tokenizer.service.js";

export default (req, res, next) => {
  req.services = {
    auth: AuthService,
    problems: ProblemsService,
    tokenizer: TokenizerService,
  };
  next();
};
