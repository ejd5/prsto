"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface SsoProvider {
  id: string;
  label: string;
  href: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Vous avez refusé l'accès. Réessayez quand vous voulez.",
  missing_params: "Paramètres OAuth manquants. Veuillez réessayer.",
  invalid_state: "Session expirée ou invalide. Veuillez réessayer.",
  email_not_verified: "Votre email Google n'est pas vérifié.",
  no_email: "Aucun email récupéré depuis le fournisseur SSO.",
  exchange_failed: "Échec de l'échange OAuth. Vérifiez la configuration ou réessayez.",
};

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [ssoProviders, setSsoProviders] = useState<SsoProvider[]>([]);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  // Pick up SSO callback error if present in URL
  useEffect(() => {
    const errCode = searchParams.get("error");
    if (errCode) {
      setError(ERROR_MESSAGES[errCode] || `Erreur SSO: ${errCode}`);
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/setup").then((r) => r.json()),
      fetch("/api/auth/sso-status").then((r) => r.json()).catch(() => ({ providers: [] })),
    ])
      .then(([setupData, ssoData]) => {
        setNeedsSetup(setupData.needsSetup);
        setSsoProviders(ssoData.providers || []);
      })
      .catch(() => {
        setNeedsSetup(false);
        setSsoProviders([]);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleSso = (provider: SsoProvider) => {
    setSsoLoading(provider.id);
    window.location.href = provider.href;
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--fond)" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--prsto-ivory)" }}>
      <div
        className="w-full max-w-sm rounded-[var(--rayon-xl)] p-8 shadow-sm"
        style={{
          background: "#FFFFFF",
          border: "1px solid #F3F4F6",
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/branding/logo-prsto.png"
            alt="PRSTO"
            width={200}
            height={64}
            style={{ objectFit: "contain" }}
            className="mb-4"
            priority
          />
          <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
            {needsSetup ? "Créez votre compte administrateur" : "Boardroom AI Copilot"}
          </p>
        </div>

        {/* SSO buttons — only shown if at least one provider is configured */}
        {ssoProviders.length > 0 && (
          <div className="space-y-2 mb-4">
            {ssoProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleSso(provider)}
                disabled={ssoLoading !== null}
                className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  color: "var(--texte)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
              >
                {ssoLoading === provider.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {provider.id === "google" ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                        <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                      </svg>
                    )}
                    Continuer avec {provider.label}
                  </>
                )}
              </button>
            ))}

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
              <span className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                OU
              </span>
              <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
            </div>
          </div>
        )}

        <form onSubmit={needsSetup ? handleSetup : handleLogin} className="space-y-4">
          {needsSetup && (
            <div>
              <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--texte-secondaire)" }}>
                Nom
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)", caretColor: "var(--prsto-forest)" }}
                onFocus={(e) => { e.target.style.borderColor = "var(--prsto-forest)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; }}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--texte-secondaire)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)", caretColor: "var(--prsto-forest)" }}
              onFocus={(e) => { e.target.style.borderColor = "var(--prsto-forest)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--texte-secondaire)" }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)", caretColor: "var(--prsto-forest)" }}
              onFocus={(e) => { e.target.style.borderColor = "var(--prsto-forest)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; }}
            />
          </div>

          {error && (
            <div className="text-xs p-2 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "var(--prsto-forest)", color: "#FFF" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {needsSetup ? "Création..." : "Connexion..."}
              </span>
            ) : (
              needsSetup ? "Créer mon compte" : "Se connecter"
            )}
          </button>
        </form>

        <p className="text-[10px] mt-6 text-center" style={{ color: "var(--texte-tertiaire)" }}>
          Application privée — accès réservé
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--fond)" }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
