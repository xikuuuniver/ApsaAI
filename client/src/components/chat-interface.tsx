import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "@/lib/types";
import { MessageBubble } from "./message-bubble";
import { 
  Plus, 
  ArrowUp, 
  Image, 
  FileText, 
  Video, 
  X, 
  Camera, 
  FolderOpen, 
  Globe, 
  Paperclip, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Languages, 
  ChevronDown, 
  Mic, 
  MicOff, 
  Download, 
  Printer, 
  Menu,
  Sparkles as SparklesIcon,
  Sun,
  Moon
} from "lucide-react";
import { Drawer } from "vaul";
import { useTheme as useThemeContext } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useMode } from "@/contexts/mode-context";
import { useLanguage, languageNames, Language } from "@/contexts/language-context";
import { useConversation } from "@/contexts/conversation-context";
import { HamburgerButton, AppSidebar } from "./app-sidebar";
import { ParticlesBackground } from "./particles-background";
import { useUpload } from "@/hooks/use-upload";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface Attachment {
  name: string;
  type: string;
  url?: string;
  uploading?: boolean;
}

import { OnboardingTutorial } from './tutorial/onboarding-tutorial';

export function ChatInterface() {
  const { 
    messages, 
    setMessages, 
    currentConversationId, 
    startNewConversation,
    loadConversations,
    updateConversationTitle
  } = useConversation();
  const [inputValue, setInputValue] = useState("");
  const { currentMode, setMode } = useMode();
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFirstMessageEver, setIsFirstMessageEver] = useState(true);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useThemeContext();
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setAttachments(prev => prev.map(att => 
        att.uploading ? { ...att, uploading: false, url: response.objectPath } : att
      ));
      toast({
        title: "File uploaded",
        description: "Your file is ready to send",
      });
    },
    onError: (error) => {
      setAttachments(prev => prev.filter(att => !att.uploading));
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const attachment: Attachment = {
        name: file.name,
        type: file.type,
        uploading: true,
      };
      setAttachments(prev => [...prev, attachment]);
      await uploadFile(file);
    }
    
    setShowAttachMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachClick = () => {
    setShowAttachMenu(!showAttachMenu);
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
    setShowAttachMenu(false);
  };

  const handlePhotoClick = () => {
    photoInputRef.current?.click();
    setShowAttachMenu(false);
  };

  const handleFilesClick = () => {
    fileInputRef.current?.click();
    setShowAttachMenu(false);
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled(!webSearchEnabled);
    setShowAttachMenu(false);
    toast({
      title: webSearchEnabled ? "Web Search Disabled" : "Web Search Enabled",
      description: webSearchEnabled ? "Nexus will use its knowledge" : "Nexus will search the internet for latest info",
    });
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'bn' ? 'bn-BD' : 
                       language === 'hi' ? 'hi-IN' : 
                       language === 'ur' ? 'ur-PK' : 
                       language === 'te' ? 'te-IN' : 
                       language === 'es' ? 'es-ES' : 
                       language === 'de' ? 'de-DE' : 
                       language === 'fr' ? 'fr-FR' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "🎤 Listening...",
        description: "Speak now, I'm listening!",
      });
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputValue(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Voice Input Error",
        description: event.error === 'no-speech' ? "No speech detected" : "Something went wrong",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  const handleSlidableMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isProcessing || !currentConversationId) return;
    if (attachments.some(a => a.uploading)) {
      toast({
        title: "Please wait",
        description: "Files are still uploading",
      });
      return;
    }
    
    // Debug: Log web search state
    console.log("Sending message with webSearchEnabled:", webSearchEnabled);

    let messageContent = inputValue;
    if (attachments.length > 0) {
      const attachmentInfo = attachments.map(a => `[Attached: ${a.name}]`).join('\n');
      messageContent = attachmentInfo + (inputValue ? '\n\n' + inputValue : '');
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsProcessing(true);
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: "",
      timestamp: new Date(),
      mode: currentMode,
      thinkingProcess: [],
      isThinking: true
    };
    
    setMessages(prev => [...prev, initialAiMsg]);

    // Prepare attachments with URLs for API
    const mediaAttachments = attachments
      .filter(a => a.url && (a.type.startsWith('image/') || a.type.startsWith('video/')))
      .map(a => ({ name: a.name, type: a.type, url: a.url! }));
    
    // Clear attachments before sending
    const currentAttachments = [...attachments];
    setAttachments([]);

    // Show search status if web search is enabled
    if (webSearchEnabled) {
      setSearchStatus("Searching the web...");
    }

    try {
      let fullResponse = "";
      
      const isFirstMessage = messages.length === 0;
      const titlePreview = messageContent.slice(0, 40) + (messageContent.length > 40 ? "..." : "");

      await api.sendMessage(
        currentConversationId,
        messageContent,
        currentMode,
        (chunk) => {
          if (typeof chunk === 'string') {
            fullResponse += chunk;
            setSearchStatus(null);
            setMessages(prev => prev.map(msg => 
              msg.id === aiMsgId 
                ? { ...msg, content: fullResponse }
                : msg
            ));
          } else if (chunk && (chunk as any).suggestions) {
            console.log("Received AI suggestions:", (chunk as any).suggestions);
            setFollowUpSuggestions((chunk as any).suggestions);
          }
        },
        () => {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId 
              ? { ...msg, isThinking: false }
              : msg
          ));
          setIsProcessing(false);
          setSearchStatus(null);
          
          // Trigger confetti on first message ever
          if (isFirstMessageEver) {
            triggerConfetti();
            setIsFirstMessageEver(false);
          }

          // Fallback to local suggestions if AI didn't provide any
          setFollowUpSuggestions(prev => {
            if (prev.length === 0) {
              return generateFollowUpSuggestions(fullResponse, messageContent);
            }
            return prev;
          });
          
          if (isFirstMessage && currentConversationId) {
            // Generate AI smart title for the conversation (fire and forget)
            api.generateSmartTitle(currentConversationId, messageContent)
              .then(({ title }) => {
                updateConversationTitle(currentConversationId, title);
              })
              .catch((error) => {
                console.error("Failed to generate smart title, using preview:", error);
                updateConversationTitle(currentConversationId, titlePreview);
              })
              .finally(() => {
                loadConversations();
              });
          }
        },
        mediaAttachments.length > 0 ? mediaAttachments : undefined,
        webSearchEnabled,
        (status) => setSearchStatus(status)
      );
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setMessages(prev => prev.filter(msg => msg.id !== aiMsgId));
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewSession = async () => {
    try {
      await startNewConversation();
      setAttachments([]);
      toast({
        title: "New session started",
        description: "Previous chat has been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new session",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  // Generate contextual follow-up suggestions based on AI response
  const generateFollowUpSuggestions = (aiResponse: string, userQuery: string): string[] => {
    const suggestions: string[] = [];
    
    // Keywords detection for context-aware suggestions
    const lowerResponse = aiResponse.toLowerCase();
    const lowerQuery = userQuery.toLowerCase();
    
    // Topic-based suggestions
    if (lowerResponse.includes('example') || lowerResponse.includes('instance')) {
      suggestions.push("Can you give me more examples?");
    }
    if (lowerResponse.includes('step') || lowerResponse.includes('first') || lowerResponse.includes('second')) {
      suggestions.push("Explain the next steps in more detail");
    }
    if (lowerResponse.includes('code') || lowerResponse.includes('function') || lowerResponse.includes('programming')) {
      suggestions.push("Can you show a code example?");
    }
    if (lowerResponse.includes('however') || lowerResponse.includes('but') || lowerResponse.includes('alternatively')) {
      suggestions.push("Tell me more about the alternatives");
    }
    if (lowerQuery.includes('how') || lowerQuery.includes('why')) {
      suggestions.push("Can you explain this in simpler terms?");
    }
    
    // Generic helpful suggestions
    if (suggestions.length === 0) {
      suggestions.push("Tell me more about this");
    }
    if (suggestions.length < 2) {
      suggestions.push("What are the benefits?");
    }
    if (suggestions.length < 3) {
      suggestions.push("Any important considerations?");
    }
    if (suggestions.length < 4) {
      suggestions.push("Tell me more about the technical details");
    }
    if (suggestions.length < 5) {
      suggestions.push("What are the potential drawbacks?");
    }
    
    return suggestions.slice(0, 5); // Return max 5 suggestions
  };

  const handleFollowUpClick = (suggestion: string) => {
    setInputValue(suggestion);
    setFollowUpSuggestions([]);
    textareaRef.current?.focus();
  };

  const handleDismissSuggestion = (suggestion: string) => {
    setFollowUpSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  // Export conversation as text file
  const exportAsText = () => {
    if (messages.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Start a conversation first",
        variant: "destructive",
      });
      return;
    }
    
    let content = "Nexus AI - Conversation Export\n";
    content += "=".repeat(40) + "\n\n";
    
    messages.forEach((msg, index) => {
      const sender = msg.role === 'user' ? 'You' : 'Nexus AI';
      content += `${sender}:\n${msg.content}\n\n`;
      if (index < messages.length - 1) {
        content += "-".repeat(30) + "\n\n";
      }
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported successfully",
      description: "Your conversation has been downloaded",
    });
  };

  // Print conversation (can save as PDF)
  const printConversation = () => {
    if (messages.length === 0) {
      toast({
        title: "Nothing to print",
        description: "Start a conversation first",
        variant: "destructive",
      });
      return;
    }
    window.print();
  };

  // Confetti celebration effect
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new session
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewSession();
      }
      // Ctrl/Cmd + / for help/shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        toast({
          title: "Keyboard Shortcuts",
          description: "Ctrl+N: New chat | Ctrl+/: Help | Enter: Send message",
        });
      }
      // Escape to close sidebar
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Starter prompts for empty state
  const starterPrompts = [
    { icon: "💡", text: "Explain quantum computing simply", category: "Learn" },
    { icon: "✍️", text: "Help me write a creative story", category: "Create" },
    { icon: "🔧", text: "Debug this code for me", category: "Code" },
    { icon: "🧠", text: "What if humans could fly?", category: "Think" },
  ];

  return (
    <div className="flex h-screen w-full flex-col bg-transparent relative">
      <ParticlesBackground />
      <OnboardingTutorial />

      <div 
        id="swipe-trigger"
        className="fixed bottom-0 left-0 right-0 h-1.5 z-[60] flex justify-center items-end pb-0 cursor-pointer touch-none md:hidden" 
        onPointerDown={(e) => {
          const startY = e.clientY;
          const handlePointerUp = (upEvent: PointerEvent) => {
            const endY = upEvent.clientY;
            if (startY - endY > 20) { // More sensitive threshold
              setSidebarOpen(true);
            }
            window.removeEventListener('pointerup', handlePointerUp);
          };
          window.addEventListener('pointerup', handlePointerUp);
        }}
        onClick={() => setSidebarOpen(true)}
      >
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-12 h-0.5 rounded-full bg-slate-300 dark:bg-slate-700" 
        />
      </div>
      
      <Drawer.Root open={sidebarOpen} onOpenChange={setSidebarOpen} direction="bottom">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[80vh] flex-col rounded-t-[2rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 shadow-2xl outline-none">
            <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="flex-1 overflow-y-auto p-4">
              <AppSidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Confetti Celebration */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[100]">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  left: `${Math.random() * 100}%`,
                  top: -20,
                  rotate: 0 
                }}
                animate={{ 
                  top: '100vh',
                  rotate: 720 
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  ease: "easeOut"
                }}
                style={{
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'][i % 6],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  width: `${6 + Math.random() * 8}px`,
                  height: `${6 + Math.random() * 8}px`,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
        data-testid="input-file"
      />
      
      {/* Header */}
      <div className="sticky top-0 z-[100] w-full flex justify-center pointer-events-none">
        <header 
          className="w-full h-14 md:h-16 flex items-center justify-between px-4 md:px-6 bg-white/20 dark:bg-slate-950/20 backdrop-blur-3xl transition-all duration-300 pointer-events-auto relative overflow-hidden"
          style={{ 
            maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)', 
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)' 
          }}
        >
          {/* Glassy reflection and subtle noise/texture */}
          <div className="absolute inset-0 bg-white/5 dark:bg-white/5 pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-white/30 dark:bg-white/10 pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-slate-800 dark:text-slate-100 hover:bg-white/20 dark:hover:bg-slate-800/20 rounded-full transition-all"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-3">
              <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">Settings</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative overflow-hidden group shrink-0"
            >
              <motion.div
                initial={false}
                animate={{ 
                  rotate: theme === "dark" ? 0 : theme === "neon" ? 180 : 90,
                  scale: theme === "dark" ? 1 : 0,
                  opacity: theme === "dark" ? 1 : 0
                }}
                className="absolute"
              >
                <Moon className="h-5 w-5" />
              </motion.div>
              <motion.div
                initial={false}
                animate={{ 
                  rotate: theme === "light" ? 0 : theme === "dark" ? -90 : -180,
                  scale: theme === "light" ? 1 : 0,
                  opacity: theme === "light" ? 1 : 0
                }}
                className="absolute"
              >
                <Sun className="h-5 w-5" />
              </motion.div>
              <motion.div
                initial={false}
                animate={{ 
                  rotate: theme === "neon" ? 0 : theme === "light" ? 180 : 90,
                  scale: theme === "neon" ? 1 : 0,
                  opacity: theme === "neon" ? 1 : 0
                }}
                className="absolute"
              >
                <SparklesIcon className="h-5 w-5 text-cyan-400" />
              </motion.div>
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-white">{t("app.title")}</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t("app.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
             {/* New Chat Button */}
             <Button
               id="new-chat-btn"
               variant="ghost"
               size="icon"
               onClick={handleNewSession}
               className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all button-animate"
               title="Start new chat"
             >
               <Plus className="h-5 w-5" />
             </Button>

             {/* Language Selector in Header */}
             <Popover open={languageMenuOpen} onOpenChange={setLanguageMenuOpen}>
               <PopoverTrigger asChild>
                 <button
                   id="language-selector"
                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all button-animate bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                   data-testid="button-language-selector"
                 >
                   <Languages className="h-3.5 w-3.5" />
                   <span className="hidden sm:inline">{languageNames[language]}</span>
                   <ChevronDown className="h-3 w-3 opacity-50" />
                 </button>
               </PopoverTrigger>
               <PopoverContent className="w-44 p-1" align="end">
                 <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1.5">
                   {t("language.select")}
                 </div>
                 {(Object.keys(languageNames) as Language[]).map((lang) => (
                   <button
                     key={lang}
                     onClick={() => { setLanguage(lang); setLanguageMenuOpen(false); }}
                     className={cn(
                       "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors button-animate",
                       language === lang 
                         ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                         : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                     )}
                     data-testid={`button-language-${lang}`}
                   >
                     {languageNames[lang]}
                     {language === lang && <span className="ml-auto text-blue-500">✓</span>}
                   </button>
                 ))}
               </PopoverContent>
             </Popover>

             {/* Auth Section */}
             {authLoading ? (
               <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
             ) : isAuthenticated && user ? (
               <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                 <PopoverTrigger asChild>
                   <button 
                     className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-blue-500/50 transition-all cursor-pointer"
                     data-testid="button-user-menu"
                   >
                     {user.profileImageUrl ? (
                       <img 
                         src={user.profileImageUrl} 
                         alt={user.firstName || "User"} 
                         className="h-full w-full object-cover"
                         data-testid="img-user-avatar"
                       />
                     ) : (
                       <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                         {user.firstName?.[0] || user.email?.[0] || "U"}
                       </div>
                     )}
                   </button>
                 </PopoverTrigger>
                 <PopoverContent className="w-56 p-2" align="end">
                   <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                     <p className="text-sm font-medium text-slate-900 dark:text-white">
                       {user.username || (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "User")}
                     </p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                   </div>
                   <button
                     onClick={() => { setUserMenuOpen(false); setLocation("/account"); }}
                     className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors button-animate"
                     data-testid="menu-account"
                   >
                     <UserIcon className="h-4 w-4" />
                     {t("menu.account")}
                   </button>
                   <button
                     onClick={() => { setUserMenuOpen(false); setLocation("/settings"); }}
                     className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors button-animate"
                     data-testid="menu-settings"
                   >
                     <Settings className="h-4 w-4" />
                     {t("menu.settings")}
                   </button>
                   <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
                     <button
                       onClick={() => window.location.href = "/api/logout"}
                       className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors button-animate"
                       data-testid="button-logout"
                     >
                       <LogOut className="h-4 w-4" />
                       {t("button.logout")}
                     </button>
                   </div>
                 </PopoverContent>
               </Popover>
             ) : (
               <button
                 id="login-btn"
                 onClick={() => window.location.href = "/auth"}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:shadow-lg transition-all button-animate"
                 data-testid="button-login"
               >
                 <LogIn className="h-3.5 w-3.5" />
                 <span>{t("button.login")}</span>
               </button>
             )}
          </div>
        </header>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative z-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto scroll-smooth pt-14 md:pt-16">
          <div className="mx-auto max-w-5xl w-full px-4 pt-4 pb-8 md:pb-12">
            {messages.length === 0 ? (
              <motion.div 
                className="flex flex-col items-center justify-center pt-10 pb-10 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <motion.div 
                  className="h-16 w-16 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl mb-6 flex items-center justify-center shadow-inner"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div 
                    className="h-8 w-8 bg-black dark:bg-white rounded-lg"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
                <motion.h2 
                  className="text-xl font-semibold text-slate-900 dark:text-white mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {t("empty.greeting")}
                </motion.h2>
                <motion.p 
                  className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {t("empty.disclaimer")}
                </motion.p>
                
                {/* Starter Prompts */}
                <motion.div 
                  className="grid grid-cols-2 gap-3 w-full max-w-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  {starterPrompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setInputValue(prompt.text);
                        textareaRef.current?.focus();
                      }}
                      className="group flex flex-col items-start gap-2 p-4 rounded-xl glass-card hover:shadow-float transition-all duration-300 text-left"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      data-testid={`starter-prompt-${index}`}
                    >
                      <span className="text-2xl">{prompt.icon}</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-2">{prompt.text}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">{prompt.category}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Input & Controls Area - Modern Slim Design */}
        <div className="w-full px-4 pb-12 z-20">
          <div className="mx-auto max-w-4xl space-y-4">
            {/* Follow-up Suggestions - Slidable Horizontal List */}
            <AnimatePresence>
              {followUpSuggestions.length > 0 && !isProcessing && (
                <div className="relative group max-w-full">
                  <motion.button
                    onClick={() => setFollowUpSuggestions([])}
                    className="absolute -top-8 right-2 h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all shadow-md z-30 group-hover:scale-110"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    title="Dismiss all suggestions"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>

                  <motion.div 
                    className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide no-scrollbar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {followUpSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        className="flex-shrink-0"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button
                          onClick={() => handleFollowUpClick(suggestion)}
                          className="px-4 py-2 text-xs font-medium bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all whitespace-nowrap shadow-sm"
                        >
                          {suggestion}
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="relative">
              {/* Attachments Preview */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div 
                    className="flex flex-wrap gap-2 mb-3 px-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {attachments.map((att, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-sm">
                        <div className="text-blue-500">{getFileIcon(att.type)}</div>
                        <span className="max-w-[100px] truncate font-medium">{att.name}</span>
                        <button onClick={() => removeAttachment(index)} className="text-slate-400 hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Slim Box */}
              <motion.div 
                className={cn(
                  "relative flex items-end gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 p-2 shadow-2xl transition-all duration-500",
                  "focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5"
                )}
              >
                <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full">
                      <Plus className={cn("h-5 w-5 transition-transform", showAttachMenu && "rotate-45")} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-56 p-2 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <div className="grid gap-1">
                      <Button variant="ghost" className="justify-start gap-3 rounded-xl h-10" onClick={handleFilesClick}>
                        <Paperclip className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Files</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 rounded-xl h-10" onClick={handleCameraClick}>
                        <Camera className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Camera</span>
                      </Button>
                      <Button variant="ghost" className={cn("justify-start gap-3 rounded-xl h-10", webSearchEnabled && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600")} onClick={toggleWebSearch}>
                        <Globe className={cn("h-4 w-4", webSearchEnabled ? "text-emerald-500" : "text-slate-400")} />
                        <span className="text-sm font-medium">Web Search</span>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

              <div id="chat-input" className="flex-1 flex items-center min-w-0 pb-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Nexus anything..."
                  className="w-full bg-transparent py-2.5 px-1 text-sm focus:outline-none min-h-[40px] max-h-[200px] leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none overflow-hidden"
                  rows={1}
                />
              </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVoiceInput}
                    className={cn(
                      "h-10 w-10 rounded-full",
                      isListening ? "bg-red-50 text-red-500 animate-pulse" : "text-slate-400"
                    )}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>

                  <Button
                    size="icon"
                    disabled={(!inputValue.trim() && attachments.length === 0) || isProcessing}
                    onClick={handleSendMessage}
                    className={cn(
                      "h-10 w-10 rounded-full transition-all",
                      (inputValue.trim() || attachments.length > 0) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {isProcessing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <ArrowUp className="h-5 w-5" />}
                  </Button>
                </div>
              </motion.div>

              <div className="absolute -bottom-6 left-6 flex items-center gap-4">
                {searchStatus && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase">
                    <Globe className="h-3 w-3 animate-spin" /> {searchStatus}
                  </div>
                )}
                {isProcessing && !searchStatus && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                      <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    </span>
                    Thinking
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
