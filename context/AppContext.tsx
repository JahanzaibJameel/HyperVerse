import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  tokens: number;
  nfts: number;
}

export interface HealthData {
  steps: number;
  stepsGoal: number;
  calories: number;
  sleep: number;
  heartRate: number;
  workouts: number;
}

export interface FinanceData {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  budgetUsed: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AppContextValue {
  user: UserProfile;
  health: HealthData;
  finance: FinanceData;
  aiMessages: ChatMessage[];
  addXP: (amount: number) => void;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
}

const defaultUser: UserProfile = {
  name: "Neural Runner",
  level: 7,
  xp: 3240,
  xpToNextLevel: 5000,
  streak: 12,
  tokens: 2847,
  nfts: 6,
};

const defaultHealth: HealthData = {
  steps: 8432,
  stepsGoal: 10000,
  calories: 1840,
  sleep: 7.4,
  heartRate: 68,
  workouts: 3,
};

const defaultFinance: FinanceData = {
  balance: 24680,
  income: 8500,
  expenses: 3200,
  savings: 5300,
  investments: 12400,
  budgetUsed: 62,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [health] = useState<HealthData>(defaultHealth);
  const [finance] = useState<FinanceData>(defaultFinance);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome to HyperVerse AI. I have analyzed your biometrics, finances, and environment. Ready to optimize your reality?",
      timestamp: Date.now() - 60000,
    },
  ]);

  useEffect(() => {
    AsyncStorage.getItem("hv_user").then((data) => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  const addXP = (amount: number) => {
    setUser((prev) => {
      const newXP = prev.xp + amount;
      const newUser = { ...prev, xp: newXP };
      AsyncStorage.setItem("hv_user", JSON.stringify(newUser));
      return newUser;
    });
  };

  const addMessage = (msg: ChatMessage) => {
    setAiMessages((prev) => [...prev, msg]);
  };

  const clearMessages = () => {
    setAiMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Neural link re-established. How can I assist?",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <AppContext.Provider
      value={{ user, health, finance, aiMessages, addXP, addMessage, clearMessages }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
