export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
  },
  USER: {
    PROFILE: "/api/user/profile",
    UPDATE: "/api/user/update",
    DELETE: "/api/user/delete",
  },
  DATA: {
    LIST: "/api/data",
    CREATE: "/api/data/create",
    UPDATE: "/api/data/update",
    DELETE: "/api/data/delete",
  },
} as const

export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
} as const

export const UI_CONSTANTS = {
  BREAKPOINTS: {
    SM: "640px",
    MD: "768px",
    LG: "1024px",
    XL: "1280px",
    "2XL": "1536px",
  },
  COLORS: {
    PRIMARY: "blue",
    SECONDARY: "gray",
    SUCCESS: "green",
    WARNING: "yellow",
    ERROR: "red",
  },
  ANIMATION: {
    DURATION: {
      FAST: "150ms",
      NORMAL: "300ms",
      SLOW: "500ms",
    },
    EASING: {
      EASE_IN: "cubic-bezier(0.4, 0, 1, 1)",
      EASE_OUT: "cubic-bezier(0, 0, 0.2, 1)",
      EASE_IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
} as const
