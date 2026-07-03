"use client";

import { useState, useEffect, use } from "react";
import { Loader2, ArrowLeft, Copy, CheckCircle2, Briefcase, Building2, Calendar, MessageSquare, Target, Lightbulb, AlertTriangle, FileText, Clock, DollarSign, Mail } from "lucide-react";
import Link from "next/link";

interface Prep {
  id: string; roleTitle?: string; companyName?: string; interviewStage: string; interviewDate?: string; prepStatus: string;
  candidatePitchShort?: string; candidatePitchLong?: string; companyBrief?: string;
  likelyQuestionsJson?: string; starAnswersJson?: string; objectionsJson?: string;
  questionsToAskJson?: string; thirtySixtyNinetyPlan?: string; compensationStrategy?: string;
  followUpEmail?: string; notes?: string; createdAt: string;
  applicationDraft?: { id: string; jobId: string }; job?: { id: string; title: string; company?: string };
  contact?: { id: string; fullName: string };
}

export default function InterviewPrepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prep, setPrep] = useState<Prep | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch(`/api/interview-prep/${id}`).then(r => r.json()).then(d => {
      setPrep(d.prep || null); setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]); // eslint-disable-line

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(""), 1500);
    });
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 size={20} className="animate-spin" style={{color:"var(--or)"}} /></div>;
  if (!prep) return <div className="p-6 text-center" style={{color:"var(--erreur)"}}>Préparation introuvable.</div>;

  const stageLabel: Record<string,string> = {recruiter_screen:"Écran RH",hiring_manager:"Manager",case_study:"Case Study",panel:"Panel",final:"Final",offer_negotiation:"Offre",unknown:"Entretien"};
  const questions = safeParse(prep.likelyQuestionsJson) as { question: string; category?: string }[];
  const starAnswers = safeParse(prep.starAnswersJson) as { situation: string; task: string; action: string; result: string }[];
  const objections = safeParse(prep.objectionsJson) as { objection: string; response: string }[];
  const questionsToAsk = safeParse(prep.questionsToAskJson) as unknown as string[];

  return (
    <div style={{maxWidth:850,margin:"0 auto"}}>
      <Link href="/dashboard/jobs/interview-prep" className="flex items-center gap-1 text-xs font-mono mb-4" style={{color:"var(--texte-tertiaire)",textDecoration:"none"}}>
        <ArrowLeft size={12} /> Préparations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold" style={{color:"var(--texte)"}}>{prep.roleTitle || prep.job?.title || "Préparation entretien"}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{color:"var(--texte-secondaire)"}}>
              <Building2 size={10} className="inline mr-0.5" /> {prep.companyName || prep.job?.company || "—"}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{background:"var(--fond)",color:"var(--texte-tertiaire)"}}>{stageLabel[prep.interviewStage]}</span>
            {prep.contact && <span className="text-[10px]" style={{color:"var(--texte-tertiaire)"}}>📞 {prep.contact.fullName}</span>}
          </div>
        </div>
        {prep.applicationDraft && (
          <Link href={`/dashboard/jobs/applications/${prep.applicationDraft.id}`}
            className="px-2 py-1 rounded text-[10px] font-mono border" style={{borderColor:"var(--or)",color:"var(--or)",textDecoration:"none"}}>
            Voir dossier
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {/* Pitch 30 sec */}
        {prep.candidatePitchShort && (
          <Section icon={<Clock size={11} />} title="Pitch 30 secondes" onCopy={() => copy(prep.candidatePitchShort!, "pitch30")} copied={copied === "pitch30"}>
            <p className="text-xs leading-relaxed" style={{color:"var(--texte)"}}>{prep.candidatePitchShort}</p>
          </Section>
        )}

        {/* Pitch 2 min */}
        {prep.candidatePitchLong && (
          <Section icon={<MessageSquare size={11} />} title="Pitch 2 minutes" onCopy={() => copy(prep.candidatePitchLong!, "pitch2m")} copied={copied === "pitch2m"}>
            <p className="text-xs leading-relaxed" style={{color:"var(--texte)"}}>{prep.candidatePitchLong}</p>
          </Section>
        )}

        {/* Company brief */}
        {prep.companyBrief && (
          <Section icon={<Building2 size={11} />} title="Entreprise" onCopy={() => copy(prep.companyBrief!, "company")} copied={copied === "company"}>
            <p className="text-xs leading-relaxed" style={{color:"var(--texte-secondaire)"}}>{prep.companyBrief}</p>
          </Section>
        )}

        {/* Likely questions */}
        {questions.length > 0 && (
          <Section icon={<MessageSquare size={11} />} title={`Questions probables (${questions.length})`} onCopy={() => {}} copied={""}>
            <div className="space-y-2">
              {questions.map((q: {question:string;category?:string}, i: number) => (
                <div key={i} className="p-2 rounded border text-xs" style={{borderColor:"var(--bordure-douce)",background:"var(--fond)"}}>
                  <span className="font-bold" style={{color:"var(--texte)"}}>{i+1}. {q.question}</span>
                  {q.category && <span className="ml-2 text-[10px] font-mono px-1 rounded" style={{background:"var(--fond-eleve)",color:"var(--texte-tertiaire)"}}>{q.category}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* STAR Answers */}
        {starAnswers.length > 0 && (
          <Section icon={<Target size={11} />} title={`Réponses STAR (${starAnswers.length})`} onCopy={() => copy(starAnswers.map((s: {situation:string;task:string;action:string;result:string}) => `S: ${s.situation}\nT: ${s.task}\nA: ${s.action}\nR: ${s.result}`).join("\n\n"), "star")} copied={copied === "star"}>
            <div className="space-y-2">
              {starAnswers.map((s: {situation:string;task:string;action:string;result:string}, i: number) => (
                <div key={i} className="p-2 rounded border text-xs" style={{borderColor:"var(--bordure-douce)",background:"var(--fond)"}}>
                  <p className="font-bold" style={{color:"var(--texte)"}}>Situation :</p><p className="mb-1" style={{color:"var(--texte-secondaire)"}}>{s.situation}</p>
                  <p className="font-bold" style={{color:"var(--texte)"}}>Tâche :</p><p className="mb-1" style={{color:"var(--texte-secondaire)"}}>{s.task}</p>
                  <p className="font-bold" style={{color:"var(--texte)"}}>Action :</p><p className="mb-1" style={{color:"var(--texte-secondaire)"}}>{s.action}</p>
                  <p className="font-bold" style={{color:"var(--texte)"}}>Résultat :</p><p style={{color:"var(--texte-secondaire)"}}>{s.result}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Objections */}
        {objections.length > 0 && (
          <Section icon={<AlertTriangle size={11} />} title={`Objections probables (${objections.length})`} onCopy={() => {}} copied={""}>
            <div className="space-y-2">
              {objections.map((o: {objection:string;response:string}, i: number) => (
                <div key={i} className="p-2 rounded border text-xs" style={{borderColor:"var(--bordure-douce)",background:"var(--fond)"}}>
                  <p className="font-bold" style={{color:"#ef4444"}}>Objection : {o.objection}</p>
                  <p className="mt-0.5" style={{color:"var(--texte-secondaire)"}}>Réponse : {o.response}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Questions to ask */}
        {questionsToAsk.length > 0 && (
          <Section icon={<Lightbulb size={11} />} title={`Questions à poser (${questionsToAsk.length})`} onCopy={() => copy(questionsToAsk.map((q: string) => `• ${q}`).join("\n"), "ask")} copied={copied === "ask"}>
            <ul className="space-y-1 text-xs" style={{color:"var(--texte-secondaire)"}}>
              {questionsToAsk.map((q: string, i: number) => <li key={i} className="flex items-start gap-1"><span style={{color:"var(--or)"}}>•</span> {q}</li>)}
            </ul>
          </Section>
        )}

        {/* Plan 30/60/90 */}
        {prep.thirtySixtyNinetyPlan && (
          <Section icon={<Calendar size={11} />} title="Plan 30/60/90 jours" onCopy={() => copy(prep.thirtySixtyNinetyPlan!, "plan")} copied={copied === "plan"}>
            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" style={{color:"var(--texte)"}}>{prep.thirtySixtyNinetyPlan}</pre>
          </Section>
        )}

        {/* Compensation */}
        {prep.compensationStrategy && (
          <Section icon={<DollarSign size={11} />} title="Stratégie rémunération" onCopy={() => copy(prep.compensationStrategy!, "comp")} copied={copied === "comp"}>
            <p className="text-xs" style={{color:"var(--texte-secondaire)"}}>{prep.compensationStrategy}</p>
          </Section>
        )}

        {/* Follow-up email */}
        {prep.followUpEmail && (
          <Section icon={<Mail size={11} />} title="Email post-entretien" onCopy={() => copy(prep.followUpEmail!, "email")} copied={copied === "email"}>
            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" style={{color:"var(--texte)"}}>{prep.followUpEmail}</pre>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children, onCopy, copied }: { icon: React.ReactNode; title: string; children: React.ReactNode; onCopy: () => void; copied: boolean | string }) {
  return (
    <div className="p-3 rounded-lg border" style={{borderColor:"var(--bordure)",background:"var(--fond-surface)"}}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold flex items-center gap-1.5" style={{color:"var(--texte)"}}>{icon} {title}</h3>
        <button onClick={onCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border"
          style={{borderColor:copied?"#22c55e":"var(--bordure)",color:copied?"#22c55e":"var(--texte-tertiaire)"}}>
          {copied ? <CheckCircle2 size={9} /> : <Copy size={9} />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      {children}
    </div>
  );
}

function safeParse(v?: string | null): Record<string, unknown>[] {
  try { return v ? JSON.parse(v) : []; } catch { return []; }
}
