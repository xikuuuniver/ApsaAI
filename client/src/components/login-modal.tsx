import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const DISPLAY_NAMES = [
  "CosmicFox", "NeonPanda", "StarlightOwl", "CrystalWolf", "PixelDragon",
  "ShadowLynx", "ElectricEagle", "MysticBear", "TurboTiger", "GlitchRaven",
  "AuroraHawk", "CyberCat", "NovaBison", "QuantumFalcon", "VortexOtter",
  "FrozenBadger", "LaserLlama", "ThunderSloth", "NebulaCrab", "PlasmaGoose",
];

function generateBetaCredentials() {
  const name = DISPLAY_NAMES[Math.floor(Math.random() * DISPLAY_NAMES.length)];
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const uniqueEmail = `${name.toLowerCase()}_${suffix}@beta.nexus`;
  const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return { name, uniqueEmail, password };
}

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCreateOne = () => {
    setError(
      "Something may have gone wrong at this moment. Please try again logging in with Google, Apple, or other."
    );
  };

  const handleSocialLogin = async (provider: "google" | "apple" | "facebook") => {
    setError("");
    setIsLoading(true);
    try {
      const { name, uniqueEmail, password } = generateBetaCredentials();

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: uniqueEmail, password, firstName: name, lastName: "" }),
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        queryClient.setQueryData(["/api/auth/user"], userData);
        onClose();
        return;
      }

      const errData = await response.json().catch(() => ({}));
      setError(errData.message || "Login failed. Please try again.");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Invalid credentials. Please try again.");
        return;
      }
      queryClient.setQueryData(["/api/auth/user"], data);
      onClose();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="login-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            key="login-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-7"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-1">
              Login
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 leading-snug">
              Hey, Enter your details to get sign in<br />to your account
            </p>

            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Email / Phone No"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition"
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Having trouble in sign in?
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-500 dark:text-red-400 text-center leading-snug">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Or Sign in with</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("apple")}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.83.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.36 2.75M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple ID
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("facebook")}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={handleCreateOne}
                className="font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                create one
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
