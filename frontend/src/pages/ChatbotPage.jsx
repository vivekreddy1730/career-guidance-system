import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import { sendMessage, getChatHistory, clearChatHistory } from "../api/endpoints";

const QUICK_PROMPTS = [
  "Which career suits me best?",
  "What should I learn next?",
  "Best certification for AI/ML?",
  "What is my skill gap?",
  "How much can I earn as a Data Scientist?",
  "How do I become a Cloud Engineer?",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getChatHistory()
      .then((res) => {
        if (res.data.history.length > 0) {
          setMessages(res.data.history);
        } else {
          // Welcome message
          setMessages([{
            role: "assistant",
            content: "Hi! I'm CareerBot 🤖 — your AI career advisor. I know your profile, skills, and career predictions. Ask me anything!\n\nFor example: *\"Which career suits me?\"* or *\"What should I learn next?\"*",
          }]);
        }
      })
      .catch(() => {
        setMessages([{
          role: "assistant",
          content: "Hi! I'm CareerBot 🤖 — your AI career advisor. Ask me anything about your career path!",
        }]);
      })
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await sendMessage(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process your request. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await clearChatHistory().catch(() => {});
    setMessages([{
      role: "assistant",
      content: "Chat cleared! How can I help you with your career journey?",
    }]);
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="page-content" style={{ display: "flex", flexDirection: "column" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="gradient-text mb-1">AI Career Advisor</h2>
              <p className="text-muted-dark mb-0" style={{ fontSize: "0.875rem" }}>
                Powered by OpenAI · Grounded in your actual profile & predictions
              </p>
            </div>
            <button
              className="btn btn-sm"
              onClick={handleClear}
              style={{ background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)" }}
            >
              🗑 Clear Chat
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                className="btn btn-sm"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  transition: "all 0.2s",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Window */}
          <div className="chat-container" style={{ flex: 1 }}>
            <div className="chat-messages">
              {loadingHistory ? (
                <LoadingSpinner text="Loading conversation..." />
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`d-flex ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}>
                    <div className={`chat-bubble ${msg.role === "user" ? "user" : "bot"}`}>
                      {msg.role === "assistant" && (
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span style={{ fontSize: "1rem" }}>🤖</span>
                          <span className="fw-600 text-brand" style={{ fontSize: "0.8rem" }}>CareerBot</span>
                        </div>
                      )}
                      <div
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                        style={{ fontSize: "0.9rem", lineHeight: 1.6 }}
                      />
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="d-flex justify-content-start">
                  <div className="chat-bubble bot">
                    <div className="d-flex align-items-center gap-2">
                      <span>🤖</span>
                      <div className="d-flex gap-1">
                        {[0, 0.2, 0.4].map((d, i) => (
                          <div
                            key={i}
                            style={{
                              width: 7, height: 7, borderRadius: "50%",
                              background: "var(--brand-primary)",
                              animation: "pulse 1.2s infinite",
                              animationDelay: `${d}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-dark"
                  placeholder="Ask about your career path, skills to learn, certifications..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  disabled={loading}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn-brand btn px-3"
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                >
                  {loading ? "..." : "Send →"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
