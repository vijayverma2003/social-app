"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserWithProfile } from "@shared/types";
import { getCurrentUser } from "@/services/usersService";

interface UserContextType {
  user: UserWithProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  refetch: async () => {},
});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserContextProvider: React.FC<UserProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn, getToken, isLoaded } = useAuth();

  const fetchUser = async () => {
    if (!isSignedIn || !isLoaded) {
      setUser(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await getCurrentUser(token);
      setUser(response.data);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch current user"
      );
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    fetchUser();
  }, [isSignedIn, isLoaded]);

  return (
    <UserContext.Provider
      value={{ user, isLoading, error, refetch: fetchUser }}
    >
      {children}
    </UserContext.Provider>
  );
};
