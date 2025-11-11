import { AuthService } from "../service/auth.service.js";
import { ProblemsService } from "../service/problems.service.js";

export default (req, res, next) => {
  req.services = {
    auth: AuthService,
    problems: ProblemsService,
  };
  next();
};
