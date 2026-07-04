"use client";

import Reveal from "../Reveal";
import ImgSlot from "../ImgSlot";
import { PrstoLogo } from "../PrstoLogo";
import Link from "next/link";
import { Check, X, Star } from "lucide-react";

export function RecruitersBrandModel() {
  return (
    <section id="modele-marque" className="py-28" style={{ background: "#FAF6EF" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(228,177,24,0.2)", color: "#A38010",
            background: "rgba(228,177,24,0.06)",
          }}>
            ✦ Modèle de marque
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Pas une franchise.<br />Une marque, pas de droits d&apos;entrée.
          </h2>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: "#6A8F6D" }}>
            PRSTO n&apos;est pas une franchise. Pas de droit d&apos;entrée. Pas de royalties sur vos placements. Pas de territoire imposé. Vous choisissez votre formule, vous utilisez la marque si vous le souhaitez, vous restez libre.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {/* Utilisateur simple */}
          <Reveal variant="up" delay={50}>
            <div className="rounded-2xl border p-6 h-full flex flex-col" style={{
              borderColor: "rgba(16,56,38,0.08)", background: "#FFFDF8",
            }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                  background: "rgba(80,98,90,0.1)", color: "#50625A",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "#0B1F18" }}>
                    Utilisateur <PrstoLogo size={70} />
                  </h3>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6A8F6D" }}>Pour démarrer</p>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "#50625A" }}>
                Vous utilisez les outils PRSTO sous votre propre marque. Idéal pour les indépendants qui testent.
              </p>
              <ul className="space-y-2 text-sm flex-1">
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> Tous les outils de préparation
                </li>
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> Dashboard personnel
                </li>
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> Extension Chrome
                </li>
                <li className="flex items-start gap-2" style={{ color: "#9CA3AF" }}>
                  <X size={14} className="mt-0.5 flex-shrink-0" /> Badge Partenaire
                </li>
                <li className="flex items-start gap-2" style={{ color: "#9CA3AF" }}>
                  <X size={14} className="mt-0.5 flex-shrink-0" /> Co-branding documents
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t" style={{ borderColor: "rgba(16,56,38,0.05)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#6A8F6D" }}>À partir de</p>
                <p className="text-2xl font-extrabold" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>99$<span className="text-xs font-normal" style={{ color: "#6A8F6D" }}>/mois</span></p>
              </div>
            </div>
          </Reveal>

          {/* Partenaire PRSTO ★ */}
          <Reveal variant="up" delay={120}>
            <div className="relative rounded-2xl border-2 p-6 h-full flex flex-col" style={{
              borderColor: "rgba(228,177,24,0.4)", background: "rgba(228,177,24,0.04)",
              boxShadow: "0 20px 60px rgba(228,177,24,0.1)",
            }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider" style={{
                background: "#E4B118", color: "#082E1E",
              }}>
                ★ POPULAIRE
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                  background: "rgba(228,177,24,0.15)", color: "#A38010",
                }}>
                  <Star size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "#0B1F18" }}>
                    Partenaire <PrstoLogo size={70} />
                  </h3>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#A38010" }}>Recommandé</p>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "#50625A" }}>
                Vous utilisez les outils PRSTO + la marque PRSTO en co-branding. Le statut qui crédibilise.
              </p>
              <ul className="space-y-2 text-sm flex-1">
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> Tout Utilisateur inclus
                </li>
                <li className="flex items-start gap-2 font-semibold" style={{ color: "#0B1F18" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#A38010" }} /> Badge "Partenaire PRSTO"
                </li>
                <li className="flex items-start gap-2 font-semibold" style={{ color: "#0B1F18" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#A38010" }} /> Logo PRSTO sur vos supports
                </li>
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> Co-branding documents
                </li>
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> Page dédiée sur prsto.io
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t" style={{ borderColor: "rgba(228,177,24,0.15)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#A38010" }}>Inclus dès</p>
                <p className="text-2xl font-extrabold" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>199$<span className="text-xs font-normal" style={{ color: "#6A8F6D" }}>/mois</span></p>
              </div>
            </div>
          </Reveal>

          {/* Marque blanche */}
          <Reveal variant="up" delay={200}>
            <div className="rounded-2xl border p-6 h-full flex flex-col" style={{
              borderColor: "rgba(16,56,38,0.08)", background: "#FFFDF8",
            }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                  background: "rgba(16,56,38,0.08)", color: "#103826",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M3 7v14M21 11v10M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: "#0B1F18" }}>Marque blanche</h3>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6A8F6D" }}>Sur devis</p>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "#50625A" }}>
                Vous internalisez PRSTO sous votre propre marque. Pour les grands cabinets et réseaux.
              </p>
              <ul className="space-y-2 text-sm flex-1">
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> Tout Partenaire inclus
                </li>
                <li className="flex items-start gap-2 font-semibold" style={{ color: "#0B1F18" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#A38010" }} /> 100% sous votre marque
                </li>
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> Sans logo PRSTO visible
                </li>
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> Account manager dédié
                </li>
                <li className="flex items-start gap-2" style={{ color: "#50625A" }}>
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#103826" }} /> API & intégrations
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t" style={{ borderColor: "rgba(16,56,38,0.05)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#6A8F6D" }}>Sur devis</p>
                <p className="text-2xl font-extrabold" style={{ color: "#0B1F18", fontFamily: "Playfair Display, serif" }}>500+<span className="text-xs font-normal" style={{ color: "#6A8F6D" }}>/mois</span></p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Tableau comparatif Franchise vs Licence de marque */}
        <Reveal variant="up" delay={300}>
          <div className="rounded-2xl border overflow-hidden" style={{
            borderColor: "rgba(16,56,38,0.08)", background: "#FFFDF8",
          }}>
            <div className="p-6 border-b" style={{ borderColor: "rgba(16,56,38,0.05)" }}>
              <h3 className="text-base font-bold mb-1 flex items-center gap-2 flex-wrap" style={{ color: "#0B1F18" }}>
                <PrstoLogo size={70} style={{ verticalAlign: "middle" }} />
                <span>vs Franchise classique : la différence</span>
              </h3>
              <p className="text-xs" style={{ color: "#6A8F6D" }}>
                Pourquoi les recruteurs choisissent le modèle licence plutôt que franchise.
              </p>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(16,56,38,0.02)" }}>
                  <th className="text-left p-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6A8F6D" }}>Critère</th>
                  <th className="text-center p-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#b91c1c" }}>Franchise</th>
                  <th className="text-center p-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#A38010" }}>
                    <div className="flex flex-col items-center gap-1.5">
                      <span>Licence</span>
                      <PrstoLogo size={85} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 text-sm font-semibold" style={{ color: "#0B1F18" }}>Droit d&apos;entrée</td>
                  <td className="p-4 text-center text-sm" style={{ color: "#b91c1c" }}>10 000 à 50 000€</td>
                  <td className="p-4 text-center text-sm font-bold" style={{ color: "#A38010" }}>0€</td>
                </tr>
                <tr style={{ background: "rgba(16,56,38,0.01)" }}>
                  <td className="p-4 text-sm font-semibold" style={{ color: "#0B1F18" }}>Royalties sur CA</td>
                  <td className="p-4 text-center text-sm" style={{ color: "#b91c1c" }}>5 à 10%</td>
                  <td className="p-4 text-center text-sm font-bold" style={{ color: "#A38010" }}>0%</td>
                </tr>
                <tr>
                  <td className="p-4 text-sm font-semibold" style={{ color: "#0B1F18" }}>Engagement minimum</td>
                  <td className="p-4 text-center text-sm" style={{ color: "#b91c1c" }}>3 à 5 ans</td>
                  <td className="p-4 text-center text-sm font-bold" style={{ color: "#A38010" }}>Mensuel, sans engagement</td>
                </tr>
                <tr style={{ background: "rgba(16,56,38,0.01)" }}>
                  <td className="p-4 text-sm font-semibold" style={{ color: "#0B1F18" }}>Territoire exclusif</td>
                  <td className="p-4 text-center text-sm" style={{ color: "#b91c1c" }}>Imposé</td>
                  <td className="p-4 text-center text-sm font-bold" style={{ color: "#A38010" }}>Aucun, libre</td>
                </tr>
                <tr>
                  <td className="p-4 text-sm font-semibold" style={{ color: "#0B1F18" }}>Coût caché total</td>
                  <td className="p-4 text-center text-sm" style={{ color: "#b91c1c" }}>~30 000€+ la 1ère année</td>
                  <td className="p-4 text-center text-sm font-bold" style={{ color: "#A38010" }}>0€, juste 99-349$/mois</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal variant="up" delay={400} className="mt-10 text-center">
          <p className="text-sm mb-4" style={{ color: "#50625A" }}>
            Le statut Partenaire est gratuit pour les abonnés Elite. Il suffit de signer la charte de marque.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/recruiter/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5" style={{
              background: "#E4B118", color: "#082E1E", textDecoration: "none",
              boxShadow: "0 4px 16px rgba(228,177,24,0.25)",
            }}>
              Devenir Partenaire →
            </Link>
            <Link href="/prsto/marque" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-all" style={{
              borderColor: "rgba(16,56,38,0.15)", color: "#50625A", textDecoration: "none",
            }}>
              Découvrir la marque
            </Link>
            <a href="#faq" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium" style={{
              color: "#6A8F6D", textDecoration: "none",
            }}>
              Lire la FAQ
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
