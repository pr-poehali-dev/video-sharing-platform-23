import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const VIDEOS_URL = "https://functions.poehali.dev/34934084-2009-48e9-aacd-52355573534a";
const RATE_URL = "https://functions.poehali.dev/495ab997-792f-4a2a-92fd-5a0219e28dab";
const AUTH_URL = "https://functions.poehali.dev/88ecd379-9824-42c0-b348-37881077a5bc";

// Расширяем глобальный тип window для Google GSI
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void;
          prompt: () => void;
          renderButton: (el: HTMLElement, cfg: object) => void;
        };
      };
    };
  }
}

interface GoogleUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
}

interface Video {
  id: number;
  title: string;
  channel: string;
  description: string;
  duration: string;
  views: number;
  likes: number;
  dislikes: number;
  category: string;
  thumb_url: string;
  video_url: string;
  created_at: string;
}

type Section = "home" | "catalog" | "search" | "subscriptions" | "history" | "profile" | "favorites";

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "catalog", label: "Каталог", icon: "LayoutGrid" },
  { id: "search", label: "Поиск", icon: "Search" },
  { id: "subscriptions", label: "Подписки", icon: "Bell" },
  { id: "history", label: "История", icon: "History" },
  { id: "favorites", label: "Избранное", icon: "Bookmark" },
  { id: "profile", label: "Профиль", icon: "User" },
];

const CATEGORIES = ["Все", "Природа", "Технологии", "Кулинария", "Спорт", "Музыка", "Образование", "Игры"];

function formatCount(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + " млн";
  if (n >= 1000) return (n / 1000).toFixed(1) + " тыс.";
  return String(n);
}

function formatViews(n: number) {
  return formatCount(n) + " просмотров";
}

