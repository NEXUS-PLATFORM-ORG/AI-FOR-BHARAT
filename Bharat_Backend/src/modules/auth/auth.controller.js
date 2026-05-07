import * as authService from './auth.service.js';

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const { user, token } = await authService.signupUser({ name, email, password });
    res.status(201).json({ message: 'User created successfully', token, user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const { user, token } = await authService.loginUser({ email, password });
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required for Google Login' });
    }
    const { user, token } = await authService.googleLoginUser({ email, name });
    res.status(200).json({ message: 'Google Login successful', token, user });
  } catch (error) {
    next(error);
  }
};
