'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import GithubSignInButton from '../github-auth-button';
import GoogleSignInButton from '../google-auth-button';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

const signInSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).regex(/^[a-zA-Z0-9!@#$%^&*]+$/, { message: 'Only Latin letters and digits' })
});

const registerSchema = z
  .object({
    email: z.string().email({ message: 'Enter a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(6, { message: 'Please confirm your password' }).regex(/^[a-zA-Z0-9!@#$%^&*]+$/, { message: 'Только латиница и цифры' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type SignInFormValue = z.infer<typeof signInSchema>;
type RegisterFormValue = z.infer<typeof registerSchema>;
type UserFormValue = SignInFormValue & { confirmPassword?: string };

export default function UserAuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Visibility toggles for each password field
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<UserFormValue>({
    resolver: zodResolver(isRegister ? registerSchema : signInSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' }
  });

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    setError(null);

    if (isRegister) {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password })
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.message ?? 'Registration failed');
        setLoading(false);
        return;
      }
    }

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      callbackUrl: callbackUrl ?? '/dashboard',
      redirect: false
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    window.location.href = callbackUrl ?? '/dashboard';
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    form.reset({ email: '', password: '', confirmPassword: '' });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-2">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password..."
                      disabled={loading}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isRegister && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Confirm Password — only shown during registration */}
          {isRegister && (
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat your password..."
                        disabled={loading}
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button disabled={loading} className="ml-auto w-full" type="submit">
            {isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={handleToggleMode}
          className="underline underline-offset-4 hover:text-primary"
        >
          {isRegister ? 'Sign in' : 'Register'}
        </button>
      </p>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <GoogleSignInButton />
      <GithubSignInButton />
    </>
  );
}