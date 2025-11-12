import { AuthService } from "../service/auth.service.js";

export default (req, res, next) => {
  req.services = {
    auth: AuthService,
  };
  next();
};
