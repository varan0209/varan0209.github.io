import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { BrainCircuit, ExternalLink, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/analytics';
import {
  buildLocalPortfolioAnswer,
  retrievePortfolioKnowledge,
  suggestedPortfolioQuestions,
} from '@/data/portfolioKnowledge';

type ChatMode = 'general' | 'role_match' | 'project_recommendation';

type Citation = {
  label: string;
  href: string;
};

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  citations?: Citation[];
  matchedTopics?: string[];
};

const roles = ['Data Analyst', 'Software Engineer', 'Python Developer', 'SQL Developer', 'Data Engineer'];

const modeLabels: { mode: ChatMode; label: string }[] = [
  { mode: 'general', label: 'General' },
  { mode: 'role_match', label: 'Role Match' },
  { mode: 'project_recommendation', label: 'Projects' },
];

const createId = () => Math.random().toString(36).slice(2);

const initialMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Ask me about Varan's data analytics dashboards, software engineering projects, experience, education, or which project is most relevant for a role. I answer from the portfolio knowledge base and cite the sections I used.",
  citations: [
    { label: 'Projects', href: '#projects' },
    { label: 'Experience', href: '#experience' },
    { label: 'Education', href: '#education' },
  ],
};

export const AskTaranAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('general');
  const [selectedRole, setSelectedRole] = useState('Data Analyst');
  const [serverQuestions, setServerQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Grounded portfolio assistant');
  const formRef = useRef<HTMLFormElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const defaultQuestions = useMemo(() => {
    if (mode === 'role_match') {
      return [
        `Why is Varan a strong ${selectedRole} candidate?`,
        `Which projects best support ${selectedRole}?`,
        `What skills should I notice for ${selectedRole}?`,
      ];
    }

    if (mode === 'project_recommendation') {
      return [
        'Which project should I review first?',
        'Which project shows RAG or MLOps skills?',
        'Which project shows backend and data depth?',
      ];
    }

    return suggestedPortfolioQuestions;
  }, [mode, selectedRole]);

  const visibleQuestions = serverQuestions.length ? serverQuestions : defaultQuestions;

  useEffect(() => {
    setServerQuestions([]);
  }, [mode, selectedRole]);

  useEffect(() => {
    const messagesNode = messagesRef.current;
    if (!messagesNode) return;
    messagesNode.scrollTo({
      top: messagesNode.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  const openAssistant = () => {
    setIsOpen(true);
    trackEvent({ action: 'open_ai_assistant', label: mode });
  };

  const closeAssistant = () => {
    setIsOpen(false);
    trackEvent({ action: 'close_ai_assistant', label: mode });
  };

  const buildLocalFallback = (message: string) => {
    const matches = retrievePortfolioKnowledge(message, { mode, selectedRole, limit: 5 });
    return {
      answer: buildLocalPortfolioAnswer(message, matches, { selectedRole: mode === 'role_match' ? selectedRole : undefined }),
      citations: matches.slice(0, 4).map(({ item }) => ({ label: item.title, href: item.href })),
      matchedTopics: [...new Set(matches.flatMap(({ item }) => [...item.roleTags, ...item.skillTags]).slice(0, 10))],
      suggestedQuestions: visibleQuestions,
    };
  };

  const sendMessage = async (message: string) => {
    const cleanMessage = message.trim();
    if (!cleanMessage || isLoading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: cleanMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsLoading(true);
    setStatus('Retrieving portfolio evidence...');
    trackEvent({ action: 'ask_ai_assistant', label: cleanMessage.slice(0, 80), category: mode });

    try {
      const response = await fetch('/api/portfolio-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanMessage,
          mode,
          selectedRole: mode === 'role_match' ? selectedRole : undefined,
        }),
      });

      const payload = await response.json();
      const result = response.ok ? payload : payload.fallback || buildLocalFallback(cleanMessage);
      const nextQuestions = Array.isArray(result.suggestedQuestions) ? result.suggestedQuestions : [];

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: result.answer,
          citations: result.citations,
          matchedTopics: result.matchedTopics,
        },
      ]);
      setServerQuestions(nextQuestions);

      setStatus(response.ok ? 'Answered with portfolio evidence' : 'Answered with local portfolio fallback');
      trackEvent({ action: response.ok ? 'ai_answer_success' : 'ai_answer_fallback', label: mode });
      trackEvent({
        action: 'ai_citations_returned',
        label: result.citations?.map((citation: Citation) => citation.label).join(', '),
        category: mode,
      });
    } catch {
      const fallback = buildLocalFallback(cleanMessage);
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: fallback.answer,
          citations: fallback.citations,
          matchedTopics: fallback.matchedTopics,
        },
      ]);
      setStatus('Answered with local portfolio fallback');
      trackEvent({ action: 'ai_answer_network_fallback', label: mode });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={openAssistant}
        className="ask-ai-launcher"
        aria-label="Ask Varan AI"
      >
        <Sparkles size={17} />
        <span className="hidden sm:inline">Ask Varan AI</span>
      </Button>

      {isOpen && (
        <div className="ask-ai-panel-shell">
          <section className="ask-ai-drawer glass-card relative flex h-full w-full flex-col overflow-hidden">
            <header className="ask-ai-drawer__header border-b border-border/50 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="brand-mark h-12 w-12 rounded-xl">
                    <BrainCircuit size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-bold">Ask Varan AI</h2>
                      <Badge className="border-primary/30 bg-primary/10 text-primary">
                        Grounded
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{status}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={closeAssistant} aria-label="Close assistant">
                  <X size={18} />
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {modeLabels.map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => {
                      setMode(item.mode);
                      trackEvent({ action: 'select_ai_mode', label: item.mode });
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      mode === item.mode
                        ? 'border-primary/50 bg-primary/15 text-primary'
                        : 'border-border/60 bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {mode === 'role_match' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role);
                        trackEvent({ action: 'select_ai_role', label: role });
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedRole === role
                          ? 'border-primary/50 bg-primary text-primary-foreground'
                          : 'border-border/60 bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-primary'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </header>

            <div className="flex min-h-0 flex-1 flex-col">
              <div ref={messagesRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                <div className="ask-ai-suggestions rounded-2xl border border-border/50 bg-background/35 p-3">
                  <h3 className="mb-3 font-display text-sm font-semibold">Suggested Questions</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {visibleQuestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => void sendMessage(question)}
                        className="min-w-[13rem] rounded-xl border border-border/50 bg-background/45 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`max-w-[92%] rounded-2xl border p-4 ${
                      message.role === 'user'
                        ? 'ml-auto border-primary/35 bg-primary/12'
                        : 'border-border/50 bg-background/42'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      {message.role === 'user' ? <MessageSquare size={14} /> : <Sparkles size={14} />}
                      {message.role === 'user' ? 'Question' : 'Portfolio Answer'}
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{message.content}</p>

                    {!!message.citations?.length && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.citations.map((citation) => (
                          <a
                            key={`${message.id}-${citation.href}-${citation.label}`}
                            href={citation.href}
                            onClick={() => {
                              setIsOpen(false);
                              trackEvent({ action: 'open_ai_citation', label: citation.label });
                            }}
                            className="tech-chip text-xs hover:border-primary/50 hover:text-primary"
                          >
                            {citation.label}
                            <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    )}

                    {!!message.matchedTopics?.length && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {message.matchedTopics.slice(0, 6).map((topic) => (
                          <span key={`${message.id}-${topic}`} className="rounded-full bg-secondary/60 px-2 py-1 text-[0.68rem] text-muted-foreground">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/42 p-4 text-sm text-muted-foreground">
                    <Loader2 size={18} className="animate-spin text-primary" />
                    Retrieving evidence and preparing a grounded answer...
                  </div>
                )}
              </div>

              <div className="border-t border-border/50 bg-background/25 p-4">
                <div className="mb-3 rounded-2xl border border-primary/20 bg-primary/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">How it works</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    The assistant retrieves portfolio evidence first, then answers with citations. On GitHub Pages backup, it falls back to local grounded retrieval.
                  </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit}>
                  <div className="flex gap-3">
                    <input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      maxLength={900}
                      placeholder="Ask about projects, experience, skills, or relocation..."
                      className="min-w-0 flex-1 rounded-full border border-border/60 bg-background/70 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/55"
                    />
                    <Button type="submit" className="btn-primary h-12 w-12 rounded-full p-0" disabled={isLoading || !input.trim()}>
                      <Send size={18} />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
};
