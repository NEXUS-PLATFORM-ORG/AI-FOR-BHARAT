import * as usersService from './users.service.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};
