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

export interface TagSearchResult {
  id: string;
  title: string;
  userName: string;
  textCount: number;
  bookmarkCount: number;
  tags: string[];
  xRestrict: number;
  url: string;
  coverUrl: string | null;
  caption: string;
  readingTime: number;
  profileImageUrl: string | null;
}

export interface TagSearchResponse {
  total: number;
  novels: TagSearchResult[];
  page: number;
  hasMore: boolean;
}

export async function searchNovelsByTag(
  tag: string,
  sessionId: string,
  mode: "safe" | "r18" | "all" = "safe",
  page: number = 1
): Promise<TagSearchResponse> {
  const encoded = encodeURIComponent(tag);
  const url =
    `https://www.pixiv.net/ajax/search/novels/${encoded}` +
    `?word=${encoded}&order=date_d&mode=${mode}&p=${page}` +
    `&s_mode=s_tag_full&gs=1`;

  const resp = await fetch(url, {
    headers: {
      ...PIXIV_HEADERS,
      Cookie: `PHPSESSID=${sessionId}`,
    },
  });

  const data = await resp.json();
  if (data.error) {
    throw new Error(data.message || "Search failed");
  }

  const body = data.body;
  const rawNovels = body.novel?.data || [];
  const total = body.novel?.total || 0;

  const novels: TagSearchResult[] = rawNovels.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (n: any) => ({
      id: String(n.id || ""),
      title: n.title || "Untitled",
      userName: n.userName || "Unknown",
      textCount: n.textLength || n.textCount || 0,
      bookmarkCount: n.bookmarkCount || 0,
      tags: (n.tags || []).slice(0, 6),
      xRestrict: n.xRestrict || 0,
      url: `https://www.pixiv.net/novel/show.php?id=${n.id || ""}`,
      coverUrl: n.cover?.urls?.["240mw"] || null,
      caption: n.caption || "",
      readingTime: n.readingTime || 0,
      profileImageUrl: n.profileImageUrl || null,
    })
  );

  return {
    total,
    novels,
    page,
    hasMore: page * 30 < total,
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
