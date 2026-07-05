import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } from "docx";
import { PremiumCvData } from "./cv-pdf-premium";

/**
 * Generates a clean, professional, ATS-friendly Word document (DOCX) from PremiumCvData.
 * Supports one-click anonymization for recruiters.
 */
export async function generateCvDocx(data: PremiumCvData, anonymize: boolean): Promise<Buffer> {
  const children: any[] = [];

  // 1. Identity Header
  if (anonymize) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "PROFIL EXECUTIVE ANONYMISÉ",
            bold: true,
            size: 28,
            color: "103826",
            font: "Arial",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `Réf : PRSTO-EXEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            color: "50625A",
            size: 20,
            font: "Arial",
          }),
        ],
      })
    );
  } else {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: data.fullName.toUpperCase(),
            bold: true,
            size: 32,
            color: "103826",
            font: "Arial",
          }),
        ],
      })
    );

    // Contact info line
    const contactParts = [
      data.email,
      data.phone,
      data.location,
      data.linkedin ? "LinkedIn" : null,
    ].filter(Boolean);

    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: contactParts.join("  |  "),
              color: "50625A",
              size: 18,
              font: "Arial",
            }),
          ],
        })
      );
    }
  }

  // Target Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 24,
          color: "E4B118",
          font: "Arial",
        }),
      ],
    })
  );

  // Helper to create Section Headings with bottom border simulation
  const addHeading = (title: string) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 20,
            color: "103826",
            font: "Arial",
          }),
        ],
      })
    );
  };

  // 2. Professional Summary
  if (data.summary) {
    addHeading("Profil Professionnel");
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: data.summary,
            size: 20,
            color: "333333",
            font: "Arial",
          }),
        ],
      })
    );
  }

  // 3. Experiences
  if (data.experiences && data.experiences.length > 0) {
    addHeading("Expériences Professionnelles");

    data.experiences.forEach((exp) => {
      // Company name and dates
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: exp.company ? `${exp.company}  —  ` : "",
              bold: true,
              size: 20,
              color: "103826",
              font: "Arial",
            }),
            new TextRun({
              text: exp.title,
              bold: true,
              size: 20,
              color: "333333",
              font: "Arial",
            }),
            new TextRun({
              text: `   (${exp.startDate} - ${exp.endDate || "Présent"})`,
              italics: true,
              size: 18,
              color: "666666",
              font: "Arial",
            }),
          ],
        })
      );

      // Description / achievements
      if (exp.description) {
        const descLines = exp.description.split("\n").filter((l) => l.trim().length > 0);
        descLines.forEach((line) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, "");
          const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*");
          
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              bullet: isBullet ? { level: 0 } : undefined,
              children: [
                new TextRun({
                  text: cleanLine,
                  size: 18,
                  color: "444444",
                  font: "Arial",
                }),
              ],
            })
          );
        });
      }
    });
  }

  // 4. Skills
  if (data.skills && data.skills.length > 0) {
    addHeading("Compétences Clés");
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: data.skills.join(", "),
            size: 20,
            color: "333333",
            font: "Arial",
          }),
        ],
      })
    );
  }

  // 5. Education
  if (data.education && data.education.length > 0) {
    addHeading("Formation");
    data.education.forEach((edu) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: edu,
              size: 20,
              color: "333333",
              font: "Arial",
            }),
          ],
        })
      );
    });
  }

  // 6. Languages
  if (data.languages && data.languages.length > 0) {
    addHeading("Langues");
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: data.languages.join("  |  "),
            size: 20,
            color: "333333",
            font: "Arial",
          }),
        ],
      })
    );
  }

  // 7. Certifications
  if (data.certifications && data.certifications.length > 0) {
    addHeading("Certifications");
    data.certifications.forEach((cert) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: cert,
              size: 20,
              color: "333333",
              font: "Arial",
            }),
          ],
        })
      );
    });
  }

  // Build the docx Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
