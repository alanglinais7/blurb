import { useState, useEffect } from 'react';
import { scores } from '../api';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      const data = await scores.getLeaderboard();
      setLeaderboard(data);
      setError('');
    } catch (err) {
      setError('failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeUntilReset = () => {
    const now = new Date();
    const estOffset = -5 * 60;
    const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
    const estNow = new Date(utcNow + estOffset * 60000);

    const midnight = new Date(estNow);
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight - estNow;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="leaderboard">
        <h2>today</h2>
        <p className="loading">loading...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>today</h2>
        <span className="reset-timer">resets {timeUntilReset}</span>
      </div>

      {error && <p className="error">{error}</p>}

      {leaderboard.length === 0 ? (
        <p className="empty">no scores yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>name</th>
              <th>wpm</th>
              <th>acc</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={index}>
                <td className="rank">{index + 1}</td>
                <td className="username">{entry.username}</td>
                <td className="wpm">{Math.round(entry.wpm)}</td>
                <td className="accuracy">{Math.round(entry.accuracy)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
