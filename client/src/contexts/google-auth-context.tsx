import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface GoogleAuthContextType {
  isReady: boolean;
  clientId: string | null;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  isReady: false,
  clientId: null,
});

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/google-client-id")
      .then(res => res.json())
      .then(data => {
        setClientId(data.clientId || null);
        setIsReady(true);
      })
      .catch(() => {
        setClientId(null);
        setIsReady(true);
      });
  }, []);

  return (
    <GoogleAuthContext.Provider value={{ isReady, clientId }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}
