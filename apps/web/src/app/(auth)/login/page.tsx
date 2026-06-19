import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Activity className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Patients Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access the patient directory
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
