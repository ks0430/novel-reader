"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

interface TagNovel {
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

interface SearchResult {
  total: number;
  novels: TagNovel[];
  page: number;
  hasMore: boolean;
}

type Mode = "safe" | "r18" | "all";

const STORAGE_KEY = "pixiv-favorite-tags";

function formatReadingTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes}分钟`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");
}

function proxyUrl(url: string): string {
  return `/api/image?url=${encodeURIComponent(url)}`;
}

function loadFavoriteTags(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFavoriteTags(tags: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

export default function TagPage() {
  const [tag, setTag] = useState("");
  const [mode, setMode] = useState<Mode>("safe");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favoriteTags, setFavoriteTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    setFavoriteTags(loadFavoriteTags());
  }, []);

  const addFavoriteTag = () => {
    const t = newTag.trim();
    if (!t || favoriteTags.includes(t)) return;
    const updated = [...favoriteTags, t];
    setFavoriteTags(updated);
    saveFavoriteTags(updated);
    setNewTag("");
  };

  const removeFavoriteTag = (t: string) => {
    const updated = favoriteTags.filter((x) => x !== t);
    setFavoriteTags(updated);
    saveFavoriteTags(updated);
  };

  const searchTag = (t: string) => {
    setTag(t);
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ tag: t, mode, page: "1" });
    fetch(`/api/tag?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setResult(data);
        setPage(1);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Search failed"))
      .finally(() => setLoading(false));
  };

  const search = useCallback(
    async (searchPage: number = 1) => {
      if (!tag.trim()) return;
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          tag: tag.trim(),
          mode,
          page: String(searchPage),
        });
        const resp = await fetch(`/api/tag?${params}`);
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        setResult(data);
        setPage(searchPage);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [tag, mode]
  );

  const goToPage = (p: number) => search(p);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Reader
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-lg font-semibold">CP Tag Search</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search(1)}
              placeholder="Enter CP tag (e.g. クロリン, 佐鸣)..."
              className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
            />
            <div className="flex bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              {(["safe", "r18", "all"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 text-sm transition-colors ${
                    mode === m
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {m === "r18" ? "R-18" : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => search(1)}
              disabled={loading || !tag.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Favorite Tags */}
      {!result && !loading && (
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Favorite Tags
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {favoriteTags.map((t) => (
              <div key={t} className="flex items-center gap-1 group">
                <button
                  onClick={() => searchTag(t)}
                  className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 hover:bg-gray-700 hover:border-gray-600 transition-colors"
                >
                  #{t}
                </button>
                <button
                  onClick={() => removeFavoriteTag(t)}
                  className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))}
            {favoriteTags.length === 0 && (
              <p className="text-sm text-gray-600">No favorite tags yet</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFavoriteTag()}
              placeholder="Add a tag..."
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500 w-48"
            />
            <button
              onClick={addFavoriteTag}
              disabled={!newTag.trim()}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 rounded-lg text-sm transition-colors"
            >
              + Add
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <main className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              {result.total.toLocaleString()} results
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.novels.map((novel) => (
              <Link
                key={novel.id}
                href={`/?url=${encodeURIComponent(novel.url)}`}
                className="flex gap-3 bg-gray-900 border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors group"
              >
                {/* Cover thumbnail */}
                <div className="w-[72px] h-[100px] shrink-0 rounded overflow-hidden bg-gray-800">
                  {novel.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proxyUrl(novel.coverUrl)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                      No Cover
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Title */}
                  <h3 className="font-bold text-sm text-gray-100 leading-tight group-hover:text-blue-400 transition-colors line-clamp-1">
                    {novel.title}
                  </h3>

                  {/* Author */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {novel.profileImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={proxyUrl(novel.profileImageUrl)}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <span className="text-xs text-gray-400">{novel.userName}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-x-1.5 mt-1.5 line-clamp-1 overflow-hidden">
                    {novel.xRestrict > 0 && (
                      <span className="text-xs font-bold text-red-500">R-18</span>
                    )}
                    {novel.tags.slice(0, 4).map((t) => (
                      <span key={t} className="text-xs text-red-400">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Caption */}
                  {novel.caption && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {stripHtml(novel.caption)}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-2 mt-auto pt-1.5 text-xs text-gray-500">
                    <span>{novel.textCount.toLocaleString()}字</span>
                    <span>{formatReadingTime(novel.readingTime)}</span>
                    <span className="flex items-center gap-0.5">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      {novel.bookmarkCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {result.total > 0 && (() => {
            const totalPages = Math.ceil(result.total / 30);
            return (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => goToPage(1)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  First
                </button>
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={page}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (v >= 1 && v <= totalPages) goToPage(v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = parseInt((e.target as HTMLInputElement).value, 10);
                        if (v >= 1 && v <= totalPages) goToPage(v);
                      }
                    }}
                    className="w-14 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-center text-sm text-gray-200 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span>/ {totalPages}</span>
                </div>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={!result.hasMore || loading}
                  className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Next
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Last
                </button>
              </div>
            );
          })()}
        </main>
      )}

      {/* Empty state (no favorites, no results) */}
      {!result && !loading && !error && favoriteTags.length === 0 && (
        <div className="flex items-center justify-center min-h-[30vh] text-gray-600">
          <p>Add some favorite tags or search above</p>
        </div>
      )}
    </div>
  );
}
