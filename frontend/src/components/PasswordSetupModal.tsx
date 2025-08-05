import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface PasswordSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordSetupModal({ isOpen, onClose, onSuccess }: PasswordSetupModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const setupPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await api.post('/auth/set-password', { password });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password set successfully!');
      setPassword('');
      setConfirmPassword('');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set password');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setupPasswordMutation.mutate(password);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2 tracking-wide uppercase">
            Set Up Password
          </h2>
          <div className="w-12 h-1 bg-black dark:bg-white mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            To secure your account, please set up a password for this website.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-black dark:text-white mb-2 tracking-wide uppercase">
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Enter your new password"
              required
              minLength={6}
              disabled={setupPasswordMutation.isPending}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-black dark:text-white mb-2 tracking-wide uppercase">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Confirm your password"
              required
              minLength={6}
              disabled={setupPasswordMutation.isPending}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold tracking-wide uppercase hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={setupPasswordMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              disabled={setupPasswordMutation.isPending}
            >
              {setupPasswordMutation.isPending ? 'Setting Up...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}