import { useState, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import TypingTest from './components/TypingTest';
import Leaderboard from './components/Leaderboard';
import './App.css';

function App() {
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  const handleScoreSubmit = useCallback(() => {
    setLeaderboardKey(prev => prev + 1);
  }, []);

  return (
    <ThemeProvider>
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
            <p>type the quote exactly. best daily score counts.</p>
          </footer>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
