"use client";

import { ClipboardPaste, Download, ExternalLink, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ExtensionGuidePage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 className="text-lg font-bold mb-2" style={{ color: "var(--texte)" }}>
        <Download size={20} className="inline mr-2" style={{ color: "var(--or)" }} />
        Extension Chrome PRSTO Importer
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--texte-secondaire)" }}>
        Importez une annonce en un clic depuis votre navigateur. Aucune candidature automatique.
      </p>

      {/* Plateformes supportes */}
      <div className="p-4 rounded-lg border mb-6" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--texte)" }}>
          <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
          Plateformes supportes
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>
          <span>LinkedIn Jobs</span>
          <span>Indeed / Indeed FR</span>
          <span>APEC</span>
          <span>Cadremploi</span>
          <span>HelloWork</span>
          <span>Welcome to the Jungle</span>
          <span>Pages carrire gnriques</span>
        </div>
      </div>

      {/* Installation */}
      <div className="p-4 rounded-lg border mb-6" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--texte)" }}>
          <Download size={14} style={{ color: "var(--or)" }} />
          Installation (mode dveloppeur)
        </h2>
        <ol className="text-xs space-y-2" style={{ color: "var(--texte-secondaire)" }}>
          <li>1. Ouvrez Chrome et allez  <code style={{ background: "var(--fond)", padding: "1px 4px", borderRadius: 3 }}>chrome://extensions</code></li>
          <li>2. Activez le <strong>Mode dveloppeur</strong> (coin suprieur droit)</li>
          <li>3. Cliquez sur <strong>Charger l&apos;extension non empaquete</strong></li>
          <li>4. Slectionnez le dossier <code style={{ background: "var(--fond)", padding: "1px 4px", borderRadius: 3 }}>browser-extension/elton-os-importer</code> dans le projet PRSTO</li>
          <li>5. L&apos;extension apparat dans la barre d&apos;outils Chrome </li>
        </ol>
      </div>

      {/* Utilisation */}
      <div className="p-4 rounded-lg border mb-6" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--texte)" }}>
          <ClipboardPaste size={14} style={{ color: "var(--or)" }} />
          Comment utiliser
        </h2>
        <ol className="text-xs space-y-2" style={{ color: "var(--texte-secondaire)" }}>
          <li>1. Ouvrez une annonce sur LinkedIn, Indeed, APEC, etc.</li>
          <li>2. Cliquez sur l&apos;icne PRSTO dans la barre d&apos;outils Chrome</li>
          <li>3. Configurez l&apos;URL de votre instance PRSTO (par dfaut: http://localhost:3000)</li>
          <li>4. Cliquez sur <strong>Analyser cette annonce</strong></li>
          <li>5. Vrifiez l&apos;aperu (titre, entreprise, lieu)</li>
          <li>6. Cliquez sur <strong>Envoyer vers PRSTO</strong></li>
          <li>7. L&apos;offre apparat dans votre Sourcing</li>
        </ol>
      </div>

      {/* Scurit */}
      <div className="p-4 rounded-lg border mb-6" style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.05)" }}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#22c55e" }}>
          <Shield size={14} />
          Scurit et conformit
        </h2>
        <ul className="text-xs space-y-1" style={{ color: "var(--texte-secondaire)" }}>
          <li>Aucune candidature automatique</li>
          <li>Aucun clic sur Postuler / Apply / Submit</li>
          <li>Aucun scraping massif ni parcours automatique</li>
          <li>Aucun contournement CAPTCHA ou login</li>
          <li>Aucune lecture de cookies, tokens, messages privs</li>
          <li>Lecture du contenu visible uniquement</li>
          <li>Action utilisateur obligatoire chaque tape</li>
          <li>Validation dans PRSTO obligatoire avant cration</li>
        </ul>
      </div>

      {/* Liens */}
      <div className="flex gap-3">
        <Link href="/dashboard/jobs/importer"
          className="px-4 py-2 rounded-md text-xs font-mono border"
          style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
          Import Express
        </Link>
        <Link href="/dashboard/jobs"
          className="px-4 py-2 rounded-md text-xs font-mono border"
          style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", textDecoration: "none" }}>
          Voir mes offres
        </Link>
      </div>

      {/* README link */}
      <div className="mt-6 p-3 rounded-lg border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
        <ExternalLink size={10} className="inline mr-1" style={{ color: "var(--texte-tertiaire)" }} />
        <a href="https://github.com/elton-os/job-project/blob/main/browser-extension/elton-os-importer/README.md" target="_blank" rel="noopener"
          style={{ color: "var(--texte-tertiaire)" }}>
          Documentation complte (GitHub)
        </a>
      </div>
    </div>
  );
}
