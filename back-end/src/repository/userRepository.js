import { User } from "../entity/user.js";

export const UserRepository = {
  async create(id, pw, email) {
    const user = await User.create(id, pw, email);
    return user.toObject();
  },
  async findOne(filter) {
    FriendModel.findOne(filter).lean().exec();
  },
};
