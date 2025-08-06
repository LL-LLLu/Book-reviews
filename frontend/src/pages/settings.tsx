import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/auth';
import { getImageUrl, isGoogleAvatar, getAvatarSource } from '@/lib/image-utils';

export default function SettingsPage() {
  const { user, checkAuth } = useAuth();
  const queryClient = useQueryClient();
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    favoriteGenres: user?.favoriteGenres || []
  });
  
  const [emailForm, setEmailForm] = useState({
    email: user?.email || '',
    password: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const genres = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
    'Thriller', 'Romance', 'Biography', 'History', 'Self-Help'
  ];

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/auth/profile', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      checkAuth();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  // Email update mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/auth/email', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Email updated successfully');
      setEmailForm({ ...emailForm, password: '' });
      checkAuth();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update email');
    }
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/auth/password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  });

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('Starting avatar upload mutation...');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Log the actual FormData content
      console.log('FormData contents:');
      // Use Array.from for TypeScript compatibility
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`  ${key}:`, value);
      });
      
      const response = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Avatar upload response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Avatar upload success:', data);
      toast.success('Avatar updated successfully');
      setAvatarPreview(null);
      // Force refresh user data from API
      checkAuth(true);
    },
    onError: (error: any) => {
      console.error('Avatar upload error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    }
  });

  // Delete avatar mutation
  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/auth/avatar');
      return response.data;
    },
    onSuccess: (data) => {
      const avatarSource = getAvatarSource(user?.avatar);
      if (avatarSource === 'google') {
        toast.success('Reverted to Google profile picture');
      } else {
        toast.success('Avatar deleted successfully');
      }
      setAvatarPreview(null);
      // Force refresh user data from API
      checkAuth(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete avatar');
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.password) {
      toast.error('Please enter your current password');
      return;
    }
    updateEmailMutation.mutate(emailForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Avatar upload attempt:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userEmail: user?.email,
        userId: user?._id,
        currentAvatar: user?.avatar,
        hasGoogleAvatar: user?.avatar?.startsWith('http'),
        token: localStorage.getItem('token')?.substring(0, 20) + '...' // Only show first 20 chars for security
      });
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleGenreToggle = (genre: string) => {
    const currentGenres = profileForm.favoriteGenres;
    const updatedGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    
    setProfileForm({ ...profileForm, favoriteGenres: updatedGenres });
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">Please login to access settings.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'account', label: 'Account', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { id: 'security', label: 'Security', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> }
  ];

  return (
    <Layout>
      <Head>
        <title>Settings - Book Review Hub</title>
        <meta name="description" content="Manage your account settings" />
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-black dark:text-white mb-3">Settings</h1>
          <div className="w-16 h-1 bg-black dark:bg-white mb-12"></div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 border-2 ${
                      activeTab === tab.id
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'text-black dark:text-white border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    <span className="text-current">{tab.icon}</span>
                    <span className="font-bold tracking-wide uppercase text-xs">{tab.label}</span>
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:w-3/4">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="border border-gray-200 dark:border-gray-700 p-8"
              >
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white mb-3">Profile Information</h2>
                    <div className="w-12 h-1 bg-black dark:bg-white mb-8"></div>
                    
                    {/* Avatar Section */}
                    <div className="mb-8">
                      <label className="block text-sm font-bold text-black dark:text-white mb-4 tracking-wide uppercase">Profile Picture</label>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          {user.avatar || avatarPreview ? (
                            <>
                              <Image
                                src={avatarPreview || getImageUrl(user.avatar)!}
                                alt="Avatar"
                                width={96}
                                height={96}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg"
                              />
                              {/* Avatar source indicator */}
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                {getAvatarSource(user?.avatar) === 'google' ? (
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center" title="Google Profile Picture">
                                    <span className="text-white text-xs font-bold">G</span>
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center" title="Custom Upload">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-2xl font-bold text-white">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {uploadAvatarMutation.isPending && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-2">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                                disabled={uploadAvatarMutation.isPending}
                              />
                              <span className="inline-flex items-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                                Upload Custom Photo
                              </span>
                            </label>
                            
                            {user.avatar && (
                              <button
                                onClick={() => deleteAvatarMutation.mutate()}
                                disabled={deleteAvatarMutation.isPending}
                                className="inline-flex items-center px-4 py-2 border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
{getAvatarSource(user?.avatar) === 'google' ? 'Reset to Google Photo' : 'Remove Photo'}
                              </button>
                            )}
                          </div>
                          
                          {/* Avatar source info */}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getAvatarSource(user?.avatar) === 'google' ? (
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Currently using Google profile picture
                              </div>
                            ) : getAvatarSource(user?.avatar) === 'custom' ? (
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Using custom uploaded photo
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                No profile picture set
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Google Account Users:</strong> You can upload your own custom profile picture to override your Google photo. 
                          Upload a photo (max 5MB, JPG/PNG/GIF) or click "Reset to Google Photo" to revert back.
                        </p>
                      </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Username</label>
                        <input
                          type="text"
                          value={profileForm.username}
                          onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          required
                          minLength={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Bio</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          rows={3}
                          maxLength={500}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors resize-none"
                          placeholder="Tell us about yourself..."
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{profileForm.bio.length}/500 characters</p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-black dark:text-white mb-4 tracking-wide uppercase">Favorite Genres</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {genres.map((genre) => (
                            <motion.button
                              key={genre}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleGenreToggle(genre)}
                              className={`px-4 py-2 border-2 transition-all duration-200 font-medium ${
                                profileForm.favoriteGenres.includes(genre)
                                  ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                                  : 'border-gray-300 dark:border-gray-600 text-black dark:text-white hover:border-black dark:hover:border-white'
                              }`}
                            >
                              {genre}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="w-full px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                      </motion.button>
                    </form>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white mb-3">Account Settings</h2>
                    <div className="w-12 h-1 bg-black dark:bg-white mb-8"></div>
                    
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Email Address</label>
                        <input
                          type="email"
                          value={emailForm.email}
                          onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Current Password</label>
                        <input
                          type="password"
                          value={emailForm.password}
                          onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          placeholder="Enter your current password to confirm changes"
                          required
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={updateEmailMutation.isPending}
                        className="w-full px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updateEmailMutation.isPending ? 'Updating...' : 'Update Email'}
                      </motion.button>
                    </form>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white mb-3">Password Security</h2>
                    <div className="w-12 h-1 bg-black dark:bg-white mb-8"></div>
                    
                    {/* Google user without password setup */}
                    {user.googleId && !user.passwordSetup && (
                      <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">Set Up a Password</h3>
                            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                              You signed in with Google. For additional security, please set up a password for this website.
                            </p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                              This will allow you to sign in with either Google or your password.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Google user with password setup or regular user */}
                    {(!user.googleId || user.passwordSetup) && (
                      <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        {/* Show current password field for regular users or Google users who want to change password */}
                        <div>
                          <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">
                            {user.googleId ? 'Current Password (Optional)' : 'Current Password'}
                          </label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            required={!user.googleId}
                          />
                          {user.googleId && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Leave empty if you want to change password without verifying current one
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">New Password</label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            minLength={6}
                            required
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Must be at least 6 characters long</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-black dark:text-white mb-3 tracking-wide uppercase">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            required
                          />
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={updatePasswordMutation.isPending}
                          className="w-full px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold tracking-wide uppercase hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                        </motion.button>
                      </form>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}