import {
  HealthStatus,
  Category,
  CategoryDetail,
  Song,
  AdminUser,
  AuthResponse,
  FileUploadResponse,
  CategorySongOrderItem,
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

