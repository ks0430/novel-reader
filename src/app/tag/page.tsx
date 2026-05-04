"use client";

import { useState, useCallback } from "react";
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
}

interface SearchResult {
  total: number;
  novels: TagNovel[];
  page: number;
  hasMore: boolean;
}

type Mode = "safe" | "r18" | "all";

export default function TagPage() {
  const [tag, setTag] = useState("");
  const [mode, setMode] = useState<Mode>("safe");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        <div className="max-w-7xl mx-auto px-4 py-3">
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
              placeholder="Enter CP tag (e.g. 佐鸣, SasuNaru)..."
              className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
            />
            <div className="flex bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              {(["safe", "r18", "all"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 text-sm capitalize transition-colors ${
                    mode === m
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {m === "r18" ? "R18" : m}
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
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-sm text-gray-400 mb-4">
            {result.total} novels found for &quot;{tag}&quot; (mode: {mode}) — Page{" "}
            {page}
          </div>

          <div className="space-y-3">
            {result.novels.map((novel) => (
              <Link
                key={novel.id}
                href={`/?url=${novel.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-100 truncate">
                      {novel.title}
                      {novel.xRestrict > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-red-900/60 text-red-300 text-xs rounded">
                          R18
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {novel.userName} &middot; {novel.textCount.toLocaleString()}{" "}
                      chars &middot; {novel.bookmarkCount.toLocaleString()} bookmarks
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {novel.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">
                    {novel.id}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {result.total > 0 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
              >
                Prev
              </button>
              <span className="text-sm text-gray-400 px-2">
                Page {page} / {Math.ceil(result.total / 30)}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={!result.hasMore || loading}
                className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </main>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="flex items-center justify-center min-h-[60vh] text-gray-600">
          <p>Enter a CP tag to search for novels</p>
        </div>
      )}
    </div>
  );
}
