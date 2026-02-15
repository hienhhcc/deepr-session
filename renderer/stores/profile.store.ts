"use client";

import { create } from "zustand";
import type {
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
} from "@shared/types/profile";
import { getElectronAPI } from "@/lib/electron-api";

interface ProfileState {
  profiles: Profile[];
  loading: boolean;
  fetchProfiles: () => Promise<void>;
  createProfile: (input: CreateProfileInput) => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profiles: [],
  loading: false,

  fetchProfiles: async () => {
    const api = getElectronAPI();
    if (!api) return;
    set({ loading: true });
    try {
      const profiles = await api.profile.list();
      set({ profiles });
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      set({ loading: false });
    }
  },

  createProfile: async (input: CreateProfileInput) => {
    const api = getElectronAPI();
    if (!api) return;
    try {
      const profile = await api.profile.create(input);
      set((state) => ({ profiles: [...state.profiles, profile] }));
    } catch (error) {
      console.error("Failed to create profile:", error);
    }
  },

  updateProfile: async (input: UpdateProfileInput) => {
    const api = getElectronAPI();
    if (!api) return;
    try {
      const updated = await api.profile.update(input);
      set((state) => ({
        profiles: state.profiles.map((p) => (p.id === updated.id ? updated : p)),
      }));
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  },

  deleteProfile: async (id: string) => {
    const api = getElectronAPI();
    if (!api) return;
    try {
      await api.profile.delete(id);
      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete profile:", error);
    }
  },
}));
