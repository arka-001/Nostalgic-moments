import {
  HealthStatus,
  Category,
  CategoryDetail,
  Song,
  AdminUser,
  AuthResponse,
  FileUploadResponse,
  CategorySongOrderItem,
  AnalyticsOverviewResponse,
  YouTubeSettings,
  YouTubeConnectionTestResponse,
  YouTubePlaylist,
  YouTubeImportResult,
  VisitorTelemetrySummary,
  VisitorSession,
} from "../types";


export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Centralized Typed API Fetch Wrapper with Cookie Session Support (credentials: "include")
 * and 401 Session Expiration Guard.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
    credentials: "include", // Enables HttpOnly cookie session support
  });

  if (response.status === 401) {
    if (typeof window !== "undefined" && !url.includes("/auth/login")) {
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login?expired=1";
      }
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errData.message || errorDetail;
    } catch {
      // Ignore non-JSON response
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// --- Health Check ---
export async function fetchHealthStatus(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>("/api/health", { cache: "no-store" });
}

// --- Auth APIs ---
export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutAdmin(): Promise<{ message: string }> {
  try {
    return await apiFetch<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  } catch {
    return { message: "Logged out" };
  }
}

export async function fetchMe(): Promise<AdminUser> {
  return apiFetch<AdminUser>("/api/auth/me");
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}


// --- Category / Environment APIs ---
export async function fetchCategories(
  includeInactive: boolean = false
): Promise<Category[]> {
  try {
    const query = includeInactive ? "?include_inactive=true" : "";
    return await apiFetch<Category[]>(`/api/categories${query}`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function fetchCategoryBySlug(
  slug: string
): Promise<CategoryDetail | null> {
  try {
    return await apiFetch<CategoryDetail>(`/api/categories/${slug}`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error(`Error fetching category '${slug}':`, error);
    return null;
  }
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  return apiFetch<Category>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: string,
  data: Partial<Category>
): Promise<Category> {
  return apiFetch<Category>(`/api/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
}

export async function attachSongToCategory(
  categoryId: string,
  songId: string,
  sortOrder: number = 0
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/admin/categories/${categoryId}/songs?song_id=${songId}&sort_order=${sortOrder}`,
    { method: "POST" }
  );
}

export async function detachSongFromCategory(
  categoryId: string,
  songId: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/admin/categories/${categoryId}/songs/${songId}`,
    { method: "DELETE" }
  );
}

export async function reorderCategorySongs(
  categoryId: string,
  items: CategorySongOrderItem[]
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/admin/categories/${categoryId}/songs/reorder`,
    {
      method: "PUT",
      body: JSON.stringify({ items }),
    }
  );
}

// --- Song APIs ---
export async function fetchSongs(
  includeInactive: boolean = false,
  q: string = ""
): Promise<Song[]> {
  try {
    const params = new URLSearchParams();
    if (includeInactive) params.append("include_inactive", "true");
    if (q.trim()) params.append("q", q.trim());
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return await apiFetch<Song[]>(`/api/songs${queryString}`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("Error fetching songs:", error);
    return [];
  }
}

export async function searchSongs(q: string, includeInactive: boolean = true): Promise<Song[]> {
  const params = new URLSearchParams();
  if (q.trim()) params.append("q", q.trim());
  if (includeInactive) params.append("include_inactive", "true");
  const queryString = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<Song[]>(`/api/songs/search${queryString}`, {
    cache: "no-store",
  });
}

export async function fetchSongById(id: string): Promise<Song> {
  return apiFetch<Song>(`/api/songs/${id}`);
}

export async function createSong(data: Partial<Song>): Promise<Song> {
  return apiFetch<Song>("/api/admin/songs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSong(
  id: string,
  data: Partial<Song>
): Promise<Song> {
  return apiFetch<Song>(`/api/admin/songs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteSong(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/songs/${id}`, {
    method: "DELETE",
  });
}

// --- Upload APIs ---
export async function uploadAudioFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<FileUploadResponse>("/api/admin/uploads/audio", {
    method: "POST",
    body: formData,
  });
}

export async function uploadImageFile(
  file: File,
  bucket: "covers" | "backgrounds" | "thumbnails" = "covers"
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<FileUploadResponse>(`/api/admin/uploads/image?bucket=${bucket}`, {
    method: "POST",
    body: formData,
  });
}

// --- Session Identifier Helper ---
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  try {
    let sess = sessionStorage.getItem("nostalgic_tab_session_id");
    if (!sess) {
      sess = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      sessionStorage.setItem("nostalgic_tab_session_id", sess);
    }
    return sess;
  } catch (_) {
    return "sess_tab_" + Math.random().toString(36).substring(2, 10);
  }
}

// --- Analytics APIs ---
export async function trackPlaybackEvent(data: {
  event_type?: string;
  session_id?: string;
  category_slug?: string;
  category_name?: string;
  song_id?: string;
  song_title?: string;
  song_artist?: string;
  duration_listened?: number;
}): Promise<void> {
  try {
    const payload = {
      ...data,
      session_id: data.session_id || getOrCreateSessionId(),
    };
    await fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (_) {
    // Silent fail for non-blocking telemetry
  }
}

export async function sendHeartbeat(data: {
  session_id?: string;
  current_path?: string;
  current_environment?: string;
  current_song_title?: string;
  current_song_artist?: string;
  is_playing?: boolean;
  duration_increment?: number;
}): Promise<void> {
  try {
    const payload = {
      ...data,
      session_id: data.session_id || getOrCreateSessionId(),
      is_playing: Boolean(data.is_playing),
    };
    await fetch(`${API_BASE_URL}/api/analytics/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (_) {
    // Silent fail
  }
}

export async function fetchVisitorTelemetry(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status_filter?: string;
  country_filter?: string;
  environment_filter?: string;
}): Promise<VisitorTelemetrySummary> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status_filter) query.set("status_filter", params.status_filter);
  if (params?.country_filter) query.set("country_filter", params.country_filter);
  if (params?.environment_filter) query.set("environment_filter", params.environment_filter);

  const qs = query.toString();
  return apiFetch<VisitorTelemetrySummary>(`/api/analytics/admin/visitors${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
}

// --- IP Protection APIs ---
export async function toggleBlockIp(ip: string): Promise<{ status: string; is_blocked: boolean; message: string }> {
  return apiFetch<{ status: string; is_blocked: boolean; message: string }>(
    `/api/analytics/admin/visitors/${encodeURIComponent(ip)}/toggle-block`,
    {
      method: "POST",
    }
  );
}

export async function fetchBlockedIps(): Promise<any[]> {
  return apiFetch<any[]>("/api/analytics/admin/blocked-ips", {
    cache: "no-store",
  });
}

export async function createBlockedIp(data: { ip_address: string; reason?: string }): Promise<any> {
  return apiFetch<any>("/api/analytics/admin/blocked-ips", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteBlockedIp(ip: string): Promise<void> {
  return apiFetch<void>(`/api/analytics/admin/blocked-ips/${encodeURIComponent(ip)}`, {
    method: "DELETE",
  });
}

export function getCsvExportUrl(type: "visitors" | "streaming"): string {
  return `${API_BASE_URL}/api/analytics/admin/export-csv?type=${type}`;
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverviewResponse> {
  return apiFetch<AnalyticsOverviewResponse>("/api/analytics/admin/overview");
}

// --- YouTube Integration APIs ---
export async function fetchYouTubeSettings(): Promise<YouTubeSettings> {
  return apiFetch<YouTubeSettings>("/api/admin/youtube/settings", {
    cache: "no-store",
  });
}

export async function updateYouTubeSettings(data: {
  is_enabled?: boolean;
  api_key?: string;
}): Promise<YouTubeSettings> {
  return apiFetch<YouTubeSettings>("/api/admin/youtube/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function testYouTubeConnection(): Promise<YouTubeConnectionTestResponse> {
  return apiFetch<YouTubeConnectionTestResponse>("/api/admin/youtube/test", {
    method: "POST",
  });
}

export async function fetchYouTubePlaylists(): Promise<YouTubePlaylist[]> {
  try {
    return await apiFetch<YouTubePlaylist[]>("/api/admin/youtube/playlists", {
      cache: "no-store",
    });
  } catch (error) {
    console.error("Error fetching YouTube playlists:", error);
    return [];
  }
}

export async function createYouTubePlaylist(data: {
  url_or_id: string;
  category_id: string;
  is_active?: boolean;
}): Promise<YouTubeImportResult> {
  return apiFetch<YouTubeImportResult>("/api/admin/youtube/playlists", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function syncYouTubePlaylist(id: string): Promise<YouTubeImportResult> {
  return apiFetch<YouTubeImportResult>(`/api/admin/youtube/playlists/${id}/sync`, {
    method: "POST",
  });
}

export async function updateYouTubePlaylist(
  id: string,
  data: Partial<YouTubePlaylist>
): Promise<YouTubePlaylist> {
  return apiFetch<YouTubePlaylist>(`/api/admin/youtube/playlists/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteYouTubePlaylist(id: string): Promise<void> {
  return apiFetch<void>(`/api/admin/youtube/playlists/${id}`, {
    method: "DELETE",
  });
}



