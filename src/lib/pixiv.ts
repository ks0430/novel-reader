const PIXIV_HEADERS = {
  Referer: "https://www.pixiv.net",
  "User-Agent": "Mozilla/5.0",
};

export interface NovelPage {
  content: string;
  chapter?: string;
}

export interface NovelData {
  title: string;
  author: string;
  tags: string[];
  pages: NovelPage[];
  totalPages: number;
  id: string;
}

function formatContent(text: string): string {
  text = text.replace(/\[\[rb:(.*?)>(.*?)\]\]/g, "$1($2)");
  text = text.replace(/\[pixivimage:\d+\]/g, "[image]");
  text = text.replace(/\[\[jumpuri:(.*?)>(.*?)\]\]/g, "$1 ($2)");
  // Remove chapter markers from content (we extract them separately)
  text = text.replace(/\[chapter:(.*?)\]/g, "");
  return text.trim();
}

function splitPages(content: string): NovelPage[] {
  const rawPages = content.split(/\[newpage\]/);

  return rawPages.map((raw) => {
    const chapterMatch = raw.match(/\[chapter:(.*?)\]/);
    return {
      content: formatContent(raw),
      chapter: chapterMatch ? chapterMatch[1] : undefined,
    };
  });
}

export async function fetchNovel(
  novelId: string,
  sessionId: string
): Promise<NovelData> {
  const resp = await fetch(
    `https://www.pixiv.net/ajax/novel/${novelId}`,
    {
      headers: {
        ...PIXIV_HEADERS,
        Cookie: `PHPSESSID=${sessionId}`,
      },
    }
  );

  const data = await resp.json();
  if (data.error) {
    throw new Error(data.message || "Failed to fetch novel");
  }

  const body = data.body;
  const pages = splitPages(body.content || "");

  return {
    title: body.title || "Untitled",
    author: body.userName || "Unknown",
    tags: (body.tags?.tags || []).map((t: { tag: string }) => t.tag),
    pages,
    totalPages: pages.length,
    id: novelId,
  };
}

export function extractNovelId(input: string): string | null {
  const m =
    input.match(/novel\/show\.php\?id=(\d+)/) ||
    input.match(/\/novel\/(\d+)/);
  if (m) return m[1];
  if (/^\d+$/.test(input.trim())) return input.trim();
  return null;
}
