import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'Aa2291718824',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Send user data to our backend to create/update user
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth-backend/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              googleId: user.id,
              email: user.email,
              username: user.name,
              avatar: user.image,
            }),
          })

          if (response.ok) {
            const userData = await response.json()
            // Store the JWT token and user data
            user.accessToken = userData.token
            user.userData = userData.user
            return true
          } else {
            // Handle backend errors
            const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }))
            console.error('Backend auth error:', errorData)
            
            // Return error string to be handled by NextAuth error page
            if (response.status === 409 || errorData.message?.includes('already exists')) {
              return '/login?error=UserExists'
            } else if (response.status === 400) {
              return '/login?error=InvalidData'
            } else {
              return '/login?error=AuthenticationFailed'
            }
          }
        } catch (error) {
          console.error('Error during Google authentication:', error)
          return '/login?error=NetworkError'
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and user data to the token right after signin
      if (account && user) {
        token.accessToken = (user as any).accessToken
        token.userData = (user as any).userData
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string
      session.user = token.userData as any
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

export default NextAuth(authOptions)