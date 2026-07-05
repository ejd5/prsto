import Link from "next/link";
import Image from "next/image";
import { PrstoLogo } from "./PrstoLogo";

export default function LandingFooter() {
  const columns = [
    {
      title: "Produit", links: [
        { label: "Fonctionnalités", href: "#fonctionnalites" },
        { label: "Tarifs", href: "#tarifs" },
        { label: "Extension Chrome", href: "#" },
        { label: "Roadmap", href: "#" },
      ],
    },
    {
      title: "Légal", links: [
        { label: "Confidentialité", href: "#" },
        { label: "CGU", href: "#" },
        { label: "Mentions légales", href: "#" },
        { label: "Cookies", href: "#" },
      ],
    },
    {
      title: "Contact", links: [
        { label: "Support", href: "#" },
        { label: "Blog", href: "/prsto/blog" },
        { label: "LinkedIn", href: "#" },
        { label: "Nous écrire", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t pt-24 pb-12 relative overflow-hidden"
      style={{
        borderColor: "rgba(14,58,41,0.12)",
        backgroundImage: "url('/footer-bg.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center right",
        color: "#0B1F18"
      }}>
      {/* Background displayed with 100% opacity */}

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <Link href="/prsto" className="flex items-center w-fit mb-5" style={{ textDecoration: "none" }}>
              <Image
                src="/branding/logo-prsto.png"
                alt="PRSTO"
                width={160}
                height={50}
                style={{ objectFit: "contain" }}
              />
            </Link>
            <p className="text-[13.5px] leading-relaxed max-w-[280px]" style={{ color: "#3B4E46" }}>
              PRSTO est le premier réseau de préparation de talents de haut niveau et cadres dirigeants. Optimisez votre visibilité, entraînez-vous face aux conseils d&apos;administration et accélérez votre transition de carrière.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h5 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#0E3A29" }}>
                {col.title}
              </h5>
              <div className="space-y-2">
                {col.links.map((link) => (
                  <a key={link.label} href={link.href} className="block text-[13.5px] transition-colors hover:text-[#F2B11A]" style={{
                    color: "#3B4E46", textDecoration: "none",
                  }}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t" style={{ borderColor: "rgba(14,58,41,0.08)" }}>
          <p className="text-xs flex items-center gap-2" style={{ color: "#50625A" }}>
            <span>© 2026 PRSTO. Tous droits réservés. L&apos;excellence à chaque étape de votre transition.</span>
          </p>
          <div className="flex gap-6">
            {["Confidentialité", "CGU", "Mentions Légales"].map((label) => (
              <a key={label} href="#" className="text-xs transition-colors hover:text-[#F2B11A]" style={{
                color: "#50625A", textDecoration: "none",
              }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
