import { redirect } from 'next/navigation';

export default function HomePage() {
  // Middleware will bounce unauthenticated visitors to /login.
  redirect('/patients');
}
