import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Trash2, Search, X, Clock, ChevronUp } from "lucide-react";
import { useConversation } from "@/contexts/conversation-context";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

interface SwipeUpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SwipeUpPanel({ isOpen, onClose }: SwipeUpPanelProps) {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    startNewConversation,
    deleteConversation,
    isLoading,
  } = useConversation();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id: number) => {
    selectConversation(id);
    onClose();
  };

  const handleNewChat = async () => {
    await startNewConversation();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl overflow-hidden"
            style={{ maxHeight: "82vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              }
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0">
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Past Chats
                </h2>
                {conversations.length > 0 && (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {conversations.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleNewChat}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-2xl text-xs font-semibold transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Chat
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 text-slate-900 dark:text-slate-100 transition-all"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 min-h-0" style={{ overscrollBehavior: "contain" }}>
              {isLoading ? (
                <div className="space-y-2 mt-2 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
                    <MessageSquare className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {searchQuery ? "No chats found" : "No past chats yet"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? "Try a different search" : "Start a conversation to see it here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 mt-2">
                  {filtered.map((conv, i) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer border transition-all duration-200",
                        currentConversationId === conv.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-800/50"
                          : "bg-slate-50 dark:bg-slate-800/60 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200/60 dark:hover:border-slate-700/60 hover:shadow-sm"
                      )}
                      onClick={() => handleSelect(conv.id)}
                    >
                      <div className={cn(
                        "p-2 rounded-xl shrink-0",
                        currentConversationId === conv.id
                          ? "bg-blue-100 dark:bg-blue-900/40"
                          : "bg-white dark:bg-slate-700"
                      )}>
                        <MessageSquare className={cn(
                          "h-3.5 w-3.5",
                          currentConversationId === conv.id
                            ? "text-blue-500"
                            : "text-slate-400"
                        )} />
                      </div>
                      <span className={cn(
                        "flex-1 text-sm font-semibold truncate",
                        currentConversationId === conv.id
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-700 dark:text-slate-300"
                      )}>
                        {conv.title}
                      </span>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all shrink-0"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SwipeUpHint() {
  return (
    <motion.div
      className="flex flex-col items-center gap-1 select-none pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.5 }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronUp className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      </motion.div>
      <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600 uppercase tracking-widest">
        swipe up for history
      </span>
    </motion.div>
  );
}
