"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then((d) => setNeedsSetup(d.needsSetup))
      .catch(() => setNeedsSetup(false))
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
          border: "1px solid #F3F4F6", // Tailwind gray-100 equivalent
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
