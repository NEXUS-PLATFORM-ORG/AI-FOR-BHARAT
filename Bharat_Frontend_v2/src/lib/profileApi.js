import { API_PROFILE as API_BASE } from "./apiConfig.js";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

const CACHE_KEY = "cached_profile";

// Cache helpers
export function getCachedProfile() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedProfile(profile) {
  if (profile) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
  }
}

export function clearCachedProfile() {
  localStorage.removeItem(CACHE_KEY);
}

// GET profile
export async function fetchProfile() {
  const cached = getCachedProfile();
  if (cached) return cached;

  const res = await fetch(API_BASE, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to fetch profile");
  }

  const data = await res.json();
  setCachedProfile(data.profile);
  return data.profile;
}

// Force fetch (bypass cache)
export async function fetchProfileFresh() {
  const res = await fetch(API_BASE, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (res.status === 404) {
    clearCachedProfile();
    return null;
  }
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to fetch profile");
  }

  const data = await res.json();
  setCachedProfile(data.profile);
  return data.profile;
}

// CREATE profile
export async function createProfile(profileData) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to create profile");
  }

  const data = await res.json();
  setCachedProfile(data.profile);
  return data.profile;
}

// UPDATE profile
export async function updateProfile(profileData) {
  const res = await fetch(API_BASE, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to update profile");
  }

  const data = await res.json();
  setCachedProfile(data.profile);
  return data.profile;
}

// DELETE profile
export async function deleteProfile() {
  const res = await fetch(API_BASE, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to delete profile");
  }

  clearCachedProfile();
  const data = await res.json();
  return data.profile;
}
