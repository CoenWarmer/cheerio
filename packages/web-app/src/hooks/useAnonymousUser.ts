'use client';

import { useState, useEffect } from 'react';
import { anonymousUserStorage } from '@/lib/anonymous-user';
import {
  anonymousProfilesApi,
  type AnonymousProfile,
} from '@/lib/api/anonymous-profiles-api';
import { useUser } from './useUser';

interface UseAnonymousUserResult {
  anonymousId: string | null;
  anonymousProfile: AnonymousProfile | null;
  isAnonymous: boolean;
  isLoading: boolean;
  createAnonymousProfile: (displayName: string) => Promise<void>;
  updateAnonymousProfile: (displayName: string) => Promise<void>;
  clearAnonymousData: () => void;
}

/**
 * Hook to manage anonymous user state
 * Handles localStorage persistence and profile management
 */
export function useAnonymousUser(): UseAnonymousUserResult {
  const { user } = useUser();
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [anonymousProfile, setAnonymousProfile] =
    useState<AnonymousProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load anonymous ID from localStorage on mount
  useEffect(() => {
    const id = anonymousUserStorage.getId();
    setAnonymousId(id);

    // If we have an ID, fetch the profile
    if (id) {
      loadProfile(id);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Clear anonymous data if user logs in
  useEffect(() => {
    if (user) {
      anonymousUserStorage.clear();
      setAnonymousId(null);
      setAnonymousProfile(null);
    }
  }, [user]);

  const loadProfile = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await anonymousProfilesApi.get(id);
      if (error) {
        console.error('Error loading anonymous profile:', error);
        // If profile doesn't exist, clear the ID
        anonymousUserStorage.clear();
        setAnonymousId(null);
      } else if (data) {
        setAnonymousProfile(data);
        anonymousUserStorage.setName(data.display_name);
      }
    } catch (err) {
      console.error('Error loading anonymous profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createAnonymousProfile = async (displayName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await anonymousProfilesApi.create(displayName);
      if (error) throw error;

      if (data) {
        anonymousUserStorage.setId(data.id);
        anonymousUserStorage.setName(data.display_name);
        setAnonymousId(data.id);
        setAnonymousProfile(data);
      }
    } catch (err) {
      console.error('Error creating anonymous profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAnonymousProfile = async (displayName: string) => {
    if (!anonymousId) {
      throw new Error('No anonymous profile to update');
    }

    setIsLoading(true);
    try {
      const { data, error } = await anonymousProfilesApi.update(anonymousId, {
        display_name: displayName,
      });
      if (error) throw error;

      if (data) {
        anonymousUserStorage.setName(data.display_name);
        setAnonymousProfile(data);
      }
    } catch (err) {
      console.error('Error updating anonymous profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearAnonymousData = () => {
    anonymousUserStorage.clear();
    setAnonymousId(null);
    setAnonymousProfile(null);
  };

  return {
    anonymousId,
    anonymousProfile,
    isAnonymous: !user && anonymousId !== null,
    isLoading,
    createAnonymousProfile,
    updateAnonymousProfile,
    clearAnonymousData,
  };
}
