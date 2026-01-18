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
      className="h-10 w-10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
    >
      <div className="flex flex-col gap-1 items-center justify-center">
        <span className="w-5 h-0.5 bg-current rounded-full transition-all group-hover:w-6" />
        <span className="w-5 h-0.5 bg-current rounded-full transition-all" />
        <span className="w-5 h-0.5 bg-current rounded-full transition-all group-hover:w-4" />
      </div>
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
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden border-r border-slate-200/50 dark:border-slate-800/50">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto pt-20 pb-4 scrollbar-hide">
        {/* Your Chats - Collapsible */}
        <div className="px-3 mb-4">
          <button
            onClick={() => setChatsExpanded(!chatsExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
              chatsExpanded 
                ? "bg-white dark:bg-slate-800 shadow-md text-blue-600 dark:text-blue-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                chatsExpanded ? "bg-blue-100 dark:bg-blue-900/30" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700"
              )}>
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="text-sm font-black tracking-tight uppercase">{t("sidebar.yourChats")}</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300 opacity-50",
              chatsExpanded && "rotate-180 opacity-100"
            )} />
          </button>

          <AnimatePresence>
            {chatsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mt-2 space-y-1 px-1"
              >
                {/* Search in sidebar */}
                <div className="px-1 mb-3">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search Chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* All Chats */}
                {isLoading ? (
                  <div className="space-y-2 px-1 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 w-full bg-white dark:bg-slate-800 rounded-xl" />
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <p className="px-4 py-3 text-[11px] text-slate-400 italic text-center bg-white/50 dark:bg-slate-800/30 rounded-xl">
                    No conversations yet
                  </p>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all cursor-pointer border border-transparent",
                        currentConversationId === conversation.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50 shadow-sm"
                          : "hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-sm"
                      )}
                    >
                      <button
                        onClick={() => {
                          selectConversation(conversation.id);
                          handleNavigation("/");
                        }}
                        className={cn(
                          "flex-1 text-left truncate text-xs font-semibold transition-colors",
                          currentConversationId === conversation.id
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                        )}
                      >
                        {conversation.title}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conversation.id); }} 
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all shrink-0"
                      >
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
        <div className="px-3 mb-4">
          <button
            onClick={() => setReasoningExpanded(!reasoningExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
              reasoningExpanded 
                ? "bg-white dark:bg-slate-800 shadow-md text-purple-600 dark:text-purple-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                reasoningExpanded ? "bg-purple-100 dark:bg-purple-900/30" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700"
              )}>
                <Brain className="h-4 w-4" />
              </div>
              <span className="text-sm font-black tracking-tight uppercase">{t("sidebar.reasoningEngine")}</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300 opacity-50",
              reasoningExpanded && "rotate-180 opacity-100"
            )} />
          </button>

          <AnimatePresence>
            {reasoningExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mt-2 space-y-1.5 px-1"
              >
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = currentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeChange(mode.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border",
                        isActive 
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-[1.02] border-transparent" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg shrink-0",
                        isActive ? "bg-white/10 dark:bg-black/10" : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="text-xs font-bold block truncate">{t(mode.labelKey)}</span>
                        <span className={cn(
                          "text-[9px] font-medium opacity-70 block truncate",
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
      </div>

      {/* Footer Section - About, Settings, Account */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-900/30">
        <div className="space-y-1">
          {/* About Section - Collapsible in Footer */}
          <button
            onClick={() => setAboutExpanded(!aboutExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300",
              aboutExpanded 
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm" 
                : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50"
            )}
          >
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wide">About</span>
            </div>
            <ChevronDown className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              aboutExpanded && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {aboutExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="p-3 mt-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Version</span>
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">2.1.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Engine</span>
                    <span className="text-[10px] font-bold text-blue-500">Apsa AI</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-1 mt-2">
            <button
              onClick={() => {
                if (onClose) onClose();
                window.dispatchEvent(new CustomEvent('nexus-open-settings'));
              }}
              className="flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/50 dark:border-slate-700/50 transition-all shadow-sm hover:shadow-md"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase">Settings</span>
            </button>
            <button
              onClick={() => {
                if (onClose) onClose();
                window.dispatchEvent(new CustomEvent('nexus-open-account'));
              }}
              className="flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200/50 dark:border-slate-700/50 transition-all shadow-sm hover:shadow-md"
            >
              <User className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase">Account</span>
            </button>
          </div>
          
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nexus-trigger-tutorial'));
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mt-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 transition-all shadow-lg hover:opacity-90 active:scale-95"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-black uppercase tracking-widest">Tutorial</span>
          </button>
        </div>
      </div>
    </div>
  );
}
