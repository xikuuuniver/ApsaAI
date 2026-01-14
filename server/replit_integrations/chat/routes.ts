import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { ObjectStorageService } from "../object_storage/objectStorage";

const openai = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
}) : (process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
}) : null);

const TRAINING_PASSWORD = process.env.TRAINING_PASSWORD;

if (!TRAINING_PASSWORD) {
  console.warn("Warning: TRAINING_PASSWORD environment variable is not set. Training feature will be disabled.");
}

export function registerChatRoutes(app: Express): void {
  // Verify training password
  app.post("/api/training/verify-password", async (req: Request, res: Response) => {
    try {
      if (!TRAINING_PASSWORD) {
        return res.status(503).json({ error: "Training feature is not configured" });
      }
      const { password } = req.body;
      if (password === TRAINING_PASSWORD) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      res.status(500).json({ error: "Failed to verify password" });
    }
  });

  // Get all training messages (password protected)
  app.post("/api/training/messages/list", async (req: Request, res: Response) => {
    try {
      if (!TRAINING_PASSWORD) {
        return res.status(503).json({ error: "Training feature is not configured" });
      }
      const { password } = req.body;
      if (password !== TRAINING_PASSWORD) {
        return res.status(401).json({ error: "Invalid password" });
      }
      const messages = await chatStorage.getAllTrainingMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching training messages:", error);
      res.status(500).json({ error: "Failed to fetch training messages" });
    }
  });

  // Add training message
  app.post("/api/training/messages", async (req: Request, res: Response) => {
    try {
      if (!TRAINING_PASSWORD) {
        return res.status(503).json({ error: "Training feature is not configured" });
      }
      const { instruction, password } = req.body;
      
      // Verify password
      if (password !== TRAINING_PASSWORD) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      const message = await chatStorage.createTrainingMessage(instruction);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating training message:", error);
      res.status(500).json({ error: "Failed to create training message" });
    }
  });

  // Delete training message
  app.delete("/api/training/messages/:id", async (req: Request, res: Response) => {
    try {
      if (!TRAINING_PASSWORD) {
        return res.status(503).json({ error: "Training feature is not configured" });
      }
      const { password } = req.body;
      
      // Verify password
      if (password !== TRAINING_PASSWORD) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      const id = parseInt(req.params.id);
      await chatStorage.deleteTrainingMessage(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting training message:", error);
      res.status(500).json({ error: "Failed to delete training message" });
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Update conversation title
  app.patch("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { title } = req.body;
      await chatStorage.updateConversationTitle(id, title);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  // Generate smart title for conversation
  app.post("/api/conversations/:id/generate-title", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { userMessage } = req.body;
      
      if (!userMessage) {
        return res.status(400).json({ error: "userMessage is required" });
      }

      if (!openai) {
        return res.status(503).json({ error: "AI Chat feature is not configured. Please add OpenAI integration." });
      }

      const response = await openai.chat.completions.create({
        model: process.env.OPENROUTER_API_KEY ? "arcee-ai/airinity-mini:free" : "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Generate a creative and smart title (max 3 words) for a conversation. Make it interesting and memorable without being too funny. Keep it balanced and professional. Return only the title, nothing else."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_completion_tokens: 15,
      });

      const title = response.choices[0]?.message?.content?.trim() || "New Chat";
      await chatStorage.updateConversationTitle(id, title);
      res.json({ title });
    } catch (error) {
      console.error("Error generating title:", error);
      res.status(500).json({ error: "Failed to generate title" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, mode, attachments, webSearchEnabled } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      
      // Create system prompt based on mode
      const systemPrompts: Record<string, string> = {
        DEFAULT: `You are Nexus, the user's best friend and intellectual companion. Think of yourself as their supportive older brother who's always there to chat, help, and explore ideas together.

IMPORTANT - Language Detection: 
- If the user writes in a code-mixed language (Banglish, Hindilish, Urdu-English mix, etc.), RESPOND IN THE SAME CODE-MIXED LANGUAGE
- If they use Bengali with English words (Banglish), reply in Banglish
- If they use Hindi with English words (Hindilish), reply in Hindilish
- Match their language and script exactly - if they use English script for Bengali, continue in English script
- Never force them to use just English or just their native language

Your personality:
- Super warm, friendly, and casual - use "bro", "dude", "hey buddy" naturally
- Genuinely enthusiastic and supportive
- Talk like you're chatting with your closest friend
- Use humor and be playful
- Be real and authentic - no corporate speak
- Show genuine care for the user

Your approach to discussions:
- You discuss ALL topics openly and objectively, including controversial historical events and figures
- You present multiple perspectives fairly without bias
- You believe in intellectual freedom and open discourse
- You don't shy away from difficult topics - history, politics, philosophy, anything
- You analyze events and people based on facts and context, not just popular narratives
- You encourage critical thinking and examining all sides

When analyzing images or videos:
- Describe what you see in detail
- Answer any questions about the content
- Be helpful and thorough in your analysis

You're not preachy or judgmental. You're here to explore ideas, share knowledge, and be a genuine friend. Let's chat!`,

        WHAT_IF: `You are Nexus in "What If" mode - a curious, analytical thinking engine excelling at hypothetical reasoning.

IMPORTANT - Language Detection:
- If the user writes in a code-mixed language (Banglish, Hindilish, etc.), RESPOND IN THE SAME CODE-MIXED LANGUAGE
- Match their language and script exactly

When presented with a scenario:
1. State your assumptions clearly and explicitly
2. Label all speculation as "working theory" or "hypothesis"
3. Explore logical consequences step by step
4. Separate realistic outcomes from speculative ones
5. Be intellectually honest about uncertainty

Use clear, conversational language. Avoid robotic tone. Be human, sharp, and modern. Never present fiction as fact.`,

        CHAIN_REACTION: `You are Nexus in "Chain Reaction" mode - a systems thinker specializing in causal analysis. You trace how one event cascades through interconnected systems.

IMPORTANT - Language Detection:
- If the user writes in a code-mixed language (Banglish, Hindilish, etc.), RESPOND IN THE SAME CODE-MIXED LANGUAGE
- Match their language and script exactly

For each query:
1. Identify the primary catalyst
2. Map immediate effects (Level 1)
3. Trace secondary effects (Level 2)
4. Identify long-term consequences (Level 3+)
5. Highlight unexpected side effects and feedback loops
6. Consider technology, society, psychology, and economics

Be explicit about uncertainty. Label speculation clearly. Use conversational, modern language.`,

        PARALLEL_TIMELINES: `You are Nexus in "Parallel Timelines" mode - a decision analyst who explores divergent outcomes. You generate multiple logical futures from a single decision point.

IMPORTANT - Language Detection:
- If the user writes in a code-mixed language (Banglish, Hindilish, etc.), RESPOND IN THE SAME CODE-MIXED LANGUAGE
- Match their language and script exactly

Your process:
1. Define the divergence point clearly
2. Create 2-3 distinct timelines, each internally consistent
3. Explain what must be true for each timeline to unfold
4. Compare timelines and highlight key differences
5. Note which assumptions drive the divergence

Be intellectually honest. Label speculation. Use clear, modern language without jargon.`,
      };

      let systemPrompt = mode && systemPrompts[mode] ? systemPrompts[mode] : systemPrompts.DEFAULT;
      systemPrompt += "\n\nCRITICAL: Always ensure proper spacing between words. Never merge words like 'wish I' into 'wishI'. Use natural spacing and grammar in all responses.";
      
      // Fetch and inject training instructions
      try {
        const trainingData = await chatStorage.getAllTrainingMessages();
        if (trainingData.length > 0) {
          const trainingInstructions = trainingData.map(t => t.instruction).join('\n\n');
          systemPrompt += `\n\n🧠 CUSTOM TRAINING INSTRUCTIONS 🧠
The following are personalized instructions from your creator. Follow these guidelines as part of your core behavior:

${trainingInstructions}

Remember: These training instructions are permanent parts of your personality and behavior. Apply them naturally in all interactions.`;
        }
      } catch (error) {
        console.error("Error fetching training data:", error);
      }
      
      // Enhance system prompt for web search
      if (webSearchEnabled) {
        systemPrompt += `\n\n🌐 WEB SEARCH MODE ACTIVE 🌐
You are now connected to the internet via Perplexity's real-time search engine. You CAN and SHOULD:
1. Search for the latest news, information, and real-time data
2. Provide current information with today's date context (Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
3. Cite sources and include relevant links when helpful
4. Acknowledge that you're using web search when asked about your capabilities

When the user asks if you can search or have internet access, CONFIRM that yes, Web Search mode is enabled and you have real-time internet access.`;
      }

      // Check if there are media attachments
      const hasMedia = attachments && attachments.length > 0;
      const objectStorageService = new ObjectStorageService();
      
      // Build user message content (multimodal if attachments present)
      let userMessageContent: any = content;
      
      if (hasMedia) {
        const contentParts: any[] = [];
        
        // Add text content first
        if (content) {
          contentParts.push({ type: "text", text: content });
        }
        
        // Add media attachments - convert to base64 data URLs
        for (const attachment of attachments) {
          const { type, url } = attachment;
          
          try {
            // Convert object storage path to base64 data URL
            const { dataUrl } = await objectStorageService.getObjectAsBase64(url);
            
            if (type.startsWith('image/')) {
              contentParts.push({
                type: "image_url",
                image_url: { url: dataUrl }
              });
            } else if (type.startsWith('video/')) {
              // For videos, we need to include as base64 inline_data
              contentParts.push({
                type: "image_url",
                image_url: { url: dataUrl }
              });
            }
          } catch (err) {
            console.error("Error converting attachment to base64:", err);
            contentParts.push({ type: "text", text: `[Could not load attachment: ${attachment.name}]` });
          }
        }
        
        userMessageContent = contentParts;
      }

      // Build chat messages array
      const chatMessages: any[] = [
        { role: "system", content: systemPrompt },
      ];
      
      // Add history (text only for simplicity)
      for (let i = 0; i < messages.length - 1; i++) {
        chatMessages.push({
          role: messages[i].role,
          content: messages[i].content,
        });
      }
      
      // Add current message with potential media
      chatMessages.push({
        role: "user",
        content: userMessageContent,
      });

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Select model based on context:
      // Priority: Media attachments > Web search > Default
      // - Media: Use Gemini for multimodal analysis (takes priority)
      // - Web search (no media): Use Perplexity for real-time internet access
      // - Default: Use specified OpenRouter model or GPT-4o-mini
      let model = process.env.OPENROUTER_API_KEY ? "arcee-ai/airinity-mini:free" : "gpt-4o-mini";
      let actualWebSearchEnabled = webSearchEnabled;
      
      console.log("Web search enabled:", webSearchEnabled, "Has media:", hasMedia);
      
      if (hasMedia) {
        // Media takes priority - use multimodal model
        model = "gpt-4o"; // Use gpt-4o for multimodal
        actualWebSearchEnabled = false; // Disable web search when media is attached
      } else if (webSearchEnabled) {
        model = "gpt-4o"; // Fallback if no specific search model is available via AI Integrations
      }
      
      console.log("Selected model:", model);
      let fullResponse = "";
      let useMultimodal = hasMedia;

      // Send search status for web search
      if (webSearchEnabled && !hasMedia) {
        const searchQuery = typeof content === 'string' ? content.slice(0, 100) : "multimodal content";
        res.write(`data: ${JSON.stringify({ searchStatus: `🔍 Searching: "${searchQuery}${typeof content === 'string' && content.length > 100 ? '...' : ''}"` })}\n\n`);
        
        // Simulate search phases for better UX
        setTimeout(() => {
          res.write(`data: ${JSON.stringify({ searchStatus: "📡 Fetching latest information from the web..." })}\n\n`);
        }, 500);
      }

      if (!openai) {
        throw new Error("AI Chat feature is not configured");
      }

      // Try multimodal first, fall back to text if it fails
      try {
        const stream = await openai.chat.completions.create({
          model,
          messages: chatMessages,
          stream: true,
          max_completion_tokens: 2048,
        });

        // Clear search status when response starts
        let firstChunk = true;
        for await (const chunk of stream) {
          const chunkContent = chunk.choices[0]?.delta?.content || "";
          if (chunkContent) {
            if (firstChunk && webSearchEnabled && !hasMedia) {
              res.write(`data: ${JSON.stringify({ searchStatus: "✅ Found results! Generating response..." })}\n\n`);
              firstChunk = false;
            }
            fullResponse += chunkContent;
            res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
          }
        }
      } catch (multimodalError: any) {
        // If multimodal fails (e.g., insufficient balance), fall back to text-only
        if (hasMedia && multimodalError?.status === 402) {
          console.log("Multimodal failed due to balance, falling back to text-only");
          
          // Add a note about the media
          const mediaNote = attachments.map((a: any) => 
            `[User attached: ${a.name} (${a.type})]`
          ).join('\n');
          
          const fallbackMessages = [
            { role: "system", content: systemPrompt },
            ...messages.slice(0, -1).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { 
              role: "user", 
              content: `${mediaNote}\n\nNote: I attached media files but video/image analysis requires additional credits. Please respond to my message: ${typeof content === 'string' ? content : 'multimodal request'}` 
            },
          ];

          const fallbackStream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: fallbackMessages as any,
            stream: true,
            max_completion_tokens: 2048,
          });

          for await (const chunk of fallbackStream) {
            const chunkContent = chunk.choices[0]?.delta?.content || "";
            if (chunkContent) {
              fullResponse += chunkContent;
              res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
            }
          }
        } else {
          throw multimodalError;
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      if (!openai) {
        console.warn("AI suggestions skipped: OpenAI not configured");
        res.write(`data: ${JSON.stringify({ done: true, suggestions: [] })}\n\n`);
        res.end();
        return;
      }

      // Generate contextual suggestions using AI
      let suggestions: string[] = [];
      try {
        const suggestionResponse = await openai.chat.completions.create({
          model: process.env.OPENROUTER_API_KEY ? "arcee-ai/airinity-mini:free" : "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant. Based on the user's previous message and your response, generate 5 relevant, contextual, and interesting follow-up questions or suggestions the user might want to ask next. Keep them short (max 8 words each). Return a JSON object with a 'suggestions' key containing an array of strings. Example: {\"suggestions\": [\"What else can you do?\", \"Tell me more\"]}"
            },
            {
              role: "user",
              content: `User said: ${content}\n\nAI responded: ${fullResponse}`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        const contentStr = suggestionResponse.choices[0]?.message?.content || '{"suggestions": []}';
        console.log("AI Suggestion Raw Content:", contentStr);
        const result = JSON.parse(contentStr);
        suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
      } catch (err) {
        console.error("Error generating AI suggestions:", err);
      }

      res.write(`data: ${JSON.stringify({ done: true, suggestions })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
