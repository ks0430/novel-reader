"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Chapter {
  id: string;
  title: string;
  available: boolean;
}

interface SeriesData {
  seriesId: string;
  seriesTitle: string;
  chapters: Chapter[];
}

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

export default function SeriesPage() {
  const params = useParams();
  const seriesId = params.id as string;

  const [series, setSeries] = useState<SeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Current chapter reading state
  const [currentChapterIdx, setCurrentChapterIdx] = useState<number | null>(null);
  const [novel, setNovel] = useState<NovelData | null>(null);
  const [novelLoading, setNovelLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [translatedPages, setTranslatedPages] = useState<Record<number, string>>({});
  const [translating, setTranslating] = useState(false);
  const [viewMode, setViewMode] = useState<"both" | "original" | "translation">("both");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const translatingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetch(`/api/series?id=${seriesId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSeries(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load series"))
      .finally(() => setLoading(false));
  }, [seriesId]);

  const translatePage = useCallback(async (page: NovelPage, pageIndex: number) => {
    if (translatingRef.current.has(pageIndex)) return;
    translatingRef.current.add(pageIndex);
    setTranslating(true);
    try {
      const lines = page.content.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;
      const resp = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setTranslatedPages((prev) => ({ ...prev, [pageIndex]: data.translated.join("\n\n") }));
    } catch {
      translatingRef.current.delete(pageIndex);
      setTranslatedPages((prev) => ({ ...prev, [pageIndex]: "[Translation failed]" }));
    } finally {
      setTranslating(false);
    }
  }, []);

  const loadChapter = useCallback(async (idx: number, chapters: Chapter[]) => {
    const chapter = chapters[idx];
    if (!chapter?.available) return;

    setNovelLoading(true);
    setNovel(null);
    setCurrentPage(0);
    setTranslatedPages({});
    translatingRef.current.clear();
    setCurrentChapterIdx(idx);

    try {
      const resp = await fetch(`/api/novel?url=${chapter.id}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setNovel(data);
      translatePage(data.pages[0], 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load chapter");
    } finally {
      setNovelLoading(false);
    }
  }, [translatePage]);

  const goToPage = (page: number) => {
    if (!novel || page < 0 || page >= novel.totalPages) return;
    setCurrentPage(page);
    translatePage(novel.pages[page], page);
  };

  const currentPageData = novel?.pages[currentPage];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading series...</p>
      </div>
    );
  }

  if (error && !series) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/tag" className="text-blue-400 hover:text-blue-300">Back to search</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/tag" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
              Tag Search
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-lg font-semibold truncate">{series?.seriesTitle}</h1>
          </div>
          <p className="text-sm text-gray-500">
            {series?.chapters.length} chapters
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed left-2 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-gray-800 border border-gray-700 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
          title={sidebarOpen ? "Hide chapters" : "Show chapters"}
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? "" : "rotate-180"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Chapter list sidebar */}
        <aside className={`shrink-0 border-r border-gray-800 overflow-y-auto max-h-[calc(100vh-80px)] sticky top-[80px] transition-all duration-200 ${sidebarOpen ? "w-64" : "w-0 border-r-0 overflow-hidden"}`}>
          <div className="p-3 w-64">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chapters</h2>
            <div className="space-y-1">
              {series?.chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => series && loadChapter(idx, series.chapters)}
                  disabled={!ch.available || novelLoading}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentChapterIdx === idx
                      ? "bg-blue-600 text-white"
                      : ch.available
                        ? "text-gray-300 hover:bg-gray-800"
                        : "text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <span className="text-xs text-gray-500 mr-1.5">{idx + 1}.</span>
                  <span className="line-clamp-1">{ch.title}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0">
          {currentChapterIdx === null && !novelLoading && (
            <div className="flex items-center justify-center min-h-[60vh] text-gray-600">
              <p>Select a chapter to start reading</p>
            </div>
          )}

          {novelLoading && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className="text-gray-400 animate-pulse">Loading chapter...</p>
            </div>
          )}

          {error && novel === null && currentChapterIdx !== null && (
            <div className="p-4">
              <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-200 text-sm">
                {error}
              </div>
            </div>
          )}

          {novel && currentPageData && (
            <div className="p-6">
              {/* Chapter title + meta */}
              <div className="mb-4">
                <h2 className="text-xl font-bold">{novel.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{novel.author}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between mb-4 bg-gray-900 rounded-lg px-4 py-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-4">
                  <div className="flex bg-gray-800 rounded overflow-hidden">
                    {(["both", "original", "translation"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-1 text-xs capitalize transition-colors ${
                          viewMode === mode
                            ? "bg-blue-600 text-white"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    Page {currentPage + 1} / {novel.totalPages}
                  </span>
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === novel.totalPages - 1}
                  className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                >
                  Next
                </button>
              </div>

              {/* Content */}
              <div className={`grid gap-4 ${viewMode === "both" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                {viewMode !== "translation" && (
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Original</h3>
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-gray-200">
                      {currentPageData.content}
                    </div>
                  </div>
                )}
                {viewMode !== "original" && (
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Translation</h3>
                    {translating && !translatedPages[currentPage] ? (
                      <div className="text-gray-500 text-sm animate-pulse">Translating...</div>
                    ) : translatedPages[currentPage] ? (
                      <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-gray-200">
                        {translatedPages[currentPage]}
                      </div>
                    ) : (
                      <div className="text-gray-600 text-sm">No translation available</div>
                    )}
                  </div>
                )}
              </div>

              {/* Prev/Next chapter navigation */}
              {series && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => currentChapterIdx !== null && currentChapterIdx > 0 && loadChapter(currentChapterIdx - 1, series.chapters)}
                    disabled={currentChapterIdx === 0 || novelLoading}
                    className="px-4 py-2 text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Prev Chapter
                  </button>
                  <span className="text-sm text-gray-500">
                    Chapter {(currentChapterIdx ?? 0) + 1} / {series.chapters.length}
                  </span>
                  <button
                    onClick={() => currentChapterIdx !== null && currentChapterIdx < series.chapters.length - 1 && loadChapter(currentChapterIdx + 1, series.chapters)}
                    disabled={currentChapterIdx === series.chapters.length - 1 || novelLoading}
                    className="px-4 py-2 text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Next Chapter
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
