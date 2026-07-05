import { describe, it, expect } from "vitest";
import { buildCvRenderData } from "@/lib/cv-render/build-data";

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    fullName: "Elton Duarte",
    title: "Directeur Commercial",
    email: "eltduarte@gmail.com",
    phone: "+33662853569",
    location: "Aix en Provence, France",
    linkedin: "https://linkedin.com/in/eltduarte",
    languages: null,
    cvIncludePhoto: true,
    cvIncludeLinkedIn: false,
    ...overrides,
  };
}

describe("buildCvRenderData — languages", () => {
  it("renders 4 languages from JSON array", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        languages: JSON.stringify(["Français", "Anglais", "Espagnol", "Portugais"]),
      }),
    });
    expect(data.languages.length).toBe(4);
    const names = data.languages.map((l) => l.name.toLowerCase());
    expect(names).toContain("français");
    expect(names).toContain("anglais");
    expect(names).toContain("espagnol");
    expect(names).toContain("portugais");
  });

  it("renders JSON array with levels", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        languages: JSON.stringify([
          "Français (natif)",
          "Anglais (courant)",
          "Espagnol (professionnel)",
          "Portugais",
        ]),
      }),
    });
    expect(data.languages.length).toBe(4);
    const es = data.languages.find((l) => l.name.toLowerCase().includes("espagnol"));
    expect(es).toBeDefined();
    expect(es!.level).toBe("professionnel");
    const pt = data.languages.find((l) => l.name.toLowerCase().includes("portugais"));
    expect(pt).toBeDefined();
    expect(pt!.level).toBeUndefined();
  });

  it("deduplicates by keeping version with level", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        languages: JSON.stringify([
          "Français",
          "Français (natif)",
          "Anglais",
          "Anglais (courant)",
        ]),
      }),
    });
    expect(data.languages.length).toBe(2);
    const fr = data.languages.find((l) => l.name.toLowerCase().includes("français"));
    expect(fr!.level).toBe("natif");
    const en = data.languages.find((l) => l.name.toLowerCase().includes("anglais"));
    expect(en!.level).toBe("courant");
  });

  it("renders languages from comma-separated string", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        languages: "Français, Anglais, Espagnol, Portugais",
      }),
    });
    expect(data.languages.length).toBe(4);
    expect(data.languages.some((l) => l.name.toLowerCase().includes("espagnol"))).toBe(true);
  });

  it("never loses Espagnol if present", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        languages: JSON.stringify(["Français (natif)", "Anglais (courant)", "Espagnol (professionnel)", "Français", "Anglais", "Espagnol", "Portugais"]),
      }),
    });
    expect(data.languages.some((l) => l.name.toLowerCase().includes("espagnol"))).toBe(true);
    expect(data.languages.some((l) => l.name.toLowerCase().includes("portugais"))).toBe(true);
    // After dedup: should be 4 unique languages
    expect(data.languages.length).toBe(4);
  });

  it("returns empty array for null languages", () => {
    const data = buildCvRenderData({
      profile: makeProfile({ languages: null }),
    });
    expect(data.languages).toEqual([]);
  });
});

describe("buildCvRenderData — LinkedIn", () => {
  it("hides LinkedIn when cvIncludeLinkedIn is false", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        cvIncludeLinkedIn: false,
        linkedin: "https://linkedin.com/in/eltduarte",
      }),
    });
    expect(data.options.includeLinkedIn).toBe(false);
    expect(data.identity.linkedin).toBe("https://linkedin.com/in/eltduarte");
  });

  it("shows LinkedIn when cvIncludeLinkedIn is true", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        cvIncludeLinkedIn: true,
        linkedin: "https://linkedin.com/in/eltduarte",
      }),
    });
    expect(data.options.includeLinkedIn).toBe(true);
    expect(data.identity.linkedin).toBe("https://linkedin.com/in/eltduarte");
  });

  it("hides LinkedIn when URL is empty", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        cvIncludeLinkedIn: true,
        linkedin: null,
      }),
    });
    expect(data.identity.linkedin).toBeUndefined();
  });
});

describe("buildCvRenderData — photo", () => {
  it("includes photo when cvIncludePhoto is true", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        cvIncludePhoto: true,
        photoUrl: "data:image/png;base64,abc123",
      }),
    });
    expect(data.options.includePhoto).toBe(true);
    expect(data.identity.photoUrl).toBe("data:image/png;base64,abc123");
  });

  it("hides photo when cvIncludePhoto is false", () => {
    const data = buildCvRenderData({
      profile: makeProfile({
        cvIncludePhoto: false,
        photoUrl: "data:image/png;base64,abc123",
      }),
    });
    expect(data.options.includePhoto).toBe(false);
  });

  it("photo is undefined when not provided", () => {
    const data = buildCvRenderData({
      profile: makeProfile({ photoUrl: null }),
    });
    expect(data.identity.photoUrl).toBeUndefined();
  });
});
