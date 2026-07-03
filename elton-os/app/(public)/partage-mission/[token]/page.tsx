"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Briefcase, Building2, Loader2, Ban } from "lucide-react";

interface SharedData {
  mission: {
    id: string; title: string; location: string | null; contractType: string | null;
    salary: string | null; description: string | null; status: string;
    client: { id: string; company: string };
    candidates: Array<{
      id: string; status: string; proposedAt: string;
      candidate: { id: string; name: string; cvOptimized: string | null };
    }>;
  };
}

const STAGE_COLORS: Record<string, string> = {
  propose: "#3b82f6", entretien: "#8b5cf6", offre: "#f59e0b",
  place: "#22c55e", refuse: "#ef4444", abandon: "#6b7280",
};

export default function PartageMissionPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/mission/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d.data);
        else setError("Lien invalide ou expiré");
        setLoading(false);
      })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#FAF6EF" }}>
      <Loader2 size={32} className="animate-spin" style={{ color: "#E4B118" }} />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#FAF6EF" }}>
      <div className="text-center p-8">
        <Ban size={48} className="mx-auto mb-4" style={{ color: "#6A8F6D", opacity: 0.4 }} />
        <p className="text-sm font-semibold" style={{ color: "#103826" }}>{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { mission } = data;

  const stageLabels: Record<string, string> = {
    propose: "Proposé", entretien: "Entretien", offre: "Offre",
    place: "Placé", refuse: "Refusé", abandon: "Abandon",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6EF", padding: "32px 16px" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>
            PRSTO Recruteur
          </h1>
          <p className="text-xs mt-1" style={{ color: "#6A8F6D" }}>
            Portail de suivi candidatures
          </p>
        </div>

        <div className="rounded-xl border p-6 mb-6" style={{ borderColor: "#E4B11830", background: "white" }}>
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} style={{ color: "#0B1F18" }} />
            <span style={{ color: "#0B1F18", fontWeight: 600, fontSize: 14 }}>{mission.client.company}</span>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#0B1F18" }}>{mission.title}</h2>
          <div className="flex gap-3 text-xs flex-wrap" style={{ color: "#6A8F6D" }}>
            {mission.location && <span>{mission.location}</span>}
            {mission.contractType && <span>{mission.contractType}</span>}
            {mission.salary && <span>{mission.salary}</span>}
          </div>
          {mission.description && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#555", whiteSpace: "pre-wrap" }}>{mission.description}</p>
          )}
        </div>

        <h3 className="text-base font-bold mb-4" style={{ color: "#0B1F18" }}>
          Candidats proposés ({mission.candidates.length})
        </h3>

        {mission.candidates.length === 0 ? (
          <div className="text-center py-12 rounded-xl border" style={{ borderColor: "#E4B11820", background: "white" }}>
            <Briefcase size={28} className="mx-auto mb-3" style={{ color: "#6A8F6D", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "#6A8F6D" }}>Aucun candidat proposé pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mission.candidates.map(entry => (
              <div key={entry.id} className="rounded-xl border p-4"
                style={{ borderColor: "#E4B11820", background: "white" }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#0B1F18" }}>{entry.candidate.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#6A8F6D" }}>
                      Proposé le {new Date(entry.proposedAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{
                    background: `${STAGE_COLORS[entry.status] || "#888"}15`,
                    color: STAGE_COLORS[entry.status] || "#888",
                  }}>
                    {stageLabels[entry.status] || entry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8 text-xs" style={{ color: "#6A8F6D", opacity: 0.5 }}>
          Propulsé par <strong style={{ color: "#0B1F18" }}>PRSTO</strong>
        </div>
      </div>
    </div>
  );
}
