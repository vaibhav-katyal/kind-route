const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getToken = () => localStorage.getItem("kindroute-token");
export const setToken = (token) => {
  if (token) localStorage.setItem("kindroute-token", token);
  else localStorage.removeItem("kindroute-token");
};
export const removeToken = () => localStorage.removeItem("kindroute-token");

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.warn(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Auth
  register: (userData) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  getMe: () => apiRequest("/auth/me"),

  updateProfile: (profileData) =>
    apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  switchRole: (targetRole) =>
    apiRequest("/auth/switch-role", {
      method: "POST",
      body: JSON.stringify({ targetRole }),
    }),

  // Donations
  getDonations: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiRequest(`/donations${query}`);
  },

  getDonationById: (id) => apiRequest(`/donations/${id}`),

  createDonation: (donationData) =>
    apiRequest("/donations", {
      method: "POST",
      body: JSON.stringify(donationData),
    }),

  reserveDonation: (id, ngoName) =>
    apiRequest(`/donations/${id}/reserve`, {
      method: "POST",
      body: JSON.stringify({ ngoName }),
    }),

  releaseDonation: (id) =>
    apiRequest(`/donations/${id}/release`, {
      method: "POST",
    }),

  completeDonation: (id) =>
    apiRequest(`/donations/${id}/complete`, {
      method: "POST",
    }),

  deleteDonation: (id) =>
    apiRequest(`/donations/${id}`, {
      method: "DELETE",
    }),

  // Needs
  getNeeds: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category && params.category !== "All items") {
      searchParams.append("category", params.category);
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiRequest(`/needs${query}`);
  },

  createNeed: (needData) =>
    apiRequest("/needs", {
      method: "POST",
      body: JSON.stringify(needData),
    }),

  // Stats
  getStats: () => apiRequest("/stats"),
};

export default api;
