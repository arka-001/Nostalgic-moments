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
  source_type?: "uploaded" | "youtube";
  youtube_video_id?: string;
  youtube_url?: string;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  category_ids?: string[];
}

export interface YouTubeSettings {
  is_enabled: boolean;
  is_configured: boolean;
  masked_key: string;
  updated_at?: string;
}

export interface YouTubeConnectionTestResponse {
  success: boolean;
  message: string;
}

export interface YouTubePlaylist {
  id: string;
  playlist_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  song_count: number;
  is_active: boolean;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface YouTubeImportResult {
  playlist_title: string;
  playlist_id: string;
  category: string;
  total_items: number;
  imported: number;
  already_existing: number;
  skipped: number;
  order_updated: boolean;
  skipped_reasons: string[];
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

export interface VisitorSession {
  id: string;
  session_id: string;
  ip_address: string;
  country?: string;
  country_code?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  device?: string;
  browser?: string;
  os?: string;
  current_path?: string;
  current_environment?: string;
  current_song_title?: string;
  current_song_artist?: string;
  is_playing: boolean;
  is_online: boolean;
  is_blocked?: boolean;
  total_duration_listened: number;
  total_visits: number;
  first_seen_at: string;
  last_seen_at: string;
}

export interface GeoDistributionItem {
  name: string;
  code?: string;
  count: number;
  percentage: number;
}

export interface GeoMapPoint {
  city: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  active_listeners: number;
  total_sessions: number;
}

export interface VisitorTelemetrySummary {
  live_online_count: number;
  total_unique_visitors: number;
  total_countries_reached: number;
  top_countries: GeoDistributionItem[];
  top_cities: GeoDistributionItem[];
  device_breakdown: GeoDistributionItem[];
  browser_breakdown: GeoDistributionItem[];
  geo_map_points?: GeoMapPoint[];
  visitors: VisitorSession[];
  total_records: number;
}

export interface HeartbeatPayload {
  session_id: string;
  current_path?: string;
  current_environment?: string;
  current_song_title?: string;
  current_song_artist?: string;
  is_playing: boolean;
  duration_increment?: number;
}



