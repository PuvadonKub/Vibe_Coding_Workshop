// Mock hooks for authentication mutations
import { useMutation } from '@tanstack/react-query';

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      // Mock implementation
      return { user: { id: '1', username: data.username } };
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      // Mock implementation
      return { user: { id: '1', username: data.username } };
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      // Mock implementation
      return {};
    },
  });
};