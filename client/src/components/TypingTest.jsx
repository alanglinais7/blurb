import { useState, useEffect, useRef, useCallback } from 'react';
import { quotes, scores } from '../api';
import { useAuth } from '../context/AuthContext';

export default function TypingTest({ onScoreSubmit }) {
  const { user } = useAuth();
  const [quote, setQuote] = useState(null);
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState('waiting');
  const inputRef = useRef(null);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quotes.getRandom();
      setQuote(data);
      setInput('');
      setStartTime(null);
      setEndTime(null);
      setGameState('waiting');
    } catch (err) {
      console.error('Failed to fetch quote:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  useEffect(() => {
    if (gameState === 'waiting' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, quote]);

  const handleInputChange = async (e) => {
    const value = e.target.value;

    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
      setGameState('playing');
    }

    setInput(value);

    if (value === quote.text) {
      const end = Date.now();
      setEndTime(end);
      setGameState('finished');

      const timeInMinutes = (end - startTime) / 60000;
      const wordCount = quote.text.length / 5;
      const wpm = Math.round(wordCount / timeInMinutes);
      const accuracy = 100;

      if (user) {
        try {
          await scores.submit(wpm, accuracy, quote.id);
          if (onScoreSubmit) onScoreSubmit();
        } catch (err) {
          console.error('Failed to submit score:', err);
        }
      }
    }
  };

  const calculateCurrentStats = () => {
    if (!startTime || !input) return { wpm: 0, accuracy: 0 };

    const timeInMinutes = (Date.now() - startTime) / 60000;
    const wordCount = input.length / 5;
    const wpm = timeInMinutes > 0 ? Math.round(wordCount / timeInMinutes) : 0;

    let correctChars = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === quote.text[i]) {
        correctChars++;
      }
    }
    const accuracy = input.length > 0 ? Math.round((correctChars / input.length) * 100) : 100;

    return { wpm, accuracy };
  };

  const getFinalStats = () => {
    if (!startTime || !endTime) return { wpm: 0, time: 0 };

    const timeInSeconds = (endTime - startTime) / 1000;
    const timeInMinutes = timeInSeconds / 60;
    const wordCount = quote.text.length / 5;
    const wpm = Math.round(wordCount / timeInMinutes);

    return { wpm, time: timeInSeconds.toFixed(1) };
  };

  const renderQuote = () => {
    if (!quote) return null;

    return quote.text.split('').map((char, index) => {
      let className = '';

      if (index < input.length) {
        className = input[index] === char ? 'correct' : 'incorrect';
      } else if (index === input.length) {
        className = 'cursor';
      }

      const displayChar = char === ' ' ? '\u00A0' : char;

      return (
        <span key={index} className={className}>
          {displayChar}
        </span>
      );
    });
  };

  const currentStats = calculateCurrentStats();

  if (loading) {
    return (
      <div className="typing-test">
        <p className="loading">loading...</p>
      </div>
    );
  }

  return (
    <div className="typing-test">
      {gameState === 'finished' ? (
        <div className="results">
          <h2>done</h2>
          <div className="stats-final">
            <div className="stat">
              <span className="value">{getFinalStats().wpm}</span>
              <span className="label">wpm</span>
            </div>
            <div className="stat">
              <span className="value">{getFinalStats().time}s</span>
              <span className="label">time</span>
            </div>
          </div>
          {!user && (
            <p className="login-prompt">login to save your score</p>
          )}
          <button className="btn-primary" onClick={fetchQuote}>
            again
          </button>
        </div>
      ) : (
        <>
          <div className="quote-display">
            <p className="quote-text">{renderQuote()}</p>
            {quote.source && <p className="quote-source">{quote.source}</p>}
          </div>

          <div className="input-area">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder={gameState === 'waiting' ? 'start typing...' : ''}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          {gameState === 'playing' && (
            <div className="stats-live">
              <span>{currentStats.wpm} wpm</span>
              <span>{currentStats.accuracy}%</span>
              <span>{input.length}/{quote.text.length}</span>
            </div>
          )}

          {gameState === 'waiting' && (
            <p className="hint">start typing to begin</p>
          )}
        </>
      )}
    </div>
  );
}
