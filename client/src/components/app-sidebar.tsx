import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  ChevronDown, 
  Search, 
  Pin, 
  PinOff, 
  Trash2, 
  Brain, 
  Sparkles, 
  Zap, 
  GitBranch, 
  Clock, 
  X,
  Menu,
  Settings,
  User,
  HelpCircle,
  Info,
  Cpu,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/contexts/conversation-context";
import { useMode } from "@/contexts/mode-context";
import { ThinkingMode as Mode } from "@/lib/types";
import { useLanguage } from "@/contexts/language-context";
import { useLocation } from "wouter";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { 
    conversations, 
    currentConversationId, 
    selectConversation, 
    startNewConversation,
    deleteConversation,
    isLoading
  } = useConversation();
  const { currentMode, setMode } = useMode();
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [chatsExpanded, setChatsExpanded] = useState(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModeChange = (mode: Mode) => {
    setMode(mode);
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    if (onClose) onClose();
  };

  const modes: { id: Mode; labelKey: string; icon: any }[] = [
    { id: "NORMAL" as Mode, labelKey: "mode.DEFAULT.label", icon: Sparkles },
    { id: "WHAT_IF" as Mode, labelKey: "mode.WHAT_IF.label", icon: Zap },
    { id: "CHAIN_REACTION" as Mode, labelKey: "mode.CHAIN_REACTION.label", icon: GitBranch },
    { id: "PARALLEL_TIMELINES" as Mode, labelKey: "mode.PARALLEL_TIMELINES.label", icon: Clock },
  ];

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide pb-20">
        {/* About Section - Collapsible */}
        <div className="px-3 mb-6">
          <button
            onClick={() => setAboutExpanded(!aboutExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-900 dark:text-white mb-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="text-sm font-bold">About</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200",
              aboutExpanded && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {aboutExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mx-1 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-4">
                  {/* Conversation Info */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-blue-500">Conversation Info</h4>
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium">Conversation Name</span>
                        <span className="text-xs text-slate-700 dark:text-slate-200 truncate">{currentConversation?.title || "N/A"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium">Conversation ID</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{currentConversationId || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-medium">Created By</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300">You</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-medium">Shared With</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300">None</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-medium">Status</span>
                          <span className="text-xs text-green-500 font-medium">Active</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-medium">Priority</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300">Normal</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium">Conversation Topic</span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 truncate">General AI Assistance</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium">Tags / Labels</span>
                        <div className="flex gap-1 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-[9px] text-blue-600 dark:text-blue-400">AI</span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-[9px] text-purple-600 dark:text-purple-400">Chat</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Information */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-purple-500">AI Information</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium">AI Model</span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">Nexus AI</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium">Model Version</span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">2.1.0</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium">Customization ID</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">NX-9982</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-medium">Response Time</span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">~1.2s</span>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Statistics</h4>
                    <div className="grid grid-cols-1 gap-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">AI Response</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{(conversations.find(c => c.id === currentConversationId) as any)?.messageCount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Your Message</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{(conversations.find(c => c.id === currentConversationId) as any)?.messageCount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Image Generate</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">0</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Video Generate</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">0</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Photo Upload</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">0</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Video Upload</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">0</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/50">
                        <span className="text-slate-400 font-bold">Total Element</span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">{(conversations.find(c => c.id === currentConversationId) as any)?.messageCount * 2 || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Your Chats - Collapsible */}
        <div className="px-3 mb-6">
          <button
            onClick={() => setChatsExpanded(!chatsExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-900 dark:text-white mb-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-bold">{t("sidebar.yourChats")}</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200",
              chatsExpanded && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {chatsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-1"
              >
                {/* Search in sidebar */}
                <div className="px-2 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Chats"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* All Chats */}
                {isLoading ? (
                  <div className="space-y-2 px-2 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                    No conversations yet
                  </p>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-2 px-4 py-3 rounded-xl transition-all cursor-pointer mb-1",
                        currentConversationId === conversation.id
                          ? "bg-slate-100 dark:bg-slate-800 shadow-sm"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <button
                        onClick={() => {
                          selectConversation(conversation.id);
                          handleNavigation("/");
                        }}
                        className="flex-1 text-left truncate text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        {conversation.title}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteConversation(conversation.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reasoning Engine */}
        <div className="px-3 mb-6">
          <button
            onClick={() => setReasoningExpanded(!reasoningExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-900 dark:text-white mb-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="text-sm font-bold">{t("sidebar.reasoningEngine")}</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200",
              reasoningExpanded && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {reasoningExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-1"
              >
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = currentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeChange(mode.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                        isActive 
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-[1.02]" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1 text-left">
                        <span className="text-sm font-bold block">{t(mode.labelKey)}</span>
                        <span className={cn(
                          "text-[10px] font-medium opacity-70",
                          isActive ? "text-slate-300 dark:text-slate-600" : "text-slate-500"
                        )}>
                          {t(`mode.${mode.id}.desc`)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings & Account */}
        <div className="px-3 mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/50">
          <div className="space-y-1">
            <button
              onClick={() => {
                if (onClose) onClose();
                window.dispatchEvent(new CustomEvent('nexus-open-settings'));
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                location === "/settings"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-bold">Settings</span>
            </button>
            <button
              onClick={() => {
                if (onClose) onClose();
                window.dispatchEvent(new CustomEvent('nexus-open-account'));
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                location === "/account"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
              )}
            >
              <User className="h-4 w-4" />
              <span className="text-sm font-bold">Account</span>
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('nexus-trigger-tutorial'));
                if (onClose) onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm font-bold">Tutorial</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