// ——— Upload Modal ———
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Без категории");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        res(result.split(",")[1]);
      };
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

  const handleUpload = async () => {
    if (!title.trim()) { setError("Введите название видео"); return; }
    if (!videoFile) { setError("Выберите видеофайл"); return; }
    setError("");
    setUploading(true);

    try {
      setProgress("Подготовка файла...");
      const videoB64 = await toBase64(videoFile);
      const videoExt = videoFile.name.split(".").pop() || "mp4";

      let thumbB64 = "";
      let thumbExt = "jpg";
      if (thumbFile) {
        setProgress("Обработка обложки...");
        thumbB64 = await toBase64(thumbFile);
        thumbExt = thumbFile.name.split(".").pop() || "jpg";
      }

      setProgress("Загрузка на сервер...");
      const resp = await fetch(VIDEOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          channel: channel.trim() || "Аноним",
          description: description.trim(),
          category,
          video_data: videoB64,
          video_ext: videoExt,
          thumb_data: thumbB64,
          thumb_ext: thumbExt,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        onUploaded();
        onClose();
      } else {
        setError("Ошибка загрузки. Попробуйте снова.");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте снова.");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground">Загрузить видео</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Видеофайл *</label>
            <div
              onClick={() => videoRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                videoFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-white/3"
              }`}
            >
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => setVideoFile(e.target.files?.[0] || null)}
              />
              {videoFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Icon name="FileVideo" size={20} className="text-primary" />
                  <span className="text-sm text-foreground font-medium">{videoFile.name}</span>
                </div>
              ) : (
                <div>
                  <Icon name="Upload" size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нажмите или перетащите видеофайл</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">MP4, MOV, AVI, WebM</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Обложка (необязательно)</label>
            <div
              onClick={() => thumbRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                thumbFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <input
                ref={thumbRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setThumbFile(e.target.files?.[0] || null)}
              />
              {thumbFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Icon name="Image" size={16} className="text-primary" />
                  <span className="text-sm text-foreground">{thumbFile.name}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Добавить обложку</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Название *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Введите название видео"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Имя / Канал</label>
            <input
              value={channel}
              onChange={e => setChannel(e.target.value)}
              placeholder="Ваш канал или имя"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Категория</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            >
              {CATEGORIES.filter(c => c !== "Все").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Без категории">Без категории</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Расскажите о видео..."
              rows={2}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}

          {progress && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {progress}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !videoFile}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="Upload" size={15} />
            )}
            {uploading ? "Загрузка..." : "Опубликовать"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— Video Card ———
function VideoCard({
  video,
  onSave,
  saved,
  compact = false,
}: {
  video: Video;
  onSave: (id: number) => void;
  saved: boolean;
  compact?: boolean;
}) {
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [localLikes, setLocalLikes] = useState(video.likes);
  const [localDislikes, setLocalDislikes] = useState(video.dislikes);

  const handleVote = async (type: "like" | "dislike") => {
    if (userVote === type) return;
    const prev = userVote;
    setUserVote(type);
    if (type === "like") setLocalLikes(l => l + 1);
    else setLocalDislikes(d => d + 1);
    if (prev === "like") setLocalLikes(l => l - 1);
    if (prev === "dislike") setLocalDislikes(d => d - 1);
    try {
      await fetch(RATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: video.id, type }),
      });
    } catch (_e) {
      // игнорируем ошибки сети при оценке
    }
  };

  const thumbSrc = video.thumb_url || "";

  if (compact) {
    return (
      <div className="flex gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
        <div className="relative flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden bg-muted">
          {thumbSrc ? (
            <img src={thumbSrc} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="Play" size={24} className="text-muted-foreground" />
            </div>
          )}
          {video.duration && (
            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
              {video.duration}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{video.channel}</p>
          <p className="text-xs text-muted-foreground">{formatViews(video.views)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={e => { e.stopPropagation(); handleVote("like"); }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                userVote === "like" ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name="ThumbsUp" size={11} />
              {formatCount(localLikes)}
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleVote("dislike"); }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                userVote === "dislike" ? "bg-red-800 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name="ThumbsDown" size={11} />
              {formatCount(localDislikes)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer animate-fade-in">
      <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-muted">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <Icon name="Play" size={36} className="text-muted-foreground" />
          </div>
        )}
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/85 text-white text-xs px-2 py-0.5 rounded-md font-medium">
            {video.duration}
          </span>
        )}
      </div>
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name="User" size={15} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{video.channel}</p>
          <p className="text-xs text-muted-foreground">{formatViews(video.views)}</p>
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={e => { e.stopPropagation(); handleVote("like"); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                userVote === "like"
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <Icon name="ThumbsUp" size={12} />
              {formatCount(localLikes)}
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleVote("dislike"); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                userVote === "dislike"
                  ? "bg-red-900 text-white"
                  : "bg-secondary text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <Icon name="ThumbsDown" size={12} />
              {formatCount(localDislikes)}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onSave(video.id); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ml-auto ${
                saved
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <Icon name="Bookmark" size={12} />
              {saved ? "Сохранено" : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-foreground mb-5">{children}</h2>;
}

function EmptyVideos({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <Icon name="Video" size={36} className="text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Видео пока нет</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Стань первым — загрузи своё видео и оно появится здесь
      </p>
      <button
        onClick={onUpload}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-colors"
      >
        <Icon name="Upload" size={15} />
        Загрузить видео
      </button>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ——— Google Login Modal ———
function LoginModal({ onClose, onLogin }: { onClose: () => void; onLogin: (user: GoogleUser) => void }) {
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = (window as { GOOGLE_CLIENT_ID?: string }).GOOGLE_CLIENT_ID || "";
    const tryInit = () => {
      if (!window.google) { setTimeout(tryInit, 300); return; }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential: string }) => {
          try {
            const r = await fetch(AUTH_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token: resp.credential }),
            });
            const data = await r.json();
            if (data.success) {
              localStorage.setItem("yuvest_user", JSON.stringify(data.user));
              onLogin(data.user);
              onClose();
            }
          } catch (_e) { /* ошибка авторизации */ }
        },
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "filled_black",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 280,
          locale: "ru",
        });
      }
    };
    tryInit();
  }, [onClose, onLogin]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Icon name="Play" size={12} className="text-white ml-0.5" />
            </div>
            <span className="font-bold text-foreground">Ювист</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Войти в аккаунт</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Войди через Google чтобы загружать видео и сохранять избранное
          </p>
          <div className="flex justify-center">
            <div ref={btnRef} />
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Нажимая «Войти», вы соглашаетесь с условиями использования
          </p>
        </div>
      </div>
    </div>
  );
}

// ——— Main App ———
const Index = () => {
  const [section, setSection] = useState<Section>("home");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [user, setUser] = useState<GoogleUser | null>(() => {
    try {
      const saved = localStorage.getItem("yuvest_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLogin = useCallback((u: GoogleUser) => { setUser(u); }, []);
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("yuvest_user");
    setSection("home");
  };

  const requireAuth = (action: () => void) => {
    if (!user) { setShowLogin(true); return; }
    action();
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const resp = await fetch(VIDEOS_URL);
      const data = await resp.json();
      setVideos(data.videos || []);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleSave = (id: number) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearchResults(
      videos.filter(v =>
        v.title.toLowerCase().includes(q.toLowerCase()) ||
        v.channel.toLowerCase().includes(q.toLowerCase())
      )
    );
  };

  const filteredCatalog =
    activeCategory === "Все" ? videos : videos.filter(v => v.category === activeCategory);
  const savedVideos = videos.filter(v => savedIds.has(v.id));

  return (
    <div className="min-h-screen bg-background flex">
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={fetchVideos} />
      )}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-60 bg-[hsl(0_0%_9%)] border-r border-border flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="Play" size={16} className="text-white ml-0.5" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">Ювист</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                section === item.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
              {item.id === "favorites" && savedVideos.length > 0 && (
                <span className="ml-auto bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {savedVideos.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-2">
          <button
            onClick={() => { requireAuth(() => { setShowUpload(true); setSidebarOpen(false); }); }}
            className="w-full flex items-center gap-2 justify-center py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Icon name="Upload" size={16} />
            Загрузить видео
          </button>
          {user ? (
            <button
              onClick={() => { setSection("profile"); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors border border-border"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
                  <Icon name="User" size={13} className="text-primary" />
                </div>
              )}
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => { setShowLogin(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2 justify-center py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Icon name="LogIn" size={15} />
              Войти
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 bg-[hsl(0_0%_7%/0.95)] backdrop-blur border-b border-border flex items-center px-4 gap-4">
          <button
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="Menu" size={20} />
          </button>

          <div className="flex-1 max-w-lg mx-auto">
            <div className="relative">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => {
                  handleSearch(e.target.value);
                  if (e.target.value) setSection("search");
                }}
                placeholder="Поиск видео..."
                className="w-full bg-secondary/60 border border-border rounded-full py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={() => requireAuth(() => setShowUpload(true))}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Icon name="Upload" size={14} />
            Загрузить
          </button>
          {!user && (
            <button
              onClick={() => setShowLogin(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm font-medium transition-colors"
            >
              <Icon name="LogIn" size={14} />
              Войти
            </button>
          )}
        </header>

        <main className="flex-1 p-6 overflow-auto">

          {/* HOME */}
          {section === "home" && (
            <div className="animate-fade-in max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <SectionTitle>Все видео</SectionTitle>
                <button
                  onClick={fetchVideos}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/5"
                  title="Обновить"
                >
                  <Icon name="RefreshCw" size={16} />
                </button>
              </div>
              {loading ? <Loader /> : videos.length === 0 ? (
                <EmptyVideos onUpload={() => setShowUpload(true)} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {videos.map(v => (
                    <VideoCard key={v.id} video={v} onSave={handleSave} saved={savedIds.has(v.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATALOG */}
          {section === "catalog" && (
            <div className="animate-fade-in max-w-6xl mx-auto">
              <SectionTitle>Каталог</SectionTitle>
              <div className="flex gap-2 mb-6 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {loading ? <Loader /> : filteredCatalog.length === 0 ? (
                <div className="text-center py-16">
                  <Icon name="FolderOpen" size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">В этой категории пока нет видео</p>
                  <button onClick={() => setShowUpload(true)} className="mt-4 text-sm text-primary hover:underline">
                    Загрузить первое
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredCatalog.map(v => (
                    <VideoCard key={v.id} video={v} onSave={handleSave} saved={savedIds.has(v.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEARCH */}
          {section === "search" && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <SectionTitle>Поиск</SectionTitle>
              {searchQuery.length < 2 ? (
                <div>
                  <p className="text-muted-foreground text-sm mb-6">Введите запрос в поле выше</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CATEGORIES.filter(c => c !== "Все").map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setActiveCategory(cat); setSection("catalog"); }}
                        className="rounded-xl h-16 bg-secondary hover:bg-white/10 transition-colors flex items-center justify-center"
                      >
                        <span className="font-medium text-foreground text-sm">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-16">
                  <Icon name="SearchX" size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">Ничего не найдено</p>
                  <p className="text-muted-foreground text-sm mt-1">Попробуй другой запрос</p>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Найдено: {searchResults.length} видео по запросу «{searchQuery}»
                  </p>
                  <div className="space-y-1">
                    {searchResults.map(v => (
                      <VideoCard key={v.id} video={v} onSave={handleSave} saved={savedIds.has(v.id)} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBSCRIPTIONS */}
          {section === "subscriptions" && (
            <div className="animate-fade-in max-w-6xl mx-auto">
              <SectionTitle>Подписки</SectionTitle>
              <div className="text-center py-16">
                <Icon name="Bell" size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">Скоро появятся подписки</p>
                <p className="text-muted-foreground text-sm mt-1">Эта функция в разработке</p>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {section === "history" && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <SectionTitle>История просмотров</SectionTitle>
              <div className="text-center py-16">
                <Icon name="History" size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">История пуста</p>
                <p className="text-muted-foreground text-sm mt-1">Просмотренные видео будут здесь</p>
              </div>
            </div>
          )}

          {/* FAVORITES */}
          {section === "favorites" && (
            <div className="animate-fade-in max-w-6xl mx-auto">
              <SectionTitle>Избранное</SectionTitle>
              {savedVideos.length === 0 ? (
                <div className="text-center py-16">
                  <Icon name="Bookmark" size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">Нет сохранённых видео</p>
                  <p className="text-muted-foreground text-sm mt-1">Нажми «Сохранить» под любым видео</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {savedVideos.map(v => (
                    <VideoCard key={v.id} video={v} onSave={handleSave} saved={savedIds.has(v.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {section === "profile" && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <SectionTitle>Профиль</SectionTitle>
              {!user ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Icon name="User" size={36} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Вы не вошли</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                    Войдите через Google чтобы загружать видео и управлять профилем
                  </p>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-colors mx-auto"
                  >
                    <Icon name="LogIn" size={15} />
                    Войти через Google
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-card rounded-2xl p-6 border border-border mb-4">
                    <div className="flex items-center gap-5">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/30" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/30">
                          <Icon name="User" size={32} className="text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                        <p className="text-muted-foreground text-sm">{user.email}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-foreground font-semibold">
                            {savedVideos.length}{" "}
                            <span className="text-muted-foreground font-normal">сохранено</span>
                          </span>
                          <span className="text-foreground font-semibold">
                            {videos.length}{" "}
                            <span className="text-muted-foreground font-normal">видео на платформе</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowUpload(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors mb-4"
                  >
                    <Icon name="Upload" size={18} />
                    Загрузить новое видео
                  </button>

                  <div className="bg-card border border-border rounded-xl overflow-hidden mb-3">
                    {[
                      { label: "Настройки аккаунта", icon: "Settings" },
                      { label: "Уведомления", icon: "Bell" },
                      { label: "Конфиденциальность", icon: "Lock" },
                      { label: "Помощь", icon: "HelpCircle" },
                    ].map((item, i, arr) => (
                      <button
                        key={item.label}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-sm text-foreground ${
                          i < arr.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <Icon name={item.icon} size={16} className="text-muted-foreground" />
                        {item.label}
                        <Icon name="ChevronRight" size={14} className="text-muted-foreground ml-auto" />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-red-400 hover:border-red-400/40 hover:bg-red-400/5 transition-all"
                  >
                    <Icon name="LogOut" size={16} />
                    Выйти из аккаунта
                  </button>
                </>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Index;