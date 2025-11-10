import { AuthService } from "../service/authService.js";

export default (req, res, next) => {
  req.services = {
    auth: AuthService,
  };
  next();
};
