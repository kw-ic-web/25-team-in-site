import { AuthService } from "../service/auth.service.js";
import { ProblemsService } from "../service/problems.service.js";
import { UserService } from "../service/user.service.js";
import { CodeService } from "../service/code.service.js";

export default (req, res, next) => {
  req.services = {
    auth: AuthService,
    problems: ProblemsService,
    user: UserService,
    code: CodeService,
  };
  next();
};
