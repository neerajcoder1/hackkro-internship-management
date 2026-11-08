const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

/**
 * Reusable helper to perform authenticated and unauthenticated API requests.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('hackkro_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.statusCode = response.status;
    error.errors = data.errors || [];
    throw error;
  }

  return data;
}

export const authService = {
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me', {
      method: 'GET',
    });
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('hackkro_token');
    }
  },

  getInterns: async () => {
    return apiRequest('/auth/interns', {
      method: 'GET',
    });
  },
};

export const taskService = {
  // Admin: create task
  createTask: async (taskData) => {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  // Admin: get all tasks
  getAllTasks: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/tasks?${query}` : '/tasks';
    return apiRequest(endpoint, {
      method: 'GET',
    });
  },

  // Shared: get task by id
  getTaskById: async (id) => {
    return apiRequest(`/tasks/${id}`, {
      method: 'GET',
    });
  },

  // Intern: get assigned tasks
  getMyTasks: async () => {
    return apiRequest('/tasks/my-tasks', {
      method: 'GET',
    });
  },

  // Admin: update task
  updateTask: async (id, taskData) => {
    return apiRequest(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  },

  // Admin: delete task
  deleteTask: async (id) => {
    return apiRequest(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

export const submissionService = {
  // Intern: submit task
  submitTask: async (submissionData) => {
    return apiRequest('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  },

  // Admin: get all submissions
  getAllSubmissions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/submissions?${query}` : '/submissions';
    return apiRequest(endpoint, {
      method: 'GET',
    });
  },

  // Intern: get my submissions
  getMySubmissions: async () => {
    return apiRequest('/submissions/my-submissions', {
      method: 'GET',
    });
  },

  // Intern: get points breakdown
  getMyPoints: async () => {
    return apiRequest('/submissions/my-points', {
      method: 'GET',
    });
  },

  // Admin: review submission
  reviewSubmission: async (id, reviewData) => {
    return apiRequest(`/submissions/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
    });
  },

  // Admin: hide single evaluation history record from admin's view
  hideHistoryItem: async (id) => {
    return apiRequest(`/submissions/history/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin: clear all evaluation history records from admin's view
  clearAllHistory: async () => {
    return apiRequest('/submissions/history', {
      method: 'DELETE',
    });
  },
};
