import * as SecureStore from 'expo-secure-store';

// ─── Base URL ────────────────────────────────────────────────────────────────
// Local: Use your Wi-Fi IPv4. Production: set EXPO_PUBLIC_API_URL env var.
const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.209.217.227:3000';
export const API_URL = `${BASE}/api/mobile`;

interface FetchOptions extends RequestInit {
  data?: any;
}

// ─── API Client ──────────────────────────────────────────────────────────────
class ApiClient {
  private async getHeaders(customHeaders?: HeadersInit): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(customHeaders as any),
    });

    try {
      const sessionToken = await SecureStore.getItemAsync('sessionToken');
      if (sessionToken) {
        headers.set('Authorization', `Bearer ${sessionToken}`);
      }
    } catch {
      // SecureStore may not be available in web preview
    }

    return headers;
  }

  private async request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = await this.getHeaders(options.headers);

    const config: RequestInit = { ...options, headers, credentials: 'include' };
    if (options.data) config.body = JSON.stringify(options.data);

    try {
      const response = await fetch(url, config);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        if (response.status === 401) console.warn('[API] 401 — session expired');
        throw { status: response.status, message: (data as any)?.error || 'An error occurred', data };
      }
      return data as T;
    } catch (err: any) {
      if (err.status) throw err;
      throw { status: 0, message: err.message || 'Network error', originalError: err };
    }
  }

  get<T>(path: string, options?: Omit<FetchOptions, 'method' | 'data'>) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }
  post<T>(path: string, data?: any, options?: Omit<FetchOptions, 'method' | 'data'>) {
    return this.request<T>(path, { ...options, method: 'POST', data });
  }
  put<T>(path: string, data?: any, options?: Omit<FetchOptions, 'method' | 'data'>) {
    return this.request<T>(path, { ...options, method: 'PUT', data });
  }
  patch<T>(path: string, data?: any, options?: Omit<FetchOptions, 'method' | 'data'>) {
    return this.request<T>(path, { ...options, method: 'PATCH', data });
  }
  delete<T>(path: string, options?: Omit<FetchOptions, 'method' | 'data'>) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();

// ─── Typed Endpoint Helpers ───────────────────────────────────────────────────

// Auth
export const mobileApi = {
  // Auth & Registration
  getUniversities: () => api.get<any[]>('/auth/universities'),
  getFaculties: (uniId: string) => api.get<any[]>(`/auth/universities/${uniId}/faculties`),
  getAcademicYears: (facultyId: string) => api.get<any[]>(`/auth/faculties/${facultyId}/academic-years`),
  getSemesters: (yearId: string) => api.get<any[]>(`/auth/academic-years/${yearId}/semesters`),
  register: (data: { name: string; email: string; password: string; universityId?: string; facultyId?: string; semesterId?: string }) =>
    api.post<{ user: any }>('/auth/register', data),
  login: (data: { email?: string; studentId?: string; password: string }) =>
    api.post<{ token: string; user: any }>('/login', data),

  // Site Config (called once at startup)
  getSiteConfig: (universityId?: string) =>
    api.get<any>(`/site-config${universityId ? `?universityId=${universityId}` : ''}`),

  // Home Dashboard
  getHome: () => api.get<any>('/home'),

  // User
  getUserStats: () => api.get<any>('/users/stats'),
  updateProfile: (data: Partial<{ name: string; nickname: string; bio: string; image: string; theme: string; handle: string }>) =>
    api.put<any>('/users/stats', data),

  // Quizzes
  getPastPapers: (params: { semesterId: string; moduleId?: string; kind?: string; limit?: number; sort?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/past-papers?${q}`);
  },
  getPastPaperQuestions: (id: string) => api.get<{ pastPaper: any; questions: any[] }>(`/past-papers/${id}/questions`),
  submitQuiz: (data: { pastPaperId: string; answers: any[]; timeTaken: number; focusLossCount: number; guestQuizUserId?: string }) =>
    api.post<any>('/quiz-attempts', data),
  getQuizHistory: (limit = 20) => api.get<any[]>(`/quiz-attempts?limit=${limit}`),

  // Saved Questions
  getSavedQuestions: () => api.get<any[]>('/saved-questions'),
  toggleSavedQuestion: (questionId: string) => api.post<{ saved: boolean }>('/saved-questions', { questionId }),

  // Lectures
  getLectures: (params: { semesterId?: string; subjectId?: string; moduleId?: string; completed?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/lectures?${q}`);
  },
  getLectureDetail: (id: string) => api.get<any>(`/lectures/${id}`),
  trackLectureActivity: (lectureId: string, isCompleted: boolean, source?: string) =>
    api.post<any>('/lecture-activity', { lectureId, isCompleted, source }),

  // Library
  getSourceBooks: (params: { facultyId?: string; semesterId?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/source-books?${q}`);
  },
  getLibraryResources: (params: { category?: string; type?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/library-resources?${q}`);
  },

  // Forums
  getForums: (params: { universityId?: string; type?: string; semesterId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/forums?${q}`);
  },
  getForumPosts: (forumId: string, page = 1, limit = 20) =>
    api.get<any>(`/forums/${forumId}/posts?page=${page}&limit=${limit}`),
  createPost: (forumId: string, content: string, imageUrl?: string) =>
    api.post<any>(`/forums/${forumId}/posts`, { content, imageUrl }),
  likePost: (postId: string) => api.post<any>(`/posts/${postId}/like`),
  getComments: (postId: string) => api.get<any[]>(`/posts/${postId}/comments`),
  createComment: (postId: string, content: string, parentId?: string) =>
    api.post<any>(`/posts/${postId}/comments`, { content, parentId }),

  // Notifications
  getNotifications: (read?: boolean, limit = 30) =>
    api.get<{ notifications: any[]; unreadCount: number }>(`/notifications?${read !== undefined ? `read=${read}&` : ''}limit=${limit}`),
  markNotificationsRead: (ids?: string[]) => api.post<any>('/notifications', { ids }),

  // Tasks
  getTasks: (date?: string) => api.get<any[]>(`/tasks${date ? `?date=${date}` : ''}`),
  createTask: (data: { title: string; description?: string; time?: string; date?: string; lectureId?: string }) =>
    api.post<any>('/tasks', data),
  toggleTask: (id: string, completed: boolean) => api.patch<any>('/tasks', { id, completed }),

  // Leaderboard
  getLeaderboard: (params: { universityId?: string; semesterId?: string; facultyId?: string; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get<{ leaderboard: any[]; currentUser: any }>(`/leaderboard?${q}`);
  },
};
