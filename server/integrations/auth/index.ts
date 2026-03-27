export { setupAuth, isAuthenticated, getSession, hashPassword, comparePasswords } from "./authCore";
export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";
