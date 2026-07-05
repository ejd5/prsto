import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    $("script, style, nav, header, footer, iframe, noscript, svg, form, button, img, video, audio, link, meta").remove();

    let text = $("body").text();

    text = text
      .replace(/[\t ]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (text.length < 100) {
      return NextResponse.json({ error: "Impossible d'extraire le contenu de cette URL" }, { status: 422 });
    }

    const title = $("title").first().text().trim() || "";
    const h1 = $("h1").first().text().trim() || "";

    const truncated = text.slice(0, 8000);

    return NextResponse.json({
      text: truncated,
      title: h1 || title,
      source: url,
    });
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      return NextResponse.json({ error: "La page a mis trop de temps à répondre" }, { status: 408 });
    }
    return NextResponse.json({ error: err.message || "Erreur extraction" }, { status: 500 });
  }
}
