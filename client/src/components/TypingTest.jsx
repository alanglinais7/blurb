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
  const [error, setError] = useState(null);
  const [gameState, setGameState] = useState('waiting');
  const [mode, setMode] = useState('daily'); // 'daily' or 'practice'
  const inputRef = useRef(null);

  const fetchQuote = useCallback(async (quoteMode) => {
    setLoading(true);
    setError(null);
    try {
      const data = quoteMode === 'daily'
        ? await quotes.getDaily()
        : await quotes.getRandom();
      setQuote(data);
      setInput('');
      setStartTime(null);
      setEndTime(null);
      setGameState('waiting');
    } catch (err) {
      console.error('Failed to fetch quote:', err);
      setError('failed to load quote');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuote(mode);
  }, [mode]);

  useEffect(() => {
    if (gameState === 'waiting' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, quote]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    fetchQuote(newMode);
  };

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

      // Only submit score if logged in AND in daily mode
      if (user && mode === 'daily') {
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

  const [copied, setCopied] = useState(false);

  const getShareText = () => {
    const stats = getFinalStats();
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;

    // Get first ~30 chars of quote for preview
    const quotePreview = quote.text.length > 30
      ? quote.text.substring(0, 30).trim() + '...'
      : quote.text;

    return `blurble ${dateStr}

"${quotePreview}"
${stats.wpm} wpm · ${stats.time}s

blurble.xyz`;
  };

  const handleShare = async () => {
    const text = getShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const renderQuote = () => {
    if (!quote) return null;

    // Split into words (keeping spaces as separate elements)
    const words = quote.text.split(/(\s+)/);
    let charIndex = 0;

    return words.map((word, wordIndex) => {
      const chars = word.split('').map((char, i) => {
        const currentIndex = charIndex + i;
        let className = '';

        if (currentIndex < input.length) {
          className = input[currentIndex] === char ? 'correct' : 'incorrect';
        } else if (currentIndex === input.length) {
          className = 'cursor';
        }

        return (
          <span key={currentIndex} className={className}>
            {char}
          </span>
        );
      });

      charIndex += word.length;

      // Wrap non-space words in a span with nowrap to keep them together
      if (word.trim()) {
        return (
          <span key={wordIndex} style={{ whiteSpace: 'nowrap' }}>
            {chars}
          </span>
        );
      }
      // Return spaces as-is (allows line breaks)
      return chars;
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

  if (error) {
    return (
      <div className="typing-test">
        <p className="error">{error}</p>
        <button className="btn-primary" onClick={() => fetchQuote(mode)}>retry</button>
      </div>
    );
  }

  return (
    <div className="typing-test">
      <div className="mode-toggle">
        <button
          className={mode === 'daily' ? 'active' : ''}
          onClick={() => handleModeChange('daily')}
        >
          daily
        </button>
        <button
          className={mode === 'practice' ? 'active' : ''}
          onClick={() => handleModeChange('practice')}
        >
          practice
        </button>
      </div>

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
          {mode === 'daily' && !user && (
            <p className="login-prompt">login to save your score</p>
          )}
          {mode === 'practice' && (
            <p className="login-prompt">practice mode - score not recorded</p>
          )}
          <div className="results-actions">
            <button className="btn-secondary" onClick={handleShare}>
              {copied ? 'copied!' : 'share'}
            </button>
            <button className="btn-primary" onClick={() => fetchQuote(mode)}>
              {mode === 'daily' ? 'again' : 'next'}
            </button>
          </div>
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
              onPaste={(e) => e.preventDefault()}
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
