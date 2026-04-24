CREATE TABLE IF NOT EXISTS t_p82393071_video_sharing_platfo.videos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'Аноним',
  description TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  category TEXT DEFAULT 'Без категории',
  thumb_url TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);