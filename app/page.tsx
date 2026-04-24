import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
      <h1 className="text-4xl font-bold mb-8">Welcome to PhishSlayer</h1>
      <div className="flex gap-4">
        <Link 
          href="/sign-in"
          className="px-6 py-2 bg-primary rounded-full font-bold hover:opacity-90 transition-all"
        >
          Sign In
        </Link>
        <Link 
          href="/sign-up"
          className="px-6 py-2 border border-white/20 rounded-full font-bold hover:bg-white/5 transition-all"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
