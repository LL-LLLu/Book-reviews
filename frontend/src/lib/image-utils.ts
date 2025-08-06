/**
 * Utility function to get the correct image URL
 * Handles both local uploads and external URLs (like Google avatars)
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // If it's already a complete URL (starts with http/https), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Get base URL with fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
                  '';
  
  // Otherwise, prepend the base URL for local uploads
  return `${baseUrl}${imagePath}`;
}

/**
 * Check if an avatar is from Google (external URL)
 */
export function isGoogleAvatar(avatarUrl: string | null | undefined): boolean {
  return avatarUrl?.startsWith('http') || false;
}

/**
 * Check if an avatar is a custom upload (local file)
 */
export function isCustomAvatar(avatarUrl: string | null | undefined): boolean {
  return avatarUrl && !avatarUrl.startsWith('http') || false;
}

/**
 * Get avatar source type
 */
export function getAvatarSource(avatarUrl: string | null | undefined): 'google' | 'custom' | 'none' {
  if (!avatarUrl) return 'none';
  if (avatarUrl.startsWith('http')) return 'google';
  return 'custom';
}

/**
 * Hook version for React components
 */
export function useImageUrl(imagePath: string | null | undefined): string | null {
  return getImageUrl(imagePath);
}