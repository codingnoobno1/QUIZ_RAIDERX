// src/utils/auth.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client setup using environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

// Function to sign up a user in Supabase
const signUpUser = async (email, password) => {
  try {
    // Register the user in Supabase
    const { user, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    // Handle errors if the user couldn't be created
    if (error) {
      console.error('Sign up error:', error.message);
      return null;
    }

    console.log('User signed up successfully:', user);
    return user;
  } catch (error) {
    console.error('Error during sign up:', error);
    return null;
  }
};

// Export the sign-up function
export { signUpUser };
