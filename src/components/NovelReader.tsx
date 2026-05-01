"use client";

import { useState, useCallback } from "react";

interface NovelPage {
  content: string;
  chapter?: string;
}

interface NovelData {
  title: string;
  author: string;
  tags: string[];
  pages: NovelPage[];
  totalPages: number;
  id: string;
}

export default function NovelReader() {
  const [url, setUrl] = useState("");
  const [novel, setNovel] = useState<NovelData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [translatedPages, setTranslatedPages] = useState<
    Record<number, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");

  const fetchNovel = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setNovel(null);
    setTranslatedPages({});
    setCurrentPage(0);

    try {
      const resp = await fetch(
        `/api/novel?url=${encodeURIComponent(url.trim())}`
      );
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setNovel(data);
      translatePage(data.pages[0], 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch novel");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const translatePage = async (page: NovelPage, pageIndex: number) => {
    if (translatedPages[pageIndex]) return;
    setTranslating(true);
    try {
      const lines = page.content
        .split("\n")
        .filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;

      const resp = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      setTranslatedPages((prev) => ({
        ...prev,
        [pageIndex]: data.translated.join("\n\n"),
      }));
    } catch {
      setTranslatedPages((prev) => ({
        ...prev,
        [pageIndex]: "[Translation failed]",
      }));
    } finally {
      setTranslating(false);
    }
  };

  const goToPage = (page: number) => {
    if (!novel || page < 0 || page >= novel.totalPages) return;
    setCurrentPage(page);
    translatePage(novel.pages[page], page);
  };

  const currentPageData = novel?.pages[currentPage];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold mb-3">Pixiv Novel Reader</h1>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchNovel()}
              placeholder="Paste Pixiv novel URL or ID..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
            />
            <button
              onClick={fetchNovel}
              disabled={loading || !url.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "Loading..." : "Read"}
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

      {/* Novel content */}
      {novel && currentPageData && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Meta */}
          <div className="mb-4">
            <h2 className="text-xl font-bold">{novel.title}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {novel.author} &middot; ID: {novel.id}
            </p>
            {novel.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {novel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Page nav */}
          <div className="flex items-center justify-between mb-4 bg-gray-900 rounded-lg px-4 py-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-gray-400">
              {currentPageData.chapter && (
                <span className="text-gray-200 mr-2">
                  {currentPageData.chapter}
                </span>
              )}
              Page {currentPage + 1} / {novel.totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === novel.totalPages - 1}
              className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            >
              Next
            </button>
          </div>

          {/* Side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Original
              </h3>
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-gray-200">
                {currentPageData.content}
              </div>
            </div>

            {/* Translated */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Translation (Chinese)
              </h3>
              {translating && !translatedPages[currentPage] ? (
                <div className="text-gray-500 text-sm animate-pulse">
                  Translating...
                </div>
              ) : translatedPages[currentPage] ? (
                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-gray-200">
                  {translatedPages[currentPage]}
                </div>
              ) : (
                <div className="text-gray-600 text-sm">
                  No translation available
                </div>
              )}
            </div>
          </div>

          {/* Bottom page nav */}
          {novel.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              {Array.from({ length: novel.totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`w-8 h-8 text-xs rounded transition-colors ${
                    i === currentPage
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Empty state */}
      {!novel && !loading && !error && (
        <div className="flex items-center justify-center min-h-[60vh] text-gray-600">
          <p>Enter a Pixiv novel URL or ID to start reading</p>
        </div>
      )}
    </div>
  );
}
