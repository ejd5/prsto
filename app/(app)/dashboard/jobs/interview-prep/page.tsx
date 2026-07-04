"use client";

import { useState, useEffect } from "react";
import { Loader2, Briefcase, Building2, Calendar, Clock, ChevronRight, CheckCircle2, Archive } from "lucide-react";
import Link from "next/link";

interface PrepItem {
  id: string; roleTitle?: string; companyName?: string; interviewStage: string;
  interviewDate?: string; prepStatus: string; createdAt: string;
  job?: { title?: string; company?: string };
  contact?: { id: string; fullName: string };
}

export default function InterviewPrepListPage() {
  const [preps, setPreps] = useState<PrepItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/interview-prep");
    const d = await r.json();
    setPreps(d.preps || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const stageLabel: Record<string,string> = {recruiter_screen:"Écran RH",hiring_manager:"Manager",case_study:"Case Study",panel:"Panel",final:"Final",offer_negotiation:"Offre",unknown:"Entretien"};
  const statusLabel: Record<string,{label:string;color:string}> = {draft:{label:"Brouillon",color:"#808080"},ready_to_review:{label:"Prêt",color:"#f59e0b"},approved:{label:"Approuvé",color:"#22c55e"},archived:{label:"Archivé",color:"#808080"}};

  return (
    <div style={{maxWidth:900,margin:"0 auto"}}>
      <h1 className="text-lg font-bold mb-4" style={{color:"var(--texte)"}}>
        <Briefcase size={20} className="inline mr-2" style={{color:"var(--or)"}} />
        Préparations Entretien
      </h1>
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 size={20} className="animate-spin" style={{color:"var(--or)"}} /></div>
      ) : preps.length === 0 ? (
        <div className="p-8 text-center rounded-lg border border-dashed" style={{borderColor:"var(--bordure-douce)"}}>
          <p className="text-sm" style={{color:"var(--texte-secondaire)"}}>Aucune préparation d&apos;entretien.</p>
          <p className="text-xs mt-1" style={{color:"var(--texte-tertiaire)"}}>Créez-en une depuis une candidature.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {preps.map(p => {
            const st = statusLabel[p.prepStatus] || statusLabel.draft;
            return (
              <Link key={p.id} href={`/dashboard/jobs/interview-prep/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg border transition-colors hover:opacity-80"
                style={{borderColor:"var(--bordure-douce)",background:"var(--fond-surface)",textDecoration:"none"}}>
                <div>
                  <p className="text-sm font-bold" style={{color:"var(--texte)"}}>{p.roleTitle || p.job?.title || "Préparation"}</p>
                  <p className="text-xs" style={{color:"var(--texte-secondaire)"}}>{p.companyName || p.job?.company || "—"}</p>
                  {p.contact && <p className="text-[10px] mt-0.5" style={{color:"var(--texte-tertiaire)"}}>Contact : {p.contact.fullName}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{background:"var(--fond)",color:"var(--texte-tertiaire)"}}>{stageLabel[p.interviewStage]}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{background:`${st.color}15`,color:st.color}}>{st.label}</span>
                  {p.interviewDate && <span className="text-[10px] font-mono" style={{color:"var(--texte-tertiaire)"}}>{new Date(p.interviewDate).toLocaleDateString("fr-FR")}</span>}
                  <ChevronRight size={14} style={{color:"var(--texte-tertiaire)"}} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
