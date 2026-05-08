'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  Sparkles,
  Minimize2,
  Zap,
  Activity
} from 'lucide-react';
import styles from './ChatBot.module.css';
import { useStockContext } from '@/lib/StockContext';

const GENERAL_SUGGESTIONS = [
  'What is RSI?',
  'Explain VWAP',
  'What is a stop loss?',
  'How to read candlesticks?',
  'What is Supertrend?',
];

const STOCK_SUGGESTIONS = [
  'Should I buy this stock?',
  'What does the signal say?',
  'Explain the current setup',
  'Is the risk worth it?',
  'What are the key levels?',
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatWindowRef = useRef(null);
  const { stockData } = useStockContext();

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  }, [input]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsClosing(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Build context from live stock data
  const buildContext = () => {
    if (!stockData) {
      return {
        symbol: 'General',
        price: '--',
        change: '--',
        signal: 'N/A',
        confidence: '--',
        vwap: '--',
        rsi: '--',
        supertrend: '--',
        adx: '--',
        atr: '--',
        setup: 'User is asking a general question about trading concepts',
        regime: '--',
        vix: '--',
        sectorTrend: '--',
        niftyTrend: '--',
        entry: '--',
        sl: '--',
        t1: '--',
        t2: '--',
        rr: '--',
        orbHigh: '--',
        orbLow: '--',
        dayHigh: '--',
        dayLow: '--',
        prevClose: '--',
        volume: '--',
        news: 'No specific stock context — user is asking a general trading/technical analysis question.',
      };
    }

    return {
      symbol: stockData.symbol,
      displaySymbol: stockData.displaySymbol,
      price: stockData.price,
      change: stockData.change,
      signal: stockData.signal,
      confidence: stockData.confidence,
      vwap: stockData.vwap,
      rsi: stockData.rsi,
      supertrend: stockData.supertrend,
      supertrendDir: stockData.supertrendDir,
      adx: stockData.adx,
      atr: stockData.atr,
      setup: stockData.setup,
      setupDesc: stockData.setupDesc,
      regime: stockData.regime,
      vix: stockData.vix,
      sectorTrend: stockData.sectorTrend,
      niftyTrend: stockData.niftyTrend,
      trend15m: stockData.trend15m,
      entry: stockData.entry,
      sl: stockData.sl,
      t1: stockData.t1,
      t2: stockData.t2,
      t3: stockData.t3,
      qty: stockData.qty,
      rr: stockData.rr,
      dayHigh: stockData.dayHigh,
      dayLow: stockData.dayLow,
      prevClose: stockData.prevClose,
      volume: stockData.volume,
      verdictReason: stockData.verdictReason,
      buyVotes: stockData.buyVotes,
      sellVotes: stockData.sellVotes,
      warnings: stockData.warnings?.join(', ') || 'None',
      volRatio: stockData.volRatio,
      news: 'No news data available at this time.',
    };
  };

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      time: formatTime(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setError(null);
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const context = buildContext();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          context: context,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();

      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: data.reply || 'Sorry, I could not generate a response. Please try again.',
        time: formatTime(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to connect. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    // Resend the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Format bot responses with basic markdown-like styling
  const formatBotMessage = (text) => {
    // Bold **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  const hasStock = !!stockData;
  const suggestions = hasStock ? STOCK_SUGGESTIONS : GENERAL_SUGGESTIONS;

  return (
    <>
      {/* FAB Button */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
        id="chatbot-fab"
      >
        {!isOpen && <span className={styles.fabPulse} />}
        <span className={styles.fabIcon}>
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </span>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div className={styles.mobileOverlay} onClick={handleClose} />
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className={`${styles.chatWindow} ${isClosing ? styles.chatWindowClosing : ''}`}
          id="chatbot-window"
        >
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.chatAvatar}>
                <Bot size={20} color="white" />
                <span className={styles.chatAvatarOnline} />
              </div>
              <div className={styles.chatHeaderInfo}>
                <h3>StockPulse AI</h3>
                <p>
                  <Zap size={10} /> Powered by AI
                </p>
              </div>
            </div>
            <div className={styles.headerActions}>
              {messages.length > 0 && (
                <button 
                  className={styles.clearBtn} 
                  onClick={clearChat}
                  title="Clear chat"
                >
                  <Trash2 size={12} /> Clear
                </button>
              )}
              <button 
                className={styles.headerBtn} 
                onClick={handleClose}
                title="Minimize"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Active Stock Banner */}
          {hasStock && (
            <div className={styles.stockBanner}>
              <div className={styles.stockBannerIcon}>
                <Activity size={14} />
              </div>
              <div className={styles.stockBannerInfo}>
                <span className={styles.stockBannerSymbol}>{stockData.displaySymbol}</span>
                <span className={styles.stockBannerPrice}>₹{typeof stockData.price === 'number' ? stockData.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : stockData.price}</span>
              </div>
              <span className={`${styles.stockBannerSignal} ${
                stockData.signal?.includes('BUY') ? styles.signalBuy : 
                stockData.signal?.includes('SELL') ? styles.signalSell : 
                styles.signalNeutral
              }`}>
                {stockData.signal} • {stockData.confidence}%
              </span>
            </div>
          )}

          {/* Messages */}
          <div className={styles.chatMessages}>
            {messages.length === 0 && !isLoading ? (
              <div className={styles.welcomeState}>
                <div className={styles.welcomeIcon}>
                  <Sparkles size={26} color="white" />
                </div>
                {hasStock ? (
                  <>
                    <h4>Analyzing {stockData.displaySymbol} 📊</h4>
                    <p>
                      I have all the live data for <strong>{stockData.displaySymbol}</strong> — 
                      price, VWAP, RSI, signals, and more.
                      Ask me anything about this stock!
                    </p>
                  </>
                ) : (
                  <>
                    <h4>Hey! I&apos;m StockPulse AI 👋</h4>
                    <p>
                      Ask me anything about trading, technical analysis, indicators, 
                      or stock market concepts. Search for a stock to get live analysis!
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <div
                      className={`${styles.message} ${
                        msg.role === 'user' ? styles.messageUser : styles.messageBot
                      }`}
                    >
                      <div
                        className={`${styles.msgAvatar} ${
                          msg.role === 'user' ? styles.msgAvatarUser : styles.msgAvatarBot
                        }`}
                      >
                        {msg.role === 'user' ? 'Y' : <Bot size={14} />}
                      </div>
                      <div>
                        <div
                          className={`${styles.msgBubble} ${
                            msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleBot
                          }`}
                          dangerouslySetInnerHTML={
                            msg.role === 'bot'
                              ? { __html: formatBotMessage(msg.content) }
                              : undefined
                          }
                        >
                          {msg.role === 'user' ? msg.content : undefined}
                        </div>
                        <div
                          className={`${styles.msgTime} ${
                            msg.role === 'user' ? styles.msgTimeUser : ''
                          }`}
                        >
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className={styles.typingIndicator}>
                <div className={`${styles.msgAvatar} ${styles.msgAvatarBot}`}>
                  <Bot size={14} />
                </div>
                <div className={styles.typingDots}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={16} />
                <span>{error}</span>
                <button className={styles.retryBtn} onClick={handleRetry}>
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 0 && !isLoading && (
            <div className={styles.suggestions}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  className={styles.suggestionChip}
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className={styles.chatInput}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={textareaRef}
                className={styles.chatTextarea}
                placeholder={hasStock ? `Ask about ${stockData.displaySymbol}...` : 'Ask about trading concepts...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
                id="chatbot-input"
              />
            </div>
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              title="Send message"
              id="chatbot-send"
            >
              {isLoading ? (
                <Loader2 size={18} className={styles.sendBtnLoading} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>

          {/* Powered by */}
          <div className={styles.poweredBy}>
            <Sparkles size={10} /> StockPulse AI
          </div>
        </div>
      )}
    </>
  );
}
