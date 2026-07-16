'use client';
import { useState, useRef, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, HelpCircle, CornerDownLeft } from 'lucide-react';
import styles from './copilot.module.css';

export default function CopilotPage() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your ChurnSense AI Copilot. Ask me questions about your customer accounts, revenue at risk, sleeping users, or critical priorities!'
    }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scroll = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scroll();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query;
    setQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const data = await churnApi.askCopilot(userText);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: data.summary,
        results: data.results
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Sorry, I encountered an error while processing that query. Please make sure you are signed in and have historical predictions.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "Show me high risk customers",
    "Show me priority 1 critical accounts",
    "What is our total revenue at risk?",
    "Show sleeping premium accounts"
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>AI Copilot</h1>
        <p className={styles.subheading}>Search, query, and analyze your customer intelligence database in plain English</p>
      </div>

      <div className={styles.chatArea}>
        <div className={styles.messagesWrap}>
          {messages.map((m, idx) => (
            <div key={idx} className={`${styles.message} ${m.sender === 'user' ? styles.user : styles.bot}`}>
              <div className={styles.avatar}>
                {m.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={styles.msgBody}>
                <p className={styles.msgText}>{m.text}</p>
                
                {/* Result table if copilot returned a dataset */}
                {m.results && m.results.length > 0 && !m.results[0].rev_at_risk && (
                  <div className={styles.resultsTableWrap}>
                    <table className={styles.resultsTable}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Risk</th>
                          <th>Segment</th>
                          <th>CLV</th>
                          <th>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.results.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td>{row.id}</td>
                            <td style={{fontWeight: 600, color: row.risk_level === 'Critical' ? '#ef4444' : '#f59e0b'}}>{row.risk_level} ({Math.round(row.probability * 100)}%)</td>
                            <td><span className={styles.segmentTag}>{row.segment}</span></td>
                            <td className={styles.clvCell}>₹{(row.clv || 0).toLocaleString()}</td>
                            <td>
                              <span className={`${styles.pBadge} ${row.priority?.includes('Priority 1') ? styles.p1 : styles.p2}`}>
                                {row.priority || 'Medium'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.message} ${styles.bot}`}>
              <div className={styles.avatar}><Bot size={18} /></div>
              <div className={styles.msgBody}>
                <Loader2 className={styles.spinner} size={20} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Query Input */}
        <div className={styles.inputArea}>
          {messages.length === 1 && (
            <div className={styles.samples}>
              <span className={styles.sampleTitle}><Sparkles size={14} /> Try asking:</span>
              <div className={styles.sampleGrid}>
                {sampleQueries.map((q, i) => (
                  <button key={i} onClick={() => { setQuery(q); }} className={styles.sampleBtn}>{q}</button>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSend} className={styles.form}>
            <input 
              type="text" 
              placeholder="Ask anything (e.g. 'Show me VIP accounts' or 'Who is at risk?')..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
            <button type="submit" className={styles.sendBtn} disabled={loading || !query.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
