import { useState, useEffect } from 'react';
import { scores } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile({ onClose }) {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await scores.getHistory();
        setHistory(data);
      } catch (err) {
        setError('failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Group scores by date
  const groupedScores = history?.scores?.reduce((acc, score) => {
    const date = new Date(score.played_at).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(score);
    return acc;
  }, {}) || {};

  return (
    <div className="auth-modal" onClick={onClose}>
      <div className="profile-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <h2>{user?.username}</h2>

        {loading && <p className="loading">loading...</p>}
        {error && <p className="error">{error}</p>}

        {history && (
          <>
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="value">{history.stats.best_wpm || 0}</span>
                <span className="label">best wpm</span>
              </div>
              <div className="profile-stat">
                <span className="value">{history.stats.avg_wpm || 0}</span>
                <span className="label">avg wpm</span>
              </div>
              <div className="profile-stat">
                <span className="value">{history.stats.total_games || 0}</span>
                <span className="label">games</span>
              </div>
              <div className="profile-stat">
                <span className="value">{history.stats.days_played || 0}</span>
                <span className="label">days</span>
              </div>
            </div>

            <div className="profile-history">
              <h3>history</h3>
              {Object.keys(groupedScores).length === 0 ? (
                <p className="empty">no games played yet</p>
              ) : (
                Object.entries(groupedScores).map(([date, dateScores]) => (
                  <div key={date} className="history-day">
                    <div className="history-date">{formatDate(date)}</div>
                    {dateScores.map((score, i) => (
                      <div key={i} className="history-item">
                        <span className="history-wpm">{score.wpm} wpm</span>
                        <span className="history-quote">
                          {score.quote_text?.substring(0, 40)}...
                        </span>
                        <span className="history-time">{formatTime(score.played_at)}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
