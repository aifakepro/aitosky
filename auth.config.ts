import { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Github from 'next-auth/providers/github';

const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET
    }),
    Github({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    })
  ],
  pages: {
    signIn: '/'
  },
  callbacks: {
    // Выполняется при создании JWT токена
    async jwt({ token, user }) {
      if (user) {
        // Когда юзер только залогинился, берем его роль из базы и кладем в токен
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    // Выполняется при проверке сессии в браузере
    async session({ session, token }) {
      if (session.user) {
        // Передаем роль и ID из токена в сессию
        (session.user as any).role = token.role;
        (session.user as any).id = token.id as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true
};

export default authConfig;
