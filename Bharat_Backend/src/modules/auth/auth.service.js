import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin as supabase } from '../../config/supabaseclient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'a-default-secret-for-dev-only';

const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const signupUser = async ({ name, email, password }) => {
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (findError && findError.code !== 'PGRST116') { // PGRST116 = 'Not a single row was returned'
    throw new Error(findError.message);
  }

  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([{ name, email, password_hash }])
    .select('id, name, email, role')
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  const token = generateToken(newUser);
  return { user: newUser, token };
};

export const loginUser = async ({ email, password }) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, password_hash')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error('Invalid credentials or user not found.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials or user not found.');
  }

  // Omit password_hash from the returned user object
  const { password_hash, ...userWithoutPassword } = user;

  const token = generateToken(userWithoutPassword);
  return { user: userWithoutPassword, token };
};

export const googleLoginUser = async ({ email, name }) => {
  let { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  if (!user) {
    // Create new user for Google login
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, role: 'reviewer' }]) // Default role
      .select('id, name, email, role')
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }
    user = newUser;
  }

  const token = generateToken(user);
  return { user, token };
};
