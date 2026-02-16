import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';

const authConfig: NextAuthConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    CredentialProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // ЛОГІКА РОЛЕЙ (для тесту):
        // Якщо пошта admin@gmail.com — роль 'admin', для всіх інших — 'user'
        const role = credentials.email === 'admin@gmail.com' ? 'admin' : 'user';

        const user = {
          id: '1',
          name: role === 'admin' ? 'Administrator' : 'Regular User',
          email: credentials.email as string,
          role: role // Додаємо роль у об'єкт користувача
        };

        return user;
      }
    })
  ],
  pages: {
    signIn: '/' // сторінка входу
  },
  callbacks: {
    // 1. Записуємо роль у Токен (JWT)
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    // 2. Передаємо роль із Токена в Сесію (щоб бачити її в браузері та на сервері)
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  debug: process.env.NODE_ENV !== 'production',
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

export default authConfig;
