import fs from "fs";
import path from "path";
import { ContentBlock, BlogArticle, articles } from "./data";

export function getArticleContent(slug: string): ContentBlock[] {
  const filePath = path.join(process.cwd(), "content/blog", `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    // Fallback to static content defined in data.ts if the markdown file doesn't exist
    const staticArticle = articles.find((a) => a.slug === slug);
    return staticArticle ? staticArticle.content : [];
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  return parseMarkdownToBlocks(fileContent);
}

function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = markdown.split(/\r?\n/);
  
  let currentList: string[] = [];
  let inIntro = true;

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: "ul", items: [...currentList] });
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      continue;
    }

    // List items
    if (line.startsWith("- ") || line.startsWith("* ")) {
      currentList.push(line.substring(2).trim());
      continue;
    }

    // Header 2
    if (line.startsWith("## ")) {
      flushList();
      blocks.push({ type: "h2", text: line.substring(3).trim() });
      continue;
    }

    // Header 3
    if (line.startsWith("### ")) {
      flushList();
      blocks.push({ type: "h3", text: line.substring(4).trim() });
      continue;
    }

    // Pull quote or intro block
    if (line.startsWith("> ")) {
      flushList();
      const text = line.substring(2).trim();
      if (inIntro) {
        blocks.push({ type: "intro", text });
        inIntro = false;
      } else {
        // Look for author if next line contains author info
        let author: string | undefined = undefined;
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith("-- ")) {
          author = lines[i + 1].trim().substring(3).trim();
          i++; // skip next line
        }
        blocks.push({ type: "pullQuote", text, author });
      }
      continue;
    }

    // Stat blocks
    if (line.startsWith("[STAT]")) {
      flushList();
      // Format: [STAT] value="78 %" label="Postes non publiés" description="..."
      const valueMatch = line.match(/value="([^"]+)"/);
      const labelMatch = line.match(/label="([^"]+)"/);
      const descMatch = line.match(/description="([^"]+)"/);

      if (valueMatch && labelMatch && descMatch) {
        blocks.push({
          type: "stat",
          stat: {
            value: valueMatch[1],
            label: labelMatch[1],
            description: descMatch[1],
          },
        });
      }
      continue;
    }

    // Paragraph
    flushList();
    if (inIntro) {
      blocks.push({ type: "intro", text: line });
      inIntro = false;
    } else {
      blocks.push({ type: "p", text: line });
    }
  }

  flushList();
  return blocks;
}
