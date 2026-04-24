import { useState } from "react";
import Icon from "@/components/ui/icon";

const IMG1 = "https://cdn.poehali.dev/projects/4c6fc3ef-d36c-4f76-b8a0-b1b52638e7f1/files/fe7957ea-82dc-4685-93ba-bacf77e33033.jpg";
const IMG2 = "https://cdn.poehali.dev/projects/4c6fc3ef-d36c-4f76-b8a0-b1b52638e7f1/files/fc8e1812-8d3e-4133-bc40-ce43ad7a3ca0.jpg";
const IMG3 = "https://cdn.poehali.dev/projects/4c6fc3ef-d36c-4f76-b8a0-b1b52638e7f1/files/d7565c0f-d26e-41ca-9dff-82926cc2dc41.jpg";

interface Video {
  id: number;
  title: string;
  channel: string;
  views: string;
  duration: string;
  thumb: string;
  likes: number;
  dislikes: number;
  category: string;
  subscribed: boolean;
  saved: boolean;
  watched: boolean;
}

const INITIAL_VIDEOS: Video[] = [
  { id: 1, title: "Горы Алтая: Закат над Белухой", channel: "Дикая природа", views: "1.2 млн просмотров", duration: "18:24", thumb: IMG1, likes: 48200, dislikes: 312, category: "Природа", subscribed: true, saved: true, watched: true },
  { id: 2, title: "Обзор iPhone 16 Pro — стоит ли брать?", channel: "TechReview RU", views: "870 тыс. просмотров", duration: "22:11", thumb: IMG2, likes: 31500, dislikes: 1820, category: "Технологии", subscribed: false, saved: false, watched: true },
  { id: 3, title: "Идеальная паста карбонара", channel: "Кухня без границ", views: "2.4 млн просмотров", duration: "09:45", thumb: IMG3, likes: 92100, dislikes: 440, category: "Кулинария", subscribed: true, saved: true, watched: false },
  { id: 4, title: "Вершины Кавказа: экспедиция 2024", channel: "Дикая природа", views: "445 тыс. просмотров", duration: "31:07", thumb: IMG1, likes: 18700, dislikes: 89, category: "Природа", subscribed: true, saved: false, watched: false },
  { id: 5, title: "Samsung Galaxy S25 vs iPhone 16", channel: "TechReview RU", views: "3.1 млн просмотров", duration: "25:33", thumb: IMG2, likes: 65400, dislikes: 4210, category: "Технологии", subscribed: false, saved: false, watched: true },
  { id: 6, title: "Тирамису за 15 минут", channel: "Кухня без границ", views: "980 тыс. просмотров", duration: "14:20", thumb: IMG3, likes: 44800, dislikes: 180, category: "Кулинария", subscribed: true, saved: true, watched: false },
  { id: 7, title: "Байкал зимой: ледяное чудо", channel: "Россия с высоты", views: "5.2 млн просмотров", duration: "28:19", thumb: IMG1, likes: 210300, dislikes: 920, category: "Природа", subscribed: false, saved: false, watched: false },
  { id: 8, title: "MacBook Air M3 — полный обзор", channel: "TechReview RU", views: "1.8 млн просмотров", duration: "19:55", thumb: IMG2, likes: 57900, dislikes: 730, category: "Технологии", subscribed: false, saved: false, watched: true },
];

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

const CATEGORIES = ["Все", "Природа", "Технологии", "Кулинария"];

function formatCount(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + " млн";
  if (n >= 1000) return (n / 1000).toFixed(1) + " тыс.";
  return String(n);
}

