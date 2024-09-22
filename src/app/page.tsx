'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // use `next/navigation` for useRouter in App Router
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [username, setUsername] = useState('');
  const router = useRouter(); // Use the new `useRouter` from next/navigation

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username) {
      router.push(`/challenges?username=${encodeURIComponent(username)}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Wedding Photo Challenge</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full"
          />
          <Button type="submit" className="w-full">
            Start Challenge
          </Button>
        </form>
      </div>
    </div>
  );
}
