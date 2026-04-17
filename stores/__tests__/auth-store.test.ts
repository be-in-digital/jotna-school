import { useAuthStore } from "../auth-store";
import type { User } from "../auth-store";

const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  role: "student",
};

const mockAdminUser: User = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin User",
  role: "admin",
  avatar: "https://example.com/avatar.png",
};

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe("initial state", () => {
    it("should have null user", () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("should not be authenticated", () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("should not be loading", () => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("setUser", () => {
    it("should set the user and mark as authenticated", () => {
      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should handle user with optional avatar", () => {
      useAuthStore.getState().setUser(mockAdminUser);

      const state = useAuthStore.getState();
      expect(state.user?.avatar).toBe("https://example.com/avatar.png");
    });

    it("should replace existing user", () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setUser(mockAdminUser);

      expect(useAuthStore.getState().user).toEqual(mockAdminUser);
    });
  });

  describe("clearUser", () => {
    it("should clear the user and mark as not authenticated", () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().clearUser();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("should be safe to call when already cleared", () => {
      useAuthStore.getState().clearUser();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("setLoading", () => {
    it("should set loading to true", () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it("should set loading to false", () => {
      useAuthStore.getState().setLoading(true);
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("should not affect user or authentication state", () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setLoading(true);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(true);
    });
  });
});
