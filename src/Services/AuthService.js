// src/Services/authService.js — تأكد من وجود الدوال

import { supabase } from "../lib/supabase";

export async function loginRequest({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function registerRequest({
  email,
  password,
  firstName,
  lastName,
  username,
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        username,
      },
    },
  });
  if (error) throw new Error(error.message);

  // ✅ ملاحظة: data.session = null لو Confirm email مفعّل
  return data;
}

export async function logoutRequest() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  return true;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
