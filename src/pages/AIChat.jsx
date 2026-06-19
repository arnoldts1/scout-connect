import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, Sparkles, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SUGGESTED_PROMPTS = [
  "What are the Scout Law principles?",
  "How can I earn my camping badge?",
  "Tell me about scout ranks",
  "What activities can our patrol do?",
];

export default function AIChat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl('Messages'));
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const detectLanguage = (text) => {
    const msg = text.toLowerCase();

    // French keywords
    if (msg.match(/\b(bonjour|salut|merci|bien|comment|ça|vous|nous|les|pour|avec|très|francais|français|france)\b/)) {
      return 'fr';
    }

    // Kinyarwanda keywords
    if (msg.match(/\b(muraho|mwaramutse|ubundi|ndi|neza|kuri|cu|ry|itegeko|umwanzi|ubwenge|ibikorwa|sitara|ingangizo)\b/)) {
      return 'rw';
    }

    // Default to English
    return 'en';
  };

  const getLocalResponse = (userMessage) => {
    const msg = userMessage.toLowerCase().trim();
    const language = detectLanguage(userMessage);

    // Language-specific responses
    const responses = {
      en: {
        greetings: "Hey there, Scout! 👋 Welcome to ScoutGPT! How can I help you today?",
        howAreYou: "I'm doing great, thanks for asking! I'm here and ready to help you with any scout-related questions. What can I help you with?",
        introduction: "I'm ScoutGPT, your AI scout assistant! 🤖🏕️ I'm here to help you with scouting knowledge including badges, ranks, camping, scout law, activities, leadership, and safety.",
        gratitude: "You're welcome, Scout! Always happy to help. Got any other questions about scouting?",
        goodbye: "Goodbye, Scout! Keep up the great scouting spirit! 🏕️ Feel free to come back anytime you have questions!",
        capabilities: "I can help you with:\n• Badge requirements\n• Scout ranks\n• Camping skills\n• Scout Law and Promise\n• Patrol activities\n• Leadership tips\n• Safety guidelines\n• Scouting knowledge",
        badge: "To earn badges, demonstrate specific skills and complete required activities. Talk to your scout leader for guidance!",
        rank: "Scout ranks represent your progression! Each rank builds skills. Advancement needs skills, service, and leadership.",
        camping: "Camping essentials: tents, campfires, cooking, Leave No Trace principles. Core scouting activity!",
        law: "Scout Law values: Trustworthy, Loyal, Helpful, Friendly, Courteous, Kind, Obedient, Cheerful, Thrifty, Brave, Clean, Reverent.",
        activity: "Great activities: hiking, team challenges, cooking, nature study, knot-tying, scavenger hunts, service!",
        leadership: "Take patrol roles, lead by example, help teammates grow, listen, make fair decisions.",
        knot: "Basic knots: square (binding), bowline (fixed loop), clove hitch (securing), taut-line (adjustable).",
        safety: "Safety: tell an adult where you're going, buddy system, first aid, Leave No Trace, stay hydrated.",
        fire: "Fire safety: designated areas, water nearby, fully extinguish, never leave unattended.",
        hiking: "Hiking: proper gear, start early, marked trails, water, never alone - buddy system!",
        cooking: "Scout cooking: basic skills, food safety, cook over fire/stove, clean up campsite!",
        default: "That's about scouting! Ask me about badges, ranks, camping, activities, leadership, safety!"
      },
      fr: {
        greetings: "Salut Scout! 👋 Bienvenue sur ScoutGPT! Comment puis-je t'aider?",
        howAreYou: "Je vais bien, merci! Je suis ici pour répondre à vos questions sur le scoutisme.",
        introduction: "Je suis ScoutGPT, votre assistant scout IA! 🤖🏕️ Je peux vous aider avec les insignes, les rangs, le camping, la Loi scoute, et bien plus!",
        gratitude: "De rien, Scout! Toujours heureux d'aider. D'autres questions sur le scoutisme?",
        goodbye: "Au revoir, Scout! Garde l'esprit du scoutisme! 🏕️",
        capabilities: "Je peux vous aider avec:\n• Les insignes\n• Les rangs scouts\n• Le camping\n• La Loi scoute\n• Les activités de patrouille\n• Le leadership\n• La sécurité\n• Les connaissances scoutes",
        badge: "Pour obtenir des insignes, démontrez des compétences spécifiques. Parlez à votre chef scout!",
        rank: "Les rangs scouts représentent votre progression! Chaque rang renforce vos compétences.",
        camping: "Camping essentiel: tentes, feux de camp, cuisine, laisser aucune trace.",
        law: "Loi scoute: Loyal, Honnête, Serviable, Amical, Courtois, Bienveillant, Obéissant, Gai, Économe, Courageux, Propre, Respectueux.",
        activity: "Excellentes activités: randonnée, défis d'équipe, cuisine, étude de la nature, nœuds!",
        leadership: "Prenez des rôles de patrouille, menez par l'exemple, aidez les coéquipiers.",
        knot: "Nœuds basiques: nœud plat, nœud de chaise, nœud de cabestan, nœud de taut-line.",
        safety: "Sécurité: dites à un adulte où vous allez, système de copains, premiers secours, restez hydraté.",
        fire: "Sécurité incendie: zones désignées, eau à proximité, éteindre complètement.",
        hiking: "Randonnée: équipement approprié, commencez tôt, sentiers balisés, eau, jamais seul!",
        cooking: "Cuisine scout: compétences de base, hygiène alimentaire, cuisinez sur feu/réchaud!",
        default: "C'est une bonne question! Demandez-moi sur les insignes, les rangs, le camping..."
      },
      rw: {
        greetings: "Muraho Scout! 👋 Karibu kuri ScoutGPT! Ubundi runaka nkubwira?",
        howAreYou: "Ndi neza, murakoze! Ndi hano kugufasha n'ikintu cyose cy'umwanzi.",
        introduction: "Ndi ScoutGPT, uwigize w'imyidondozo y'iyivogezi! 🤖🏕️ Nshobora kugufasha cu sitara, ingangizo, ubwenge, n'ibindi.",
        gratitude: "Mwacu-nzira! Nishimwe cyane kugufasha. Hari ibindi bimwe?",
        goodbye: "Mwacu kandi! Kuryamana umwanzi! 🏕️",
        capabilities: "Nshobora kugufasha cu:\n• Sitara\n• Ingangizo z'umwanzi\n• Ubwenge\n• Amahoro\n• Ibikorwa by'ikibira\n• Uburezi\n• Ubwiyunge",
        badge: "Kugira sitara, onyine ubwigize. Mara umwanzi wacu!",
        rank: "Ingangizo z'umwanzi ntuwigize! Buri ngangizo igaruza ubwigize.",
        camping: "Ubwenge: indorerwamo, umuriro, ibiryo, kuremerwa.",
        law: "Itegeko ry'umwanzi: Ijoro, Icyana, Urwandi, Ubwenge, Amahoro.",
        activity: "Ibikorwa: imusaraba, ibibazo, ibiryo, amakuba, ubwenge!",
        leadership: "Hari umuyobozi, kwigisha, kunyamanya, kubwira.",
        knot: "Amahuka: kabini, akana, ubwiyunge, akandi.",
        safety: "Ubwiyunge: kubwira umuturanyi, inzira y'ubwanzi, umvisi.",
        fire: "Ubwiyunge bw'umuriro: aho hakwigwa, amazi, kwera.",
        hiking: "Imusaraba: ibikoresho, subira, inzira, amazi, ntakwo.",
        cooking: "Ibiryo by'umwanzi: ubwigize, ubwiyunge bw'ibiryo!",
        default: "Ari ikibazo kigira umwanzi! Mbuze cu sitara, ingangizo..."
      }
    };

    const langResponses = responses[language] || responses.en;

    // Greetings (multi-language)
    if (language === 'fr' && msg.match(/^(salut|bonjour|coucou|hey|allô)\b/)) {
      return langResponses.greetings;
    }
    if (language === 'rw' && msg.match(/^(muraho|mwaramutse|habari)\b/)) {
      return langResponses.greetings;
    }
    if (msg.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy|what's up)\b/)) {
      return langResponses.greetings;
    }

    // Asking how the bot is
    if (language === 'fr' && msg.match(/^(comment (ça|allez|vas))\b/)) {
      return langResponses.howAreYou;
    }
    if (language === 'rw' && msg.match(/^(hari|ubundi)\b/)) {
      return langResponses.howAreYou;
    }
    if (msg.match(/^(how are you|how are you doing|how's it going|how are things)\b/)) {
      return langResponses.howAreYou;
    }

    // Introduction
    if (language === 'fr' && msg.match(/^(qui (êtes|es)|quoi|c'est quoi)\b/)) {
      return langResponses.introduction;
    }
    if (language === 'rw' && msg.match(/^(nde|ari)\b/)) {
      return langResponses.introduction;
    }
    if (msg.match(/^(who are you|what are you|what is scoutgpt|about scoutgpt|tell me about you)\b/)) {
      return langResponses.introduction;
    }

    // Gratitude
    if (language === 'fr' && msg.match(/^(merci|merci beaucoup|merci de)\b/)) {
      return langResponses.gratitude;
    }
    if (language === 'rw' && msg.match(/^(murakoze|asante)\b/)) {
      return langResponses.gratitude;
    }
    if (msg.match(/^(thanks|thank you|appreciate it|much appreciated|thx)\b/)) {
      return langResponses.gratitude;
    }

    // Goodbye
    if (language === 'fr' && msg.match(/^(au revoir|adieu|au revoir|bye|à bientôt)\b/)) {
      return langResponses.goodbye;
    }
    if (language === 'rw' && msg.match(/^(mwacu|goodbye|kwihinda)\b/)) {
      return langResponses.goodbye;
    }
    if (msg.match(/^(bye|goodbye|see you|farewell|take care|see ya|later)\b/)) {
      return langResponses.goodbye;
    }

    // What can you help with
    if (language === 'fr' && msg.match(/^(comment|quoi|aide|peux|capabilities)\b/)) {
      return langResponses.capabilities;
    }
    if (language === 'rw' && msg.match(/^(ubundi|ari|nshobora)\b/)) {
      return langResponses.capabilities;
    }
    if (msg.match(/^(what can you help|what do you help|what do you do|capabilities|features)\b/)) {
      return langResponses.capabilities;
    }

    // Scout-related topics with multi-language support
    const topicKeywords = {
      badge: ['badge', 'insignia', 'earn', 'insigne', 'sitara'],
      rank: ['rank', 'advancement', 'level', 'ingangizo'],
      camping: ['camp', 'tent', 'outdoor', 'ubwenge'],
      law: ['law', 'promise', 'values', 'itegeko'],
      activity: ['activity', 'patrol', 'game', 'fun', 'ibikorwa'],
      leadership: ['leader', 'leadership', 'lead', 'uburezi'],
      knot: ['knot', 'tie', 'rope', 'amahuka'],
      safety: ['safety', 'safe', 'danger', 'ubwiyunge'],
      fire: ['fire', 'burn', 'flame', 'umuriro'],
      hiking: ['hike', 'trail', 'walk', 'mountain', 'imusaraba'],
      cooking: ['cook', 'food', 'eat', 'meal', 'ibiryo'],
      uniform: ['uniform', 'wear', 'dress'],
      team: ['team', 'group', 'together', 'work', 'ikibira']
    };

    // Check each topic for keyword matches
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (msg.includes(keyword)) {
          return langResponses[topic] || langResponses.default;
        }
      }
    }

    // Default response in detected language
    return langResponses.default;
  };

  const callGeminiAPI = async (userMessage) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        // Use local response if no API key
        return getLocalResponse(userMessage);
      }

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Get stored PDF context from localStorage
      const storedPDFs = JSON.parse(localStorage.getItem('scoutgpt_pdfs') || '[]');

      let pdfContext = '';
      if (storedPDFs.length > 0) {
        pdfContext = `\n\nRefer to these scouting documents for context:\n${storedPDFs.slice(0, 3).join('\n\n')}`;
      }

      const prompt = `You are ScoutGPT, an AI assistant for Rwanda Scouts. You help scouts with:
- Scouting knowledge, history, and traditions
- Badge requirements and how to earn them
- Scout ranks and advancement
- Camping and outdoor skills
- Leadership and teamwork
- Scout Law and Promise
- Event planning and activities
- Safety and first aid basics

Be friendly, encouraging, and supportive. Use scout terminology when appropriate.
Keep responses concise but informative.${pdfContext}

User's question: ${userMessage}`;

      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      return aiResponse;
    } catch (error) {
      console.error('Error calling Gemini:', error);

      // Check if it's a quota error
      const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
      if (isQuotaError) {
        console.log('Gemini API quota exceeded. Using local knowledge base.');
        toast.info('Using offline mode - Gemini API quota exceeded');
      }

      // Always fallback to local responses
      return getLocalResponse(userMessage);
    }
  };

  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await callGeminiAPI(messageText.trim());
      
      const aiMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get response from ScoutGPT');
      
      const errorMessage = {
        role: 'assistant',
        content: `I encountered an error: ${error.message}. Please try again or contact support.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(createPageUrl('Messages'))}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-semibold">ScoutGPT</h1>
              <p className="text-sm text-white/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Powered by Google Gemini
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to ScoutGPT!
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              I'm your AI scout assistant powered by Google Gemini. Ask me anything about scouting, badges, camping, and more!
            </p>
            
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:text-purple-600 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, idx) => (
          <div 
            key={idx}
            className={cn(
              "flex gap-3",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <Avatar className={cn(
              "w-10 h-10 flex-shrink-0",
              message.role === 'assistant' && "bg-gradient-to-br from-purple-400 to-indigo-500"
            )}>
              <AvatarFallback className={cn(
                message.role === 'user' 
                  ? "bg-gray-100 text-gray-600" 
                  : "bg-transparent text-white"
              )}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3",
              message.role === 'user' 
                ? "bg-purple-600 text-white rounded-tr-sm" 
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm shadow-sm"
            )}>
              {message.role === 'user' ? (
                <p className="text-sm">{message.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-sm">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 text-sm">{children}</ol>,
                      li: ({ children }) => <li className="mb-1 text-sm">{children}</li>,
                      code: ({ children }) => (
                        <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                          {children}
                        </code>
                      ),
                      h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500">
              <AvatarFallback className="bg-transparent text-white">
                <Bot className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask ScoutGPT anything..."
            className="flex-1 rounded-full bg-gray-100 dark:bg-gray-800 border-0"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "rounded-full h-10 w-10 p-0",
              input.trim() 
                ? "bg-purple-600 hover:bg-purple-700" 
                : "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <Send className={cn(
              "w-5 h-5",
              input.trim() ? "text-white" : "text-gray-400"
            )} />
          </Button>
        </form>
      </div>
    </div>
  );
}
