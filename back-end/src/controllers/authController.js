export const AuthController = {
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      const user = await req.services.user.register({
        username,
        email,
        password,
      });
      res.status(201).json(user);
    } catch (e) {
      next(e);
    }
  },
};
