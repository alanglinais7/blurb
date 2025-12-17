import { useState, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import TypingTest from './components/TypingTest';
import Leaderboard from './components/Leaderboard';
import './App.css';

function App() {
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  const handleScoreSubmit = useCallback(() => {
    // Refresh leaderboard when a score is submitted
    setLeaderboardKey(prev => prev + 1);
  }, []);

  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main className="main">
          <div className="game-section">
            <TypingTest onScoreSubmit={handleScoreSubmit} />
          </div>
          <aside className="sidebar">
            <Leaderboard key={leaderboardKey} />
          </aside>
        </main>
        <footer className="footer">
          <p>Type the quote exactly as shown. Your best daily score counts!</p>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
