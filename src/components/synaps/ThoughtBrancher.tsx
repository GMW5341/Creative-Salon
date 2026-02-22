"use client";

import { useState } from "react";

interface ThoughtBrancherProps {
  groupId: string;
  meetingId?: string;
  onSynapCreated: (synap: { id: string; content: string; summary: string; tags: string | null; source: string; createdAt: string; author: { id: string; name: string; profileImage: string | null } }) => void;
}

// 텍스트를 의미 단위 문장으로 분리
function splitIntoSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => {
      // 화자 레이블이 있는 줄은 그대로
      if (/^(화자\s*\d+|[A-Z]|.{1,5}):\s/.test(line)) return [line];
      // 한국어 문장 종결 패턴으로 분리
      return line.split(/(?<=[다요죠네까지음함][.。!?]?\s)|(?<=[.!?]\s)/);
    })
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

// 생각 유도 질문들 (문장의 성격에 따라 다른 질문)
function getPromptForSentence(sentence: string): string {
  if (/\?|까\s*$|일까|는지|건지/.test(sentence)) {
    return "이 질문에 대한 나의 답은...";
  }
  if (/것 같|아닐까|수도 있|모르겠/.test(sentence)) {
    return "이 가능성에서 떠오르는 생각은...";
  }
  if (/해야|필요|방법|위해/.test(sentence)) {
    return "이것과 관련해서 내가 느끼는 건...";
  }
  if (/왜냐하면|결국|본질|의미/.test(sentence)) {
    return "이 맥락을 다르게 보면...";
  }
  return "이 문장에서 떠오르는 내 생각은...";
}

export default function ThoughtBrancher({ groupId, meetingId, onSynapCreated }: ThoughtBrancherProps) {
  const [inputText, setInputText] = useState("");
  const [sentences, setSentences] = useState<string[]>([]);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const [thought, setThought] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  function handleSplit() {
    const result = splitIntoSentences(inputText);
    setSentences(result);
    setSavedCount(0);
  }

  function handleReset() {
    setSentences([]);
    setInputText("");
    setActiveSentence(null);
    setThought("");
    setSavedCount(0);
  }

  async function handleSaveThought(sentenceIndex: number) {
    if (!thought.trim()) return;
    setSaving(true);

    const originalSentence = sentences[sentenceIndex];

    const res = await fetch(`/api/groups/${groupId}/synaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: originalSentence,
        summary: thought.trim().length > 50 ? thought.trim().slice(0, 50) + "..." : thought.trim(),
        source: "NOTE",
        meetingId: meetingId || null,
      }),
    });

    if (res.ok) {
      const synap = await res.json();
      onSynapCreated(synap);
      setSavedCount((prev) => prev + 1);
      setThought("");
      setActiveSentence(null);
    }
    setSaving(false);
  }

  // 입력 단계
  if (sentences.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            텍스트에서 생각 가져가기
          </h3>
          <p className="text-xs text-gray-400">
            대화, 메모, 책의 구절을 넣어보세요. 문장 하나하나에서 나만의 생각을 발견할 수 있어요.
          </p>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={5}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none text-sm"
          placeholder="모임에서 나온 대화, 읽은 문장, 떠오른 메모를 자유롭게 붙여넣으세요..."
        />
        <button
          onClick={handleSplit}
          disabled={inputText.trim().length < 5}
          className="mt-3 bg-amber-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          문장별로 탐색하기
        </button>
      </div>
    );
  }

  // 문장 탐색 단계
  return (
    <div className="space-y-3">
      {/* 상단 안내 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {sentences.length}개의 문장에서 생각 발견하기
          </p>
          <p className="text-xs text-gray-400">
            끌리는 문장을 눌러보세요. 거기서 시작되는 나만의 생각을 적어보세요.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedCount > 0 && (
            <span className="text-xs text-green-600 font-medium">
              {savedCount}개 저장됨
            </span>
          )}
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            다시 입력
          </button>
        </div>
      </div>

      {/* 문장 목록 */}
      <div className="space-y-2">
        {sentences.map((sentence, index) => (
          <div key={index}>
            {/* 문장 카드 */}
            <button
              onClick={() => {
                setActiveSentence(activeSentence === index ? null : index);
                setThought("");
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                activeSentence === index
                  ? "border-amber-400 bg-amber-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-300 font-mono mt-0.5 shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className={`text-sm leading-relaxed ${
                  activeSentence === index ? "text-gray-900" : "text-gray-700"
                }`}>
                  {sentence}
                </p>
                <svg
                  className={`w-4 h-4 shrink-0 mt-0.5 transition ${
                    activeSentence === index
                      ? "text-amber-500 rotate-90"
                      : "text-gray-300"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* 생각 입력 패널 */}
            {activeSentence === index && (
              <div className="ml-8 mt-2 mb-1 bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                <p className="text-xs text-amber-700 font-medium">
                  {getPromptForSentence(sentence)}
                </p>
                <textarea
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  rows={2}
                  autoFocus
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none bg-white"
                  placeholder="여기서 떠오르는 생각을 자유롭게 적어보세요..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveThought(index)}
                    disabled={saving || !thought.trim()}
                    className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    {saving ? (
                      "저장 중..."
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Synap으로 저장
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActiveSentence(null);
                      setThought("");
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
