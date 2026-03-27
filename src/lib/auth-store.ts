export const authStore = {
  getUserId: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("trustlens_user_id");
  },
  setUserId: (id: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("trustlens_user_id", id);
  },
  clearUserId: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("trustlens_user_id");
  },
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("trustlens_user_id");
  },
};
