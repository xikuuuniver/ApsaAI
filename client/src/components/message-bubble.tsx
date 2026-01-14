import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";
import { Bot, User, BrainCircuit, Volume2, VolumeX, Settings2, Square, Copy, Check, ThumbsUp, Heart, Laugh, Frown, Code, Smile, Angry, HelpCircle, Cpu } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [speechRate, setSpeechRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Check if Web Speech API is supported
  const [speechSupported, setSpeechSupported] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  
  useEffect(() => {
    setSpeechSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const reactions = [
    { emoji: '❤️', icon: Heart, label: 'Love' },
    { emoji: '👍', icon: ThumbsUp, label: 'Like' },
    { emoji: '😢', icon: Frown, label: 'Sad' },
    { emoji: '😊', icon: Laugh, label: 'Happy' },
    { emoji: '😠', icon: Angry, label: 'Angry' },
    { emoji: '🤔', icon: HelpCircle, label: 'Another one' },
  ];

  const handleReaction = (emoji: string) => {
    setReaction(reaction === emoji ? null : emoji);
    setShowReactions(false);
  };

  // Render content with code block highlighting
  const renderContent = (content: string) => {
    if (!content) return null;
    
    // Regex to match code blocks with optional language
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    const renderTextWithAnimation = (text: string, baseKey: number) => {
      return text.split(' ').map((word, i) => (
        <motion.span
          key={`${baseKey}-${i}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: i * 0.05,
            ease: "easeOut" 
          }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ));
    };

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={keyIndex++}>
            {renderTextWithAnimation(content.slice(lastIndex, match.index), keyIndex)}
          </span>
        );
      }
      
      const language = match[1] || 'code';
      const code = match[2].trim();
      
      // Add styled code block
      parts.push(
        <div key={keyIndex++} className="my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <Code className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">{language}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(code);
              }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Copy
            </button>
          </div>
          <pre className="p-3 overflow-x-auto bg-slate-50 dark:bg-slate-900/50 text-xs leading-relaxed">
            <code className="font-mono text-slate-800 dark:text-slate-200">{code}</code>
          </pre>
        </div>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={keyIndex++}>
          {renderTextWithAnimation(content.slice(lastIndex), keyIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : content;
  };

  // Load available voices
  useEffect(() => {
    if (!speechSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      // Set default to first English voice or first available
      const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
      if (englishVoice && !selectedVoice) {
        setSelectedVoice(englishVoice.name);
      } else if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [speechSupported]);

  // Close settings on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowVoiceSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSpeak = () => {
    if (!speechSupported) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = speechRate;
    
    // Auto-select voice based on content or message language if available
    const detectLanguage = () => {
      const content = message.content.toLowerCase();
      // Simple detection for common local languages
      if (/[\u0980-\u09FF]/.test(content)) return 'bn'; // Bengali
      if (/[\u0900-\u097F]/.test(content)) return 'hi'; // Hindi
      return 'en';
    };

    const targetLangCode = detectLanguage();
    const availableVoices = window.speechSynthesis.getVoices();
    
    // Sort voices to prefer "Premium", "Google", "Natural", or high quality ones
    const sortedVoices = [...availableVoices].sort((a, b) => {
      const highQualityKeywords = ['natural', 'google', 'premium', 'neural', 'enhanced'];
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      
      const aScore = highQualityKeywords.reduce((acc, kw) => acc + (aLower.includes(kw) ? 1 : 0), 0);
      const bScore = highQualityKeywords.reduce((acc, kw) => acc + (bLower.includes(kw) ? 1 : 0), 0);
      
      return bScore - aScore;
    });
    
    // Try to find a voice that matches the detected language exactly (e.g. bn-BD) or generally (e.g. bn)
    const bestVoice = sortedVoices.find(v => v.lang.startsWith(targetLangCode) || v.lang.includes(targetLangCode));

    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
      // Adjust pitch/rate slightly for "more human" feel on standard voices
      utterance.pitch = 1.0;
    } else {
      utterance.lang = targetLangCode === 'bn' ? 'bn-BD' : targetLangCode === 'hi' ? 'hi-IN' : 'en-US';
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleStop = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const [displayedContent, setDisplayedContent] = useState(isUser ? message.content : "");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isUser && message.content && message.content !== displayedContent) {
      setDisplayedContent(message.content);
    } else if (isUser) {
      setDisplayedContent(message.content);
    }
  }, [message.content, isUser]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        opacity: { duration: 0.2 }
      }}
      className={cn(
        "flex w-full gap-4 py-1 first:pt-0",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Content */}
      <div className={cn(
        "flex flex-col gap-1 w-full",
        isUser ? "items-end" : "items-start"
      )}>
        
        {/* Message Bubble - Enhanced with glassmorphism and animations */}
        <motion.div 
          layout
          initial={false}
          className={cn(
            "relative overflow-hidden rounded-2xl px-4 py-3 text-[17px] leading-relaxed transition-all duration-500 ease-in-out",
            isUser 
              ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm ml-auto max-w-[85%] rounded-tr-sm w-fit" 
              : "bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm max-w-[85%] rounded-tl-sm w-fit",
            !isUser && message.isThinking && "shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
          )}
          style={{ 
            minHeight: '0px'
          }}
        >
          {/* Thinking Process (AI Only) */}
          {!isUser && message.thinkingProcess && message.thinkingProcess.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-3"
            >
              <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <Bot className="h-3 w-3 animate-bounce" />
                <span>Thinking Process</span>
              </div>
              <div className="space-y-1.5">
                {message.thinkingProcess.map((step, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ x: -5, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono"
                  >
                    <span className="text-slate-300 dark:text-slate-600 select-none">›</span>
                    <span>{step}</span>
                  </motion.div>
                ))}
                {message.isThinking && (
                  <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 animate-pulse pl-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div className="whitespace-pre-wrap font-sans relative">
            {!isUser && message.content ? (
              <div className="relative">
                {renderContent(displayedContent)}
              </div>
            ) : (
              renderContent(displayedContent)
            )}
            {message.isThinking && !message.content && (
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex flex-col gap-1">
                  <span className="text-blue-500 dark:text-blue-400 text-sm font-medium animate-pulse">Thinking...</span>
                  <div className="flex gap-1.5 items-center">
                    <motion.span 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    ></motion.span>
                    <motion.span 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    ></motion.span>
                    <motion.span 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"
                    ></motion.span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Subtle gradient sweep effect for generating state */}
          {!isUser && message.isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-slate-200/5 dark:bg-slate-700/5"
            />
          )}
        </motion.div>

        {/* Message Actions */}
        {message.content && !message.isThinking && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {/* Copy Button */}
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-lg transition-all",
                copied 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
              data-testid="button-copy-message"
              title={copied ? "Copied!" : "Copy"}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </motion.button>

            <div className="relative">
              <motion.button
                onClick={() => setShowReactions(!showReactions)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg transition-all",
                  reaction
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
                data-testid="button-react"
                title="React"
              >
                {reaction ? (
                  <span className="text-sm">{reaction}</span>
                ) : (
                  <Smile className="h-4 w-4" />
                )}
              </motion.button>

              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 5 }}
                    className="absolute bottom-full right-0 mb-1 flex gap-1 p-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50"
                  >
                    {reactions.map(({ emoji }) => (
                      <motion.button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "w-7 h-7 flex items-center justify-center rounded-lg text-base hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
                          reaction === emoji && "bg-amber-100 dark:bg-amber-900/30"
                        )}
                        data-testid={`reaction-${emoji}`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Show selected reaction badge */}
            {reaction && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-sm"
              >
                {reaction}
              </motion.span>
            )}

            {/* Speaker Button (Shortcut) */}
            {!isUser && speechSupported && (
              <motion.button
                onClick={handleSpeak}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg transition-all",
                  isSpeaking 
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
                title={isSpeaking ? "Stop" : "Read Aloud"}
              >
                {isSpeaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </motion.button>
            )}

            {/* Model Selection Icon (Visual Only for now) */}
            {!isUser && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
                title="Model Info"
              >
                <Cpu className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        )}

        {/* Read Aloud Controls (AI Only - only show if speech is supported) */}
        {!isUser && message.content && !message.isThinking && speechSupported && (
          <div className="flex items-center gap-1 mt-1 relative" ref={settingsRef}>
            {/* Play/Stop Button */}
            <button
              onClick={handleSpeak}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all",
                isSpeaking 
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
              data-testid="button-read-aloud"
            >
              {isSpeaking ? (
                <>
                  <Square className="h-3 w-3" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3 w-3" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                showVoiceSettings
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
              data-testid="button-voice-settings"
              aria-label="Voice settings"
              title="Voice settings"
            >
              <Settings2 className="h-3 w-3" />
            </button>

            {/* Voice Settings Popup */}
            {showVoiceSettings && (
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[240px] z-50 animate-in fade-in slide-in-from-bottom-2">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Voice Settings</h4>
                
                {/* Voice Selection */}
                <div className="mb-3">
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 border-none text-slate-700 dark:text-slate-300"
                    data-testid="select-voice"
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed Slider */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex justify-between">
                    <span>Speed</span>
                    <span className="text-blue-500">{speechRate}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-slate-200 dark:bg-slate-600 accent-blue-500"
                    data-testid="slider-speed"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                    <span>0.5x</span>
                    <span>1x</span>
                    <span>2x</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode Label (AI Only - Subtle) */}
        {!isUser && message.mode && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1">
            Generated with {message.mode.replace('_', ' ').toLowerCase()} mode
          </span>
        )}
      </div>
    </motion.div>
  );
}
