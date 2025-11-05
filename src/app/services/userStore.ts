const USERS_KEY = "app_users";
const CURRENT_USER_KEY = "current_user_id";

export type StoredUser = {
  id: string;
  password: string;
};

const DEFAULT_USERS: StoredUser[] = [
  {
    id: "demo",
    password: "demo1234",
  },
];

const isBrowser = () => typeof window !== "undefined";

const ensureDefaultUsers = () => {
  if (!isBrowser()) return DEFAULT_USERS;
  const existing = window.localStorage.getItem(USERS_KEY);
  if (!existing) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    const parsed = JSON.parse(existing) as StoredUser[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fall through to reset with defaults
  }
  window.localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
};

export const userStore = {
  loadUsers(): StoredUser[] {
    if (!isBrowser()) return DEFAULT_USERS;
    return ensureDefaultUsers();
  },

  saveUsers(users: StoredUser[]) {
    if (!isBrowser()) return;
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  loadCurrentUser(): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(CURRENT_USER_KEY);
  },

  saveCurrentUser(userId: string) {
    if (!isBrowser()) return;
    window.localStorage.setItem(CURRENT_USER_KEY, userId);
  },

  clearCurrentUser() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(CURRENT_USER_KEY);
  },
};

export const authDefaults = {
  USERS_KEY,
  CURRENT_USER_KEY,
  DEFAULT_USERS,
};

