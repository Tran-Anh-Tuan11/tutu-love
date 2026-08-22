"use client";

import { useEffect, useState } from "react";

type Role = "nam" | "nu";
type Idea = { id: string; content: string; authorId: Role; createdAt: string };
type Topic = { id: string; name: string; ideas: Idea[] };

const AUTHOR_LABEL: Record<Role, string> = { nam: "Anh", nu: "Em" };

export default function IdeasPage() {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/ideas")
      .then((r) => r.json())
      .then((d) => setTopics(d.topics ?? []));
  }

  useEffect(load, []);

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    const res = await fetch("/api/ideas/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTopicName.trim() }),
    });
    if (res.ok) {
      setNewTopicName("");
      setMessage(null);
      load();
    } else {
      const d = await res.json();
      setMessage(d.error ?? "Có lỗi xảy ra");
    }
  }

  async function removeTopic(id: string) {
    const res = await fetch(`/api/ideas/topics/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function removeIdea(id: string) {
    const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  if (!topics) return <div className="paper-card p-5 max-w-2xl mx-auto">Đang tải…</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-2xl">Ý tưởng</h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Mỗi ý tưởng phải nằm trong 1 chủ đề — tạo chủ đề mới hoặc thêm vào chủ đề có sẵn.
          </p>
        </div>
        <form onSubmit={addTopic} className="flex gap-2">
          <input
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="Chủ đề mới, VD Đi chơi cuối tuần"
            className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
          />
          <button type="submit" className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm whitespace-nowrap">
            + Chủ đề
          </button>
        </form>
      </div>

      {message && <p className="text-xs text-[var(--nu)]">{message}</p>}

      {topics.length === 0 && (
        <p className="text-sm text-[var(--ink-soft)]">Chưa có chủ đề nào — tạo chủ đề đầu tiên ở trên.</p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {topics.map((t) => (
          <TopicColumn
            key={t.id}
            topic={t}
            onChanged={load}
            onRemoveTopic={() => removeTopic(t.id)}
            onRemoveIdea={removeIdea}
          />
        ))}
      </div>
    </div>
  );
}

function TopicColumn({
  topic,
  onChanged,
  onRemoveTopic,
  onRemoveIdea,
}: {
  topic: Topic;
  onChanged: () => void;
  onRemoveTopic: () => void;
  onRemoveIdea: (id: string) => void;
}) {
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState<Role>("nam");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: topic.id, content: content.trim(), authorId: author }),
    });
    if (res.ok) {
      setContent("");
      setMessage(null);
      onChanged();
    } else {
      const d = await res.json();
      setMessage(d.error ?? "Có lỗi xảy ra");
    }
  }

  return (
    <div className="paper-card p-4 w-72 shrink-0 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display italic text-lg break-words">{topic.name}</h2>
        <button onClick={onRemoveTopic} className="text-xs text-[var(--nu)] shrink-0">
          Xóa
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {topic.ideas.length === 0 && (
          <li className="text-xs text-[var(--ink-soft)]">Chưa có ý tưởng nào.</li>
        )}
        {topic.ideas.map((idea) => (
          <li key={idea.id} className="rounded-xl bg-[var(--paper-dim)] px-3 py-2">
            <p className="text-sm break-words">{idea.content}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  idea.authorId === "nam" ? "badge-nam" : "badge-nu"
                }`}
              >
                {AUTHOR_LABEL[idea.authorId]}
              </span>
              <button onClick={() => onRemoveIdea(idea.id)} className="text-xs text-[var(--ink-soft)]">
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="flex flex-col gap-2 pt-3 stitch-divider-h">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ý tưởng của bạn…"
          rows={2}
          className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white resize-none"
        />
        <div className="flex gap-2">
          {(["nam", "nu"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setAuthor(r)}
              className={`flex-1 rounded-xl py-1.5 text-xs border ${
                author === r
                  ? r === "nam"
                    ? "badge-nam border-[var(--nam)]"
                    : "badge-nu border-[var(--nu)]"
                  : "border-[var(--paper-dim)]"
              }`}
            >
              {AUTHOR_LABEL[r]}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={!content.trim()}
          className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-3 py-1.5 text-sm disabled:opacity-40"
        >
          + Thêm ý tưởng
        </button>
        {message && <p className="text-xs text-[var(--nu)]">{message}</p>}
      </form>
    </div>
  );
}
