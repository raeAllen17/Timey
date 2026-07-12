import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Auth from '@/components/Auth';
import Timer from '@/components/Timer';
import SessionHistory from '@/components/SessionHistory';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [showHistory, setShowHistory] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h1 className="text-lg font-bold">Timey</h1>
        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </header>

      <Timer />

      <div className="border-t border-gray-800">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-center"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>

        {showHistory && (
          <div className="px-4 pb-4 max-h-64 overflow-y-auto">
            <SessionHistory />
          </div>
        )}
      </div>
    </div>
  );
}
