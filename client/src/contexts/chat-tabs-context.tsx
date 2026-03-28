import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Message } from '@/lib/types';

const STORAGE_KEY = 'nexus_local_chat_tabs';

export interface TabMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isSending?: boolean;
}

export interface ChatTab {
  id: string;
  name: string;
  messages: TabMessage[];
  createdAt: number;
}

interface ChatTabsContextType {
  tabs: ChatTab[];
  activeTabIndex: number;
  activeTab: ChatTab | null;
  switchDirection: number;
  goToOlder: () => void;
  goToNewer: () => void;
  createNewTab: () => void;
  addUserMessage: (content: string) => void;
  canGoOlder: boolean;
  tabMessages: Message[];
}

function makeTab(name: string): ChatTab {
  return {
    id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    messages: [],
    createdAt: Date.now(),
  };
}

const ChatTabsContext = createContext<ChatTabsContextType | undefined>(undefined);

export function ChatTabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<ChatTab[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [makeTab('Chat 1')];
  });

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [switchDirection, setSwitchDirection] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch (e) {}
  }, [tabs]);

  const canGoOlder = activeTabIndex > 0;

  const goToOlder = useCallback(() => {
    if (activeTabIndex > 0) {
      setSwitchDirection(1);
      setActiveTabIndex(prev => prev - 1);
    }
  }, [activeTabIndex]);

  const goToNewer = useCallback(() => {
    setSwitchDirection(-1);
    setTabs(prevTabs => {
      if (activeTabIndex >= prevTabs.length - 1) {
        return [...prevTabs, makeTab(`Chat ${prevTabs.length + 1}`)];
      }
      return prevTabs;
    });
    setActiveTabIndex(prev => prev + 1);
  }, [activeTabIndex]);

  const createNewTab = useCallback(() => {
    setSwitchDirection(-1);
    const newIndex = tabs.length;
    setTabs(prev => [...prev, makeTab(`Chat ${prev.length + 1}`)]);
    setActiveTabIndex(newIndex);
  }, [tabs.length]);

  const addUserMessage = useCallback((content: string) => {
    const now = Date.now();
    const userMsg: TabMessage = {
      id: `msg_${now}`,
      role: 'user',
      content,
      timestamp: now,
    };
    const sendingMsg: TabMessage = {
      id: `sending_${now + 1}`,
      role: 'assistant',
      content: '',
      timestamp: now + 1,
      isSending: true,
    };
    setTabs(prev => prev.map((tab, i) =>
      i === activeTabIndex
        ? { ...tab, messages: [...tab.messages, userMsg, sendingMsg] }
        : tab
    ));
  }, [activeTabIndex]);

  const activeTab = tabs[activeTabIndex] ?? null;

  const tabMessages: Message[] = (activeTab?.messages ?? []).map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
    isSending: m.isSending,
  }));

  return (
    <ChatTabsContext.Provider value={{
      tabs,
      activeTabIndex,
      activeTab,
      switchDirection,
      goToOlder,
      goToNewer,
      createNewTab,
      addUserMessage,
      canGoOlder,
      tabMessages,
    }}>
      {children}
    </ChatTabsContext.Provider>
  );
}

export function useChatTabs() {
  const context = useContext(ChatTabsContext);
  if (!context) throw new Error('useChatTabs must be used within ChatTabsProvider');
  return context;
}
