import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
// import type { Provider } from 'next-auth/providers';
// import type { AuthProvider } from '@toolpad/core';
import axios from 'axios';

const providers = [
  Credentials({
    credentials: {
      email: { label: 'Email Address', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: async (credentials) => {
      try {
        // Make a POST request to your backend API
        const response = await axios.post('http://localhost:3001/auth/login', {
          email: credentials.email,
          password: credentials.password,
        });

        const user = response.data.token;
        // If login is successful and user data is returned
        if (user) {
          return {
            id: user.user.id,
            name: user.user.name,
            email: credentials.email,
            token: user.token,
            roles: user.user.role,
            dept: user.user.dept,
            position: user.user.position,
          };
        }

        // If no user is returned
        return null;
      } catch (error) {
        // Handle any error that occurs during the API call
        console.error('Error during login:', error);
        return null;
      }
    },
  }),
];

export const providerMap = providers.map((provider) => {
  if (typeof provider === 'function') {
    const providerData = provider();
    return { id: providerData.id, name: providerData.name };
  }
  return { id: provider.id, name: provider.name };
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = user.roles;
        token.token = user.token;
        token.dept = user.dept;
        token.position = user.position;
      }
      return token;
    },
    async session({ session, token, user }) {
      session.user.roles = token.roles;
      session.user.dept = token.dept;
      session.user.position = token.position;
      session.user.token = token.token;
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith('/public');

      if (isPublicPage || isLoggedIn) {
        return true;
      }

      return false; // Redirect unauthenticated users to login page
    },
  },
});
