import { User } from "../entity/user.js";

export const UserRepository = {
  async create({ user_id, user_pw, user_email }) {
    const user = await User.create({ user_id, user_pw, user_email });
    return user;
  },
  async findOne(filter, { includePassword = false } = {}) {
    const query = User.findOne(filter);
    if (!includePassword) {
      query.select("-user_pw");
    }
    return query.exec();
  },
};
