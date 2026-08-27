"use client";

import { useEffect, useRef, useState } from "react";
import Header from "../components/Header";

function Message({ role, text }) {
  const isUser = role === "user";
  return (
    <article className={`message-in flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <span className="mt-1.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent font-mono text-[9px] font-bold text-white">AI</span>}
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${isUser ? "rounded-tr-sm bg-ink text-paper" : "rounded-tl-sm border border-ink/10 bg-white/75 text-ink"}`}>
        {text}
      </div>
    </article>
  );
}

export default function Home() {
  const [messages, setMessages] = useState([{ role: "server", text: "Chào bạn. Kênh local đã sẵn sàng - hãy gửi một nhiệm vụ." }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [dark, setDark] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setMessages((prev) => [...prev, { role: "user", text: content }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: content }) });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "server", text: data.reply ?? "(Server không phản hồi nội dung)" }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "server", text: `Lỗi khi gửi lên server: ${err.message}` }]);
    } finally { setSending(false); }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-paper text-ink dark:bg-[#111214] dark:text-paper">
      <div className="pointer-events-none fixed inset-0 paper-noise opacity-50 dark:opacity-10" />
      <Header dark={dark} onToggleDark={() => setDark((value) => !value)} onAddAgent={() => console.log("Agents profile clicked")} />
      <main className="relative mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(330px,.7fr)]">
        <section className="flex min-h-[calc(100vh-73px)] flex-col border-ink/10 lg:border-r">
          <div className="flex items-start justify-between border-b border-ink/10 px-5 py-5 sm:px-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">Channel / 01</p>
              <h2 className="mt-1 font-display text-3xl">Conversation</h2>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-7 sm:px-8">
            <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40 dark:text-paper/40"><span className="h-px flex-1 bg-ink/10" />Today<span className="h-px flex-1 bg-ink/10" /></div>
            {messages.map((message, index) => <Message key={index} {...message} />)}
            {sending && <div className="flex gap-3"><span className="mt-1.5 grid h-6 w-6 place-items-center rounded-full bg-accent font-mono text-[9px] font-bold text-white">AI</span><div className="rounded-2xl rounded-tl-sm border border-ink/10 bg-white/75 px-4 py-3"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div></div>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); handleSend(); }} className="border-t border-ink/10 bg-paper/75 p-4 backdrop-blur sm:p-6 dark:bg-ink/75">
            <div className="flex items-end gap-3 rounded-2xl border border-ink/15 bg-white p-2 shadow-[4px_4px_0_rgba(21,20,23,.1)] dark:bg-white/5">
              <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleSend(); } }} rows={1} placeholder="Viết một nhiệm vụ..." className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-5 outline-none placeholder:text-ink/35 dark:placeholder:text-paper/35" />
              <button disabled={sending || !input.trim()} className="rounded-xl bg-accent px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-35">Send</button>
            </div>
            <p className="mt-3 px-2 font-mono text-[10px] text-ink/40 dark:text-paper/40">Enter to send <span className="mx-2">/</span> Shift + Enter for a new line</p>
          </form>
        </section>
        <aside className="relative hidden overflow-hidden bg-ink p-8 text-paper lg:flex lg:min-h-[calc(100vh-73px)] lg:flex-col">
          <span className="absolute -right-24 top-16 h-72 w-72 rounded-full border border-paper/10" /><span className="absolute -right-8 top-32 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accentSoft">Agent workspace</p>
            <h2 className="mt-5 max-w-md font-display text-5xl leading-[.94]">Think in threads.<br /><em className="font-normal text-accentSoft">Ship</em> in focus.</h2>
          </div>
          <div className="relative mt-12 space-y-3">
            {[['Local API', 'Connected'], ['Active agents', '01 online'], ['Message stream', 'Ready']].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-paper/15 py-3 font-mono text-[11px]"><span className="text-paper/50">{label}</span><span><i className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#b7ef9c]" />{value}</span></div>)}
          </div>
          <div className="relative mt-auto border-l-2 border-accent pl-4 text-sm leading-6 text-paper/60">A quiet interface for precise instructions, local tools, and a little less noise.</div>
        </aside>
      </main>
    </div>
  );
}
