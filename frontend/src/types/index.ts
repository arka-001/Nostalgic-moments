export interface HealthStatus {
  status: string;
  app: string;
  version: string;
  database: string;
  timestamp: string;
}

export interface ThemeConfig {
  primary_color?: string;
  accent_color?: string;
  overlay_vignette?: "dark" | "warm" | "cozy" | "night" | "sepia";
  player_skin?:
    | "retro_bus_radio"
    | "retro_cassette_deck"
    | "transistor_radio"
    | "vintage_dashboard"
    | "railway_announcer";
  player_transparency?: number; // 0 to 100 opacity percentage
  ambient_sound_type?: "auto" | "bus" | "car_rain" | "chai" | "salon" | "train" | "vinyl" | "custom_url" | "off";
  ambient_sound_name?: string;
  ambient_sound_description?: string;
  ambient_sound_url?: string;
  ambient_default_volume?: number; // 0 to 100
}


export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tagline?: string;
  thumbnail_url?: string;
  background_url?: string;
  background_type: "image" | "video" | "animation" | string;
  theme_config?: ThemeConfig;
  is_active: boolean;
  sort_order: number;
  song_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  audio_url?: string;
  cover_url?: string;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  category_ids?: string[];
}

export interface PlaylistSongResponse extends Song {
  sort_order: number;
}

export interface CategoryDetail extends Category {
  songs: PlaylistSongResponse[];
}

export interface CategorySong {
  id: string;
  category_id: string;
  song_id: string;
  sort_order: number;
  created_at?: string;
}

export interface CategorySongOrderItem {
  song_id: string;
  sort_order: number;
}

export interface CategorySongReorderRequest {
  items: CategorySongOrderItem[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface FileUploadResponse {
  url: string;
  filename: string;
  content_type: string;
  size: number;
}

export interface EnvironmentPlayStats {
  slug: string;
  name: string;
  play_count: number;
  percentage: number;
}

export interface SongPlayStats {
  id?: string;
  title: string;
  artist: string;
  play_count: number;
  total_duration_listened: number;
}

export interface DailyListeningTrend {
  date: string;
  plays: number;
  hours: number;
}

export interface HourlyListeningTrend {
  hour: number;
  label: string;
  plays: number;
}

export interface AnalyticsOverviewResponse {
  total_plays: number;
  total_listening_hours: number;
  top_environments: EnvironmentPlayStats[];
  top_songs: SongPlayStats[];
  daily_trends: DailyListeningTrend[];
  hourly_trends: HourlyListeningTrend[];
}

export type RepeatMode = "off" | "all" | "one";

export interface AudioPlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  currentIndex: number;
  isFullscreen: boolean;
}



