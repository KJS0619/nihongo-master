"use client";

import { FormEvent, useEffect, useState } from "react";

type Video = { id: string; title: string; url: string; manual?: boolean };

const STORAGE_KEY = "nihongo-learning-videos-v1";
const DEFAULT_VIDEOS: Video[] = [
  { id: "somEzKcCDVE", title: "일본어 학습 영상 1", url: "https://www.youtube.com/watch?v=somEzKcCDVE" },
  { id: "a0LcKjHYkas", title: "일본어 학습 영상 2", url: "https://www.youtube.com/watch?v=a0LcKjHYkas" },
  { id: "YHxGj_DbjQM", title: "일본어 학습 영상 3", url: "https://www.youtube.com/watch?v=YHxGj_DbjQM" },
  { id: "Sc2E5dkR450", title: "일본어 학습 영상 4", url: "https://www.youtube.com/watch?v=Sc2E5dkR450" },
  { id: "7lGGABbSNAc", title: "일본어 학습 영상 5", url: "https://www.youtube.com/watch?v=7lGGABbSNAc" },
  { id: "BNscyvKjE7c", title: "일본어 학습 영상 6", url: "https://www.youtube.com/watch?v=BNscyvKjE7c" },
  { id: "q20D2QJgOvQ", title: "일본어 학습 영상 7", url: "https://www.youtube.com/watch?v=q20D2QJgOvQ" },
  { id: "p3-G30rdCLE", title: "일본어 학습 영상 8", url: "https://www.youtube.com/watch?v=p3-G30rdCLE" },
];

function getYouTubeId(rawUrl: string) {
  try {
    const url = new URL(rawUrl.trim());
    if (url.hostname === "youtu.be" || url.hostname.endsWith(".youtu.be")) return url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (!url.hostname.endsWith("youtube.com")) return null;
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>(DEFAULT_VIDEOS);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const custom: Video[] = stored ? JSON.parse(stored) : [];
      const byId = new Map(DEFAULT_VIDEOS.map((video) => [video.id, video]));
      custom.forEach((video) => {
        if (video?.id && video?.title && video?.url && !byId.has(video.id)) byId.set(video.id, video);
      });
      setVideos([...byId.values()]);
    } catch {
      setVideos(DEFAULT_VIDEOS);
    }
  }, []);

  function addVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = getYouTubeId(url);
    if (!id) {
      setMessage("유효한 YouTube 영상 링크를 입력해 주세요.");
      return;
    }
    if (videos.some((video) => video.id === id)) {
      setMessage("이미 등록된 영상입니다.");
      return;
    }
    const next = [...videos, { id, title: title.trim() || `YouTube 영상 ${videos.length + 1}`, url: `https://www.youtube.com/watch?v=${id}`, manual: true }];
    setVideos(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.filter((video) => video.manual)));
    setTitle("");
    setUrl("");
    setMessage("영상이 추가되었습니다.");
  }

  function removeVideo(id: string) {
    const next = videos.filter((video) => video.id !== id);
    setVideos(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.filter((video) => video.manual)));
    setMessage("내가 추가한 영상을 삭제했습니다.");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <a href="/learn" className="text-sm text-blue-600 dark:text-blue-400">← 학습 메뉴</a>
          <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">영상 학습</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">영상 링크를 열거나 직접 추가할 수 있습니다.</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">영상 링크 직접 추가</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">YouTube 주소를 붙여 넣으세요. 추가한 목록은 현재 브라우저에 저장됩니다.</p>
          <form onSubmit={addVideo} className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
            <label className="sr-only" htmlFor="video-title">영상 제목</label>
            <input id="video-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="영상 제목 (선택)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
            <label className="sr-only" htmlFor="video-url">YouTube 링크</label>
            <input id="video-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
            <button className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">추가</button>
          </form>
          <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-blue-700 dark:text-blue-300">{message}</p>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">영상 목록</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{videos.length}개</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <article key={video.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <a href={video.url} target="_blank" rel="noreferrer" className="block">
                  {/* YouTube hosts the thumbnail for each video ID. */}
                  <img src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`} alt={`${video.title} 썸네일`} className="aspect-video w-full object-cover" loading="lazy" />
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">{video.title}</h3>
                    <span className="mt-2 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">YouTube에서 보기 ↗</span>
                  </div>
                </a>
                {video.manual && <div className="border-t border-gray-100 px-4 py-2 text-right dark:border-gray-700"><button onClick={() => removeVideo(video.id)} className="text-xs text-gray-500 hover:text-red-600">삭제</button></div>}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
