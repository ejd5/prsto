"use client";

import { useState, useRef, useEffect, useCallback, type DragEvent } from "react";
import Link from "next/link";
import {
  sendAssistantMessage,
  type AssistantMessage,
  type AssistantJob,
} from "@/lib/actions/assistant-search";
import {
  PaperPlaneTilt,
  Spinner,
  Briefcase,
  Star,
  MapPin,
  FileText,
  Megaphone,
  Sparkle,
  Upload,
  FileArrowUp,
  X,
  Code,
  Info,
} from "@phosphor-icons/react";
import { getScoreColor } from "@/lib/score-colors";

function JobCard({ job }: { job: AssistantJob }) {
  return (
    <Link
      href={`/opportunites/${job.id}`}
      className="block rounded-xl border border-bordure/60 bg-fond-widget hover:border-or/30 hover:shadow-[0_0_20px_rgba(0,0,0,0.04)] transition-all duration-300 overflow-hidden"
    >
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-texte leading-snug truncate">
              {job.title}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--texte-secondaire)" }}>
              {job.company}
            </div>
          </div>
          {job.scoreGlobal !== null && (
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{
                background: `${getScoreColor(job.scoreGlobal)}18`,
                color: getScoreColor(job.scoreGlobal),
              }}
            >
              {job.scoreGlobal}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {job.location && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
              <MapPin size={10} weight="bold" />{job.location}
            </span>
          )}
          {job.contractType && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
              <Briefcase size={10} weight="bold" />{job.contractType}
            </span>
          )}
          {job.remote && (
            <span
              className="text-[9.5px] px-1.5 py-0.5 rounded-md font-medium"
              style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}
            >
              {job.remote === "full" ? "Full remote" : job.remote === "partial" ? "Hybride" : "Sur site"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function UploadZone({ onFile }: { onFile: (text: string, name: string) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.name.endsWith(".pdf")) {
      setPdfError(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onFile(reader.result as string, file.name);
    reader.readAsText(file);
  }, [onFile]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".pdf")) {
      setPdfError(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onFile(reader.result as string, file.name);
    reader.readAsText(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
        dragOver
          ? "border-or bg-or/5 scale-[1.02]"
          : "border-bordure bg-fond-widget/50 hover:border-or/30 hover:bg-or/3"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--or-faible)" }}
        >
          <FileArrowUp size={22} className="text-or" weight="bold" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-texte">
            Déposez votre CV ici
          </p>
          <p className="text-[10.5px] mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
            ou cliquez pour parcourir (TXT, DOCX, ou collez le texte)
          </p>
        </div>
        {pdfError && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-medium animate-fade-in-up" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
            <Info size={14} weight="bold" />
            PDF reçu — copiez le texte de votre CV et collez-le dans la zone de saisie ci-dessous
          </div>
        )}
        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[12px] transition-all duration-200 active:scale-95"
          style={{ background: "var(--prsto-forest)", color: "white" }}
        >
          <Upload size={14} weight="bold" />
          Choisir un fichier
          <input type="file" accept=".txt,.md,.docx" onChange={handleFile} className="hidden" />
        </label>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}>
      <div
        className={`max-w-[82%] rounded-2xl p-4 ${
          isUser
            ? "bg-prsto-forest text-white rounded-br-md"
            : "bg-fond-widget border border-bordure/50 text-texte rounded-bl-md"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-lg bg-or flex items-center justify-center text-[10px] font-bold text-prsto-forest">
              P
            </span>
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--or)" }}>
              PRSTO
            </span>
          </div>
        )}
        <div className="text-[13px] leading-[1.65] whitespace-pre-wrap">
          {message.content}
        </div>
        {message.jobs && message.jobs.length > 0 && (
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center gap-1.5 pt-3 border-t border-bordure/30">
              <Star size={11} weight="fill" className="text-or" />
              <span className="text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: "var(--texte-tertiaire)" }}>
                Offres trouvées ({message.jobs.length})
              </span>
            </div>
            {message.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Trouve-moi un poste de CTO", icon: Briefcase },
  { label: "Analyse mon CV", icon: FileText },
  { label: "Prépare un entretien", icon: Megaphone },
  { label: "Offres dans la fintech", icon: Sparkle },
];

export default function AssistantRecherchePage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [showUpload, setShowUpload] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ text: string; name: string } | null>(null);
  const [pasteText, setPasteText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleFile = useCallback((text: string, name: string) => {
    setUploadedFile({ text, name });
  }, []);

  const startChat = useCallback(async (initialText: string) => {
    setShowUpload(false);
    const userMsg: AssistantMessage = { role: "user", content: initialText };
    setMessages([userMsg]);
    setIsLoading(true);
    try {
      const response = await sendAssistantMessage([userMsg]);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
    }
    setIsLoading(false);
  }, []);

  const handleSend = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || isLoading) return;
    setShowUpload(false);
    const userMsg: AssistantMessage = { role: "user", content: cleanText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    try {
      const response = await sendAssistantMessage(updated);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) handleSend(input);
    }
  };

  const hasStarted = messages.length > 0 || !showUpload;

  return (
    <div className="h-full flex flex-col bg-fond">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 min-h-full flex flex-col">

          {/* ── Upload Zone (première visite) ── */}
          {showUpload && messages.length === 0 && (
            <div className="flex-1 flex flex-col justify-center">
              <div className="max-w-xl mx-auto w-full text-center mb-8">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-wider mb-6"
                  style={{ background: "var(--or-faible)", color: "var(--or)" }}
                >
                  <Sparkle size={12} weight="fill" /> COPILOTE CARRIÈRE IA
                </div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--texte)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  Parlez-moi de votre recherche
                </h1>
                <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: "var(--texte-tertiaire)" }}>
                  Collez votre CV ou décrivez le poste que vous recherchez — je cherche les meilleures opportunités.
                </p>
              </div>

              <UploadZone onFile={handleFile} />

              <div className="mt-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="flex-1 h-px bg-bordure" />
                  <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--texte-tertiaire)" }}>ou collez votre CV</span>
                  <span className="flex-1 h-px bg-bordure" />
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Copiez le texte de votre CV (PDF/DOCX) et collez-le ici..."
                  rows={5}
                  className="w-full rounded-2xl border border-bordure bg-fond-widget px-4 py-3.5 text-[13px] text-texte placeholder-texte-tertiaire caret-or leading-relaxed resize-none outline-none transition-all duration-200 focus:border-or focus:shadow-[0_0_0_3px_var(--or-faible)]"
                />
                {pasteText.trim().length > 20 && (
                  <button
                    onClick={() => {
                      const clean = pasteText.replace(/[\x00-\x08\x0E-\x1F]/g, "").slice(0, 8000);
                      startChat(`Voici mon CV :\n\n${clean}\n\nAnalyse mon profil et trouve-moi des offres adaptées.`);
                      setPasteText("");
                    }}
                    disabled={isLoading}
                    className="mt-2.5 w-full py-3 rounded-xl text-[12px] font-semibold bg-or text-prsto-forest hover:opacity-80 transition-all active:scale-95 disabled:opacity-40"
                  >
                    {isLoading ? "Analyse en cours..." : "Analyser mon CV"}
                  </button>
                )}
              </div>

              {uploadedFile && (
                <div className="mt-4 animate-fade-in-up">
                  <div
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-or/20"
                    style={{ background: "var(--or-faible)" }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-prsto-forest flex items-center justify-center flex-shrink-0">
                      <FileText size={16} weight="bold" className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-texte truncate">{uploadedFile.name}</div>
                      <div className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
                        {uploadedFile.text.length} caractères — prêt à analyser
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const clean = uploadedFile.text.replace(/[\x00-\x08\x0E-\x1F]/g, "").slice(0, 8000);
                        startChat(`Voici mon CV :\n\n${clean}\n\nAnalyse mon profil et trouve-moi des offres adaptées.`);
                      }}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl text-[11px] font-semibold bg-or text-prsto-forest hover:opacity-80 transition-all active:scale-95 disabled:opacity-40"
                    >
                      Analyser
                    </button>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="p-1.5 rounded-lg hover:bg-bordure/30 transition-colors"
                    >
                      <X size={14} style={{ color: "var(--texte-tertiaire)" }} />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-center mb-3" style={{ color: "var(--texte-tertiaire)" }}>
                  Ou essayez une suggestion
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => {
                          setShowUpload(false);
                          handleSend(action.label);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-bordure bg-fond-widget hover:border-or/30 hover:bg-or/5 transition-all duration-200 text-[12px] font-medium text-texte"
                      >
                        <Icon size={14} className="text-or" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Messages ── */}
          {!showUpload && (
            <div className="space-y-4 pt-2">
              {messages.length === 0 && !isLoading && (
                <div className="flex-1 flex items-center justify-center py-16">
                  <div className="text-center">
                    <Code size={32} className="text-bordure mx-auto mb-3" />
                    <p className="text-sm font-medium text-texte">Que puis-je faire pour vous ?</p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--texte-tertiaire)" }}>
                      Recherche d'emploi, analyse de CV, préparation d'entretien
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in-up">
                  <div className="max-w-[82%] rounded-2xl rounded-bl-md p-4 bg-fond-widget border border-bordure/50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-lg bg-or flex items-center justify-center text-[10px] font-bold text-prsto-forest">P</span>
                      <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--or)" }}>PRSTO</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-or animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-or/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-or/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-[11px]" style={{ color: "var(--texte-tertiaire)" }}>
                        Recherche en cours...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Input ── */}
      {!showUpload && (
        <div className="flex-shrink-0 border-t border-bordure bg-fond-surface/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5">
            <div className="flex items-end gap-2 rounded-2xl border border-bordure bg-fond-widget px-4 py-3 transition-all duration-200 focus-within:border-or focus-within:shadow-[0_0_0_3px_var(--or-faible)]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-texte placeholder-texte-tertiaire caret-or leading-relaxed min-h-[22px] max-h-[120px]"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "22px";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
              />
              <button
                onClick={() => input.trim() && handleSend(input)}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-or hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <PaperPlaneTilt size={14} color="#000" weight="bold" />
              </button>
            </div>
            <p className="text-[8.5px] text-center mt-2" style={{ color: "var(--texte-tertiaire)" }}>
              PRSTO utilise l'IA pour analyser votre recherche. Les résultats proviennent de votre base d'offres personnelle.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
