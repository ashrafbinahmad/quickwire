'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AxiosRequestConfig } from 'axios';

export const useAuthenticatedRequest = () => {
  const { token } = useAuth();

  const getAuthConfig = (): AxiosRequestConfig => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  return { getAuthConfig };
};