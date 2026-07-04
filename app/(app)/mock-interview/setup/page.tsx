"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SetupForm } from "@/components/mock-interview/SetupForm";
import { getPortraits, checkQuota, generatePrepContent } from "@/lib/actions/mock-interview";
import { getPrepPrompt } from "@/lib/ai/prompts-mock-interview";
import type { PrepOutput, PortraitPersona } from "@/lib/ai/prompts-mock-interview";

interface PortraitItem {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  gender: string;
}

const FALLBACK_PORTRAITS: PortraitItem[] = [
  { id: "drh-ingrid", name: "Ingrid Dubois", title: "Directrice RH", imageUrl: "/branding/portraits/drh-ingrid/ingrid-01.png", gender: "female" },
  { id: "ceo-paul", name: "Paul Mercier", title: "CEO", imageUrl: "/branding/portraits/ceo-paul/paul-01.png", gender: "male" },
  { id: "cto-john", name: "John Koffi", title: "CTO", imageUrl: "/branding/portraits/cto-john/john-01.png", gender: "male" },
  { id: "dirmarketing-sabrina", name: "Sabrina Lopez", title: "Directrice Marketing", imageUrl: "/branding/portraits/dirmarketing-sabrina/sabrina-01.png", gender: "female" },
  { id: "rh-lola", name: "Lola Petit", title: "Responsable RH", imageUrl: "/branding/portraits/rhmanager-lola/lola-01.png", gender: "female" },
  { id: "board-david", name: "David Rousseau", title: "Membre du Conseil", imageUrl: "/branding/portraits/boardmanager-david/david-01.png", gender: "male" },
];

export default function MockInterviewSetupPage() {
  const router = useRouter();
  const [portraits, setPortraits] = useState<PortraitItem[]>(FALLBACK_PORTRAITS);
  const [quota, setQuota] = useState({ used: 0, limit: 5 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const data = await getPortraits();
      if (data && data.length > 0) {
        setPortraits(
          (data as Array<{
            id: string; name: string; title: string; image_url: string; gender: string;
          }>).map((p) => ({
            id: p.id,
            name: p.name,
            title: p.title,
            imageUrl: p.image_url,
            gender: p.gender,
          })),
        );
      }
    };
    init();
  }, []);

  useEffect(() => {
    const loadQuota = async () => {
      const q = await checkQuota("current-user");
      setQuota(q);
    };
    loadQuota();
  }, []);

  const prepareInterview = useCallback(
    async (data: {
      company: string;
      jobTitle: string;
      jobDescription: string;
      strengths: string[];
      language: string;
      selectedPortraitIds: string[];
    }) => {
      setIsProcessing(true);
      setError(null);

      try {
        const selectedPersonas: PortraitPersona[] = portraits
          .filter((p) => data.selectedPortraitIds.includes(p.id))
          .map((p) => ({
            id: p.id,
            name: p.name,
            title: p.title,
            traits: [],
          }));

        const prompt = getPrepPrompt({
          language: data.language,
          company: data.company,
          jobTitle: data.jobTitle,
          jobDescription: data.jobDescription,
          strengths: data.strengths,
          panelPersonas: selectedPersonas,
          existingQuestions: [],
        });

        let prepResult: PrepOutput;

        try {
          const llmResult = await generatePrepContent({
            systemPrompt: prompt.systemPrompt,
            userPrompt: prompt.userPrompt,
          });

          if (llmResult.content) {
            prepResult = JSON.parse(llmResult.content) as PrepOutput;

            const oldToNewId: Record<string, string> = {};
            selectedPersonas.forEach((sp, i) => {
              const llmPersona = prepResult.personas[i];
              if (llmPersona) oldToNewId[llmPersona.id] = sp.id;
            });

            prepResult.questions = prepResult.questions.map((q) => ({
              ...q,
              assignedTo: oldToNewId[q.assignedTo] || q.assignedTo,
            }));

            prepResult.personas = selectedPersonas.map((sp, i) => ({
              ...(prepResult.personas[i] || {}),
              id: sp.id,
              name: sp.name,
              title: sp.title,
            }));
          } else {
            throw new Error(llmResult.error || "LLM n'a pas répondu");
          }
        } catch {
          prepResult = {
            personas: selectedPersonas,
            questions: generateFallbackQuestions(data, selectedPersonas),
          };
        }

        const sessionConfig1 = {
          ...data,
          prep: prepResult,
        };

        sessionStorage.setItem("mock-interview-prep", JSON.stringify(sessionConfig1));
        router.push("/mock-interview/session");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de préparation");
      } finally {
        setIsProcessing(false);
      }
    },
    [portraits, router],
  );

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#103826]">
            Simulation d&apos;Entretien
          </h1>
          <p className="mt-3 text-[#103826]/60 text-lg">
            Entraînez-vous avec un panel IA. Recevez un audit détaillé.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {isProcessing ? (
          <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-sm rounded-2xl border border-[#103826]/10 p-12 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-[#103826] border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-[#103826] font-medium">Préparation de votre entretien...</p>
            <p className="text-sm text-[#103826]/60 mt-2">
              Le panel analyse le poste et prépare ses questions
            </p>
          </div>
        ) : (
          <SetupForm
            portraits={portraits}
            onSubmit={prepareInterview}
            quotaUsed={quota.used}
            quotaLimit={quota.limit}
          />
        )}
      </div>
    </div>
  );
}

function generateFallbackQuestions(
  data: {
    company: string; jobTitle: string; strengths: string[]; language: string;
  },
  personas: PortraitPersona[],
): PrepOutput["questions"] {
  const lang = data.language;

  const FR = {
    opening: [
      `Bonjour, je suis ${personas[0]?.name || "le recruteur"}. Parlez-moi de votre parcours et de ce qui vous attire chez ${data.company}.`,
      `Pourquoi postulez-vous au poste de ${data.jobTitle} et qu'est-ce qui vous rend unique ?`,
    ],
    behavioral: [
      `Décrivez une situation où vous avez dû convaincre une équipe réticente. Comment avez-vous procédé ?`,
      `Parlez-moi d'un échec professionnel et de ce que vous en avez appris.`,
      `Comment gérez-vous la pression et les deadlines multiples ?`,
    ],
    closing: [
      `Quelles sont vos questions sur le poste ou l'entreprise ?`,
      `Où vous voyez-vous dans 3 ans si vous rejoignez ${data.company} ?`,
    ],
  };

  const EN = {
    opening: [
      `Hello, I'm ${personas[0]?.name || "the recruiter"}. Tell me about your background and what attracts you to ${data.company}.`,
      `Why are you applying for the ${data.jobTitle} position and what makes you unique?`,
    ],
    behavioral: [
      `Describe a situation where you had to convince a reluctant team. How did you proceed?`,
      `Tell me about a professional failure and what you learned from it.`,
      `How do you handle pressure and multiple deadlines?`,
    ],
    closing: [
      `What questions do you have about the role or company?`,
      `Where do you see yourself in 3 years if you join ${data.company}?`,
    ],
  };

  const bank = lang === "en" ? EN : FR;

  const questions: PrepOutput["questions"] = [];

  const types: ("opening" | "behavioral" | "closing")[] = ["opening", "behavioral", "behavioral", "closing"];

  types.forEach((type, i) => {
    const pool = bank[type];
    const text = pool[i % pool.length];
    const speakerIdx = i % personas.length;
    questions.push({
      text,
      assignedTo: personas[speakerIdx].id,
      type,
    });
  });

  return questions;
}
