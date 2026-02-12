"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

interface ChannelViewContextValue {
  /** When set, load messages around this message and scroll to it */
  aroundMessageId: string | null;
}

const ChannelViewContext = createContext<ChannelViewContextValue | null>(null);

interface ChannelViewProviderProps {
  aroundMessageId?: string | null;
  children: ReactNode;
}

export function ChannelViewProvider({
  aroundMessageId = null,
  children,
}: ChannelViewProviderProps) {
  const value = useMemo<ChannelViewContextValue>(
    () => ({ aroundMessageId: aroundMessageId ?? null }),
    [aroundMessageId],
  );

  return (
    <ChannelViewContext.Provider value={value}>
      {children}
    </ChannelViewContext.Provider>
  );
}

export function useChannelView(): ChannelViewContextValue | null {
  return useContext(ChannelViewContext);
}
