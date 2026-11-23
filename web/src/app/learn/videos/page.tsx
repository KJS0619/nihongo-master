"use client";

import Link from "next/link";
import { useState } from "react";

interface VideoLink {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  duration?: string;
  category: string;
  tags: string[];
}

export default function VideosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const videos: VideoLink[] = [
    {
      id: "1",
      title: "일본어 학습 영상",
      description: "일본어 학습에 도움이 되는 영상입니다.",
      url: "https://www.youtube.com/watch?v=lFAugu0X5JM&t=23680s",
      duration: "6:34:40",
      category: "학습",
      tags: ["일본어", "학습", "종합"],
    },
  ];

  const categories = ["all", ...Array.from(new Set(videos.map((v) => v.category)))];

  const filteredVideos = selectedCategory === "all"
    ? videos
    : videos.filter((v) => v.category === selectedCategory);

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (match) {
      const videoId = match[1];
      const timeMatch = url.match(/[?&]t=(\d+)/);
      const startTime = timeMatch ? `?start=${timeMatch[1]}` : "";
      return `https://www.youtube.com/embed/${videoId}${startTime}`;
    }
    return url;
  };

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/learn"
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">영상 학습</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">일본어 학습 영상 모음</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {cat === "all" ? "전체" : cat}
            </button>
          ))}
        </div>

        {/* 영상 목록 */}
        <div className="grid gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700"
            >
              {/* 썸네일 / 임베드 */}
              <div className="relative aspect-video bg-gray-900">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  {getYouTubeThumbnail(video.url) ? (
                    <img
                      src={getYouTubeThumbnail(video.url)!}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  {/* 재생 버튼 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* 재생 시간 */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                      {video.duration}
                    </div>
                  )}
                </a>
              </div>

              {/* 영상 정보 */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {video.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {video.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                        {video.category}
                      </span>
                      {video.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="YouTube에서 보기"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">해당 카테고리의 영상이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
