export const AuthController = {
  async register(req, res, next) {
    try {
      const { id, email, password } = req.body;
      const user = await req.services.auth.register(id, email, password);
      res.status(201).json(user);
    } catch (e) {
      next(e);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const jwt = await req.services.auth.login(email, password);
      res
        .cookie("token", jwt, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        })
        .status(200)
        .json({});
    } catch (e) {
      next(e);
    }
  },
};