function VideoCard({
  video,
  onRate,
  onSave,
  compact = false,
}: {
  video: Video;
  onRate: (id: number, type: "like" | "dislike") => void;
  onSave: (id: number) => void;
  compact?: boolean;
}) {
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);

  const handleVote = (type: "like" | "dislike") => {
    setUserVote(prev => (prev === type ? null : type));
    onRate(video.id, type);
  };

  if (compact) {
    return (
      <div className="flex gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
        <div className="relative flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden">
          <img src={video.thumb} alt={video.title} className="w-full h-full object-cover" />
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
            {video.duration}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{video.channel}</p>
          <p className="text-xs text-muted-foreground">{video.views}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={e => { e.stopPropagation(); handleVote("like"); }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                userVote === "like" ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name="ThumbsUp" size={11} />
              {formatCount(video.likes + (userVote === "like" ? 1 : 0))}
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleVote("dislike"); }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                userVote === "dislike" ? "bg-red-800 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name="ThumbsDown" size={11} />
              {formatCount(video.dislikes + (userVote === "dislike" ? 1 : 0))}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer animate-fade-in">
      <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-muted">
        <img
          src={video.thumb}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 right-2 bg-black/85 text-white text-xs px-2 py-0.5 rounded-md font-medium">
          {video.duration}
        </span>
        {video.watched && (
          <span className="absolute top-2 left-2 bg-black/70 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded">
            Просмотрено
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
          <p className="text-xs text-muted-foreground">{video.views}</p>
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
              {formatCount(video.likes + (userVote === "like" ? 1 : 0))}
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
              {formatCount(video.dislikes + (userVote === "dislike" ? 1 : 0))}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onSave(video.id); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ml-auto ${
                video.saved
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <Icon name="Bookmark" size={12} />
              {video.saved ? "Сохранено" : "Сохранить"}
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

const Index = () => {
  const [section, setSection] = useState<Section>("home");
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRate = (_id: number, _type: "like" | "dislike") => {};

  const handleSave = (id: number) => {
    setVideos(prev => prev.map(v => (v.id === id ? { ...v, saved: !v.saved } : v)));
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

  const subscribedChannels = [...new Set(videos.filter(v => v.subscribed).map(v => v.channel))];
  const subscribedVideos = videos.filter(v => v.subscribed);
  const historyVideos = videos.filter(v => v.watched);
  const savedVideos = videos.filter(v => v.saved);

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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
          <span className="text-lg font-bold text-foreground tracking-tight">ViewStream</span>
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
              {item.id === "subscriptions" && subscribedVideos.length > 0 && (
                <span className="ml-auto bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {subscribedVideos.length}
                </span>
              )}
              {item.id === "favorites" && savedVideos.length > 0 && (
                <span className="ml-auto bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {savedVideos.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 pb-5 border-t border-border pt-4">
          <button
            onClick={() => setSection("profile")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
              <Icon name="User" size={15} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Мой профиль</p>
              <p className="text-[10px] text-muted-foreground">@viewer</p>
            </div>
          </button>
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

          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
            <Icon name="Bell" size={18} />
          </button>
        </header>

        <main className="flex-1 p-6 overflow-auto">

          {/* HOME */}
          {section === "home" && (
            <div className="animate-fade-in max-w-6xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden mb-8 aspect-[21/7] min-h-[140px]">
                <img src={IMG1} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center px-8">
                  <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-2">В тренде</span>
                  <h1 className="text-2xl md:text-3xl font-bold text-white max-w-md leading-tight">
                    Байкал зимой: ледяное чудо
                  </h1>
                  <p className="text-white/70 text-sm mt-1 mb-4">5.2 млн просмотров · Россия с высоты</p>
                  <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full font-semibold text-sm transition-colors w-fit">
                    <Icon name="Play" size={14} />
                    Смотреть
                  </button>
                </div>
              </div>

              <SectionTitle>Рекомендации</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {videos.map(v => (
                  <VideoCard key={v.id} video={v} onRate={handleRate} onSave={handleSave} />
                ))}
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredCatalog.map(v => (
                  <VideoCard key={v.id} video={v} onRate={handleRate} onSave={handleSave} />
                ))}
              </div>
            </div>
          )}

          {/* SEARCH */}
          {section === "search" && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <SectionTitle>Поиск</SectionTitle>
              {searchQuery.length < 2 ? (
                <div>
                  <p className="text-muted-foreground text-sm mb-6">Популярные категории</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.filter(c => c !== "Все").map((cat, i) => (
                      <button
                        key={cat}
                        onClick={() => { setActiveCategory(cat); setSection("catalog"); }}
                        className="relative rounded-xl overflow-hidden h-20 flex items-center justify-center"
                      >
                        <img
                          src={[IMG1, IMG2, IMG3][i % 3]}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                        <span className="relative font-bold text-foreground text-sm drop-shadow">{cat}</span>
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
                      <VideoCard key={v.id} video={v} onRate={handleRate} onSave={handleSave} compact />
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
              {subscribedChannels.length === 0 ? (
                <div className="text-center py-16">
                  <Icon name="Bell" size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">Нет подписок</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 mb-6 flex-wrap">
                    {subscribedChannels.map(ch => (
                      <div key={ch} className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <Icon name="User" size={12} className="text-primary" />
                        </div>
                        <span className="text-sm text-foreground font-medium">{ch}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {subscribedVideos.map(v => (
                      <VideoCard key={v.id} video={v} onRate={handleRate} onSave={handleSave} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* HISTORY */}
          {section === "history" && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <SectionTitle>История просмотров</SectionTitle>
                {historyVideos.length > 0 && (
                  <button className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                    <Icon name="Trash2" size={14} />
                    Очистить
                  </button>
                )}
              </div>
              {historyVideos.length === 0 ? (
                <div className="text-center py-16">
                  <Icon name="History" size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">История пуста</p>
                  <p className="text-muted-foreground text-sm mt-1">Просмотренные видео будут здесь</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {historyVideos.map(v => (
                    <VideoCard key={v.id} video={v} onRate={handleRate} onSave={handleSave} compact />
                  ))}
                </div>
              )}
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
                    <VideoCard key={v.id} video={v} onRate={handleRate} onSave={handleSave} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {section === "profile" && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <SectionTitle>Профиль</SectionTitle>
              <div className="bg-card rounded-2xl p-6 border border-border mb-4">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <Icon name="User" size={32} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Мой канал</h2>
                    <p className="text-muted-foreground text-sm">@viewer · Участник с 2024</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-foreground font-semibold">
                        {subscribedChannels.length}{" "}
                        <span className="text-muted-foreground font-normal">подписок</span>
                      </span>
                      <span className="text-foreground font-semibold">
                        {savedVideos.length}{" "}
                        <span className="text-muted-foreground font-normal">сохранено</span>
                      </span>
                      <span className="text-foreground font-semibold">
                        {historyVideos.length}{" "}
                        <span className="text-muted-foreground font-normal">просмотрено</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Лайков поставлено", value: "12", icon: "ThumbsUp" },
                  { label: "Дизлайков", value: "3", icon: "ThumbsDown" },
                  { label: "Подписок", value: String(subscribedChannels.length), icon: "Bell" },
                  { label: "В избранном", value: String(savedVideos.length), icon: "Bookmark" },
                ].map(stat => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon name={stat.icon} size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
