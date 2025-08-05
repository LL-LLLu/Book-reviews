import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    accessToken: string
    user: {
      _id: string
      username: string
      email: string
      role: string
      avatar?: string
      bio?: string
      favoriteGenres?: string[]
      googleId?: string
      passwordSetup?: boolean
    }
  }

  interface User {
    accessToken?: string
    userData?: any
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    userData?: {
      _id: string
      username: string
      email: string
      role: string
      avatar?: string
      bio?: string
      favoriteGenres?: string[]
      googleId?: string
      passwordSetup?: boolean
    }
  }
}