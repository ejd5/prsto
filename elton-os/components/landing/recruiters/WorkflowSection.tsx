"use client";

import Reveal from "../Reveal";
import ImgSlot from "../ImgSlot";
import { UserPlus, Upload, Sparkles, Send } from "lucide-react";

const STEPS = [
  { icon: UserPlus, title: "1. Ajoutez un candidat", desc: "Importez son CV ou connectez son profil LinkedIn. PRSTO analyse son profil en 5 secondes.", num: 14, prompt: "Écran 'Ajout candidat' — zone de drop CV, import LinkedIn, formulaire simple. Interface épurée.", promptLong: "Étape 1 Lancer une mission. Interface de création de mission PRSTO. Grand formulaire avec champs Titre du poste (ex: Motion Designer Senior) Localisation (Paris) Durée (3 semaines) Budget (3500-5000€) Description (textarea avec placeholder). Bouton Publier la mission en doré en bas. Barre latérale avec résumé et estimation de temps de matching 8 min. Fond #FAF6EF. Style formulaire premium épuré." },
  { icon: Upload, title: "2. Collez l'offre client", desc: "L'URL ou le texte de l'offre. PRSTO identifie les mots-clés, exigences et pièges ATS.", num: 15, prompt: "Écran 'Import offre' — champ URL/texte, analyse automatique, extraction mots-clés. Design propre.", promptLong: "Étape 2 Matching IA. Interface de résultats de matching PRSTO. 4 profils candidats en grille 2×2 chacun avec photo silhouette score de matching (96% 93% 88% 82%) en badge doré extrait du CV et bouton Contacter. En haut barre '8 min pour matcher 15 profils' avec progression en temps réel des secondes qui s'affichent 0min 32s. Fond #0B1F18. Style dashboard data élégant." },
  { icon: Sparkles, title: "3. Générez le dossier", desc: "CV adapté, lettre, analyse ATS, optimisation LinkedIn, brief entretien — tout est prêt en 8 minutes.", num: 16, prompt: "Écran 'Génération dossier' — spinner de progression, checklist des documents générés. Animation satisfaction.", promptLong: "Étape 3 Entretien Sourcing. Interface split-screen. À gauche le profil du candidat avec son CV formaté sa photo sa localisation et un badge En entretien. Au milieu un calendrier avec 3 créneaux proposés (Lun 14h Mer 10h Ven 16h) celui du milieu surligné en doré. À droite un aperçu appel vidéo avec un flou artistique silhouettes des participants. Fond #FFFDF8. Style calendrier premium with smooth design." },
  { icon: Send, title: "4. Envoyez au client", desc: "Partagez le dossier complet via un lien privé. Votre candidat arrive préparé, vous gagnez du temps.", num: 17, prompt: "Écran 'Partage dossier' — lien privé généré, options d'envoi email/liens. Interface de partage.", promptLong: "Étape 4 Suivi Feedback. Interface post-mission PRSTO. En haut score satisfaction 4,8/5 avec étoiles dorées. En dessous 3 feedbacks récents avec photo silhouette nom et commentaire court. Barre 'Mission terminée' avec bilan temps gagné 6h vs méthode traditionnelle. Bouton Proposer un nouveau contrat discret en bas. Fond #0B1F18. Carte feedback sur fond #FFFDF8 avec bordure légère. Style NPS review system." },
];

export function WorkflowSection() {
  return (
    <section className="py-28" style={{ background: "rgba(106,143,109,0.03)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Comment ça marche
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Votre workflow en 4 étapes
          </h2>
        </Reveal>

        <div className="space-y-8 mb-12">
          {STEPS.map((s, i) => (
            <Reveal variant={i % 2 === 0 ? "right" : "left"} delay={i * 80} key={s.title}>
              <div className="md:grid md:grid-cols-2 gap-6 md:gap-10 items-center">
                {i % 2 === 0 ? (
                  <>
                    <div className="order-2 md:order-1">
                      <ImgSlot num={s.num} format="wide" prompt={s.prompt} promptLong={s.promptLong} />
                    </div>
                    <div className="order-1 md:order-2 mb-4 md:mb-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{
                        background: "rgba(16,56,38,0.06)", border: "1px solid rgba(16,56,38,0.1)",
                      }}>
                        <s.icon size={24} style={{ color: "#103826" }} />
                      </div>
                      <h3 className="text-base font-bold mb-2" style={{ color: "#0B1F18" }}>{s.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{s.desc}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4 md:mb-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{
                        background: "rgba(16,56,38,0.06)", border: "1px solid rgba(16,56,38,0.1)",
                      }}>
                        <s.icon size={24} style={{ color: "#103826" }} />
                      </div>
                      <h3 className="text-base font-bold mb-2" style={{ color: "#0B1F18" }}>{s.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{s.desc}</p>
                    </div>
                    <div>
                      <ImgSlot num={s.num} format="wide" prompt={s.prompt} promptLong={s.promptLong} />
                    </div>
                  </>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" delay={350}>
          <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-2xl text-center" style={{
            background: "rgba(16,56,38,0.02)", border: "1px solid rgba(16,56,38,0.08)",
          }}>
            <div className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>
              <span style={{ color: "#E4B118" }}>3h de travail manuel</span> par candidat
            </div>
            <div className="text-lg font-medium mb-2" style={{ color: "#6A8F6D" }}>
              deviennent <strong style={{ color: "#103826" }}>8 minutes</strong> avec PRSTO
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
