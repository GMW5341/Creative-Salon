"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import VoiceRecorder from "@/components/synaps/VoiceRecorder";
import SynapCard from "@/components/synaps/SynapCard";
import ConnectionModal from "@/components/synaps/ConnectionModal";

interface Synap {
  id: string;
  content: string;
  summary: string;
  tags: string | null;
  source: string;
  createdAt: string;
  author: { id: string; name: string; profileImage: string | null };
  meeting: { id: string; title: string; date: string } | null;
  discussion: { id: string; title: string } | null;
  connectionsFrom: Array<{
    id: string;
    insight: string;
    toSynap: { id: string; summary: string; tags: string | null };
    author: { name: string };
  }>;
  connectionsTo: Array<{
    id: string;
    insight: string;
    fromSynap: { id: string; summary: string; tags: string | null };
    author: { name: string };
  }>;
}

interface Connection {
  id: string;
  insight: string;
  createdAt: string;
  fromSynap: { id: string; summary: string; tags: string | null; content: string };
  toSynap: { id: string; summary: string; tags: string | null; content: string };
  author: { name: string };
}

type TabType = "synaps" | "connections" | "record";

export default function SynapBoardPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [synaps, setSynaps] = useState<Synap[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("synaps");
  const [extracting, setExtracting] = useState(false);

  // 연결 모드 상태
  const [connectMode, setConnectMode] = useState(false);
  const [selectedSynaps, setSelectedSynaps] = useState<string[]>([]);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // 수동 synap 작성
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualContent, setManualContent] = useState("");
  const [manualSummary, setManualSummary] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  // 태그 필터
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const fetchSynaps = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/synaps`);
    if (res.ok) setSynaps(await res.json());
  }, [groupId]);

  const fetchConnections = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/synaps/connections`);
    if (res.ok) setConnections(await res.json());
  }, [groupId]);

  useEffect(() => {
    Promise.all([fetchSynaps(), fetchConnections()]).finally(() =>
      setLoading(false)
    );
  }, [fetchSynaps, fetchConnections]);

  // 음성 녹음 → synap 추출
  async function handleTranscript(text: string, duration: number) {
    setExtracting(true);

    // 1. 녹음 저장
    await fetch(`/api/groups/${groupId}/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: text, duration }),
    });

    // 2. synap 추출
    const res = await fetch(`/api/groups/${groupId}/synaps/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source: "VOICE" }),
    });

    if (res.ok) {
      const data = await res.json();
      setSynaps((prev) => [...data.synaps, ...prev]);
      setActiveTab("synaps");
    }

    setExtracting(false);
  }

  // 수동 synap 작성
  async function handleManualSynap(e: React.FormEvent) {
    e.preventDefault();
    if (!manualContent.trim()) return;
    setSavingManual(true);

    const res = await fetch(`/api/groups/${groupId}/synaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: manualContent,
        summary: manualSummary || manualContent.slice(0, 50),
        source: "MANUAL",
      }),
    });

    if (res.ok) {
      const synap = await res.json();
      setSynaps((prev) => [synap, ...prev]);
      setManualContent("");
      setManualSummary("");
      setShowManualForm(false);
    }
    setSavingManual(false);
  }

  // synap 선택 (연결 모드)
  function handleSynapSelect(synapId: string) {
    if (!connectMode) return;

    setSelectedSynaps((prev) => {
      if (prev.includes(synapId)) {
        return prev.filter((id) => id !== synapId);
      }
      const next = [...prev, synapId];
      if (next.length === 2) {
        setShowConnectionModal(true);
      }
      return next.slice(0, 2);
    });
  }

  // 연결 생성
  async function handleCreateConnection(insight: string) {
    if (selectedSynaps.length !== 2) return;

    const res = await fetch(`/api/groups/${groupId}/synaps/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromSynapId: selectedSynaps[0],
        toSynapId: selectedSynaps[1],
        insight,
      }),
    });

    if (res.ok) {
      const connection = await res.json();
      setConnections((prev) => [connection, ...prev]);
      setSelectedSynaps([]);
      setShowConnectionModal(false);
      setConnectMode(false);
      await fetchSynaps(); // 연결 정보 갱신
    }
  }

  // 태그 목록 추출
  const allTags = Array.from(
    new Set(
      synaps.flatMap((s) => {
        try {
          return s.tags ? JSON.parse(s.tags) : [];
        } catch {
          return [];
        }
      })
    )
  ) as string[];

  // 필터된 synaps
  const filteredSynaps = filterTag
    ? synaps.filter((s) => {
        try {
          const tags: string[] = s.tags ? JSON.parse(s.tags) : [];
          return tags.includes(filterTag);
        } catch {
          return false;
        }
      })
    : synaps;

  const tabs = [
    { id: "synaps" as const, label: "Synaps", count: synaps.length },
    { id: "connections" as const, label: "연결", count: connections.length },
    { id: "record" as const, label: "기록하기", count: null },
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <Link
            href={`/groups/${groupId}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            &larr; 그룹으로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Synap Board</h1>
        </div>

        <button
          onClick={() => {
            setConnectMode(!connectMode);
            setSelectedSynaps([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            connectMode
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {connectMode ? "연결 모드 종료" : "Synap 연결하기"}
        </button>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        대화에서 태어난 인사이트 조각들. 연결은 당신이 만드세요.
      </p>

      {/* 연결 모드 안내 */}
      {connectMode && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-violet-800">
            <span className="font-semibold">연결 모드</span> — 연결하고 싶은 두 개의 Synap을 선택하세요.
            {selectedSynaps.length === 1 && " 하나 더 선택해주세요."}
            {selectedSynaps.length === 0 && " 첫 번째 Synap을 선택해주세요."}
          </p>
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count !== null && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* Synaps 탭 */}
      {activeTab === "synaps" && (
        <div>
          {/* 태그 필터 */}
          {allTags.length > 0 && (
            <div className="flex gap-1.5 mb-4 flex-wrap">
              <button
                onClick={() => setFilterTag(null)}
                className={`text-xs px-2.5 py-1 rounded-full transition ${
                  !filterTag
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                전체
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                  className={`text-xs px-2.5 py-1 rounded-full transition ${
                    filterTag === tag
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* 수동 추가 버튼 */}
          {!showManualForm && (
            <button
              onClick={() => setShowManualForm(true)}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-400 hover:border-amber-300 hover:text-amber-600 transition mb-4"
            >
              + 직접 Synap 추가하기
            </button>
          )}

          {/* 수동 작성 폼 */}
          {showManualForm && (
            <form
              onSubmit={handleManualSynap}
              className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 space-y-3"
            >
              <input
                value={manualSummary}
                onChange={(e) => setManualSummary(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="한 줄 요약 (핵심 인사이트)"
              />
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                placeholder="원문 또는 상세 내용"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingManual || !manualContent.trim()}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  {savingManual ? "저장 중..." : "추가"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* Synap 목록 */}
          {filteredSynaps.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3 opacity-30">.</div>
              <p className="text-gray-500 mb-2">아직 Synap이 없습니다</p>
              <p className="text-sm text-gray-400">
                &lsquo;기록하기&rsquo; 탭에서 음성으로 대화를 기록하거나, 직접 Synap을 추가해보세요.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filteredSynaps.map((synap) => (
                <SynapCard
                  key={synap.id}
                  synap={synap}
                  isSelected={selectedSynaps.includes(synap.id)}
                  onSelect={connectMode ? handleSynapSelect : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 연결 탭 */}
      {activeTab === "connections" && (
        <div>
          {connections.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3 opacity-30">&harr;</div>
              <p className="text-gray-500 mb-2">아직 연결이 없습니다</p>
              <p className="text-sm text-gray-400">
                &lsquo;Synap 연결하기&rsquo; 버튼으로 두 개의 Synap 사이에서 발견한 유추를 기록해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5"
                >
                  {/* 연결된 두 synap */}
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <p className="text-sm font-medium text-gray-900">
                        {conn.fromSynap.summary}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="flex-1 bg-violet-50 rounded-lg p-3 border border-violet-100">
                      <p className="text-sm font-medium text-gray-900">
                        {conn.toSynap.summary}
                      </p>
                    </div>
                  </div>

                  {/* 유추 인사이트 */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-800">{conn.insight}</p>
                  </div>

                  {/* 메타 */}
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                    <span>{conn.author.name}</span>
                    <span>&middot;</span>
                    <span>
                      {new Date(conn.createdAt).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 기록하기 탭 */}
      {activeTab === "record" && (
        <div className="space-y-6">
          {/* 음성 녹음 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              음성으로 기록하기
            </h3>
            <VoiceRecorder
              groupId={groupId}
              onTranscriptReady={handleTranscript}
              disabled={extracting}
            />
            {extracting && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-700">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                대화에서 인사이트를 추출하고 있습니다...
              </div>
            )}
          </div>

          {/* 텍스트에서 추출 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              텍스트에서 Synap 추출하기
            </h3>
            <TextExtractor groupId={groupId} onExtracted={(newSynaps) => {
              setSynaps((prev) => [...newSynaps, ...prev]);
              setActiveTab("synaps");
            }} />
          </div>
        </div>
      )}

      {/* 연결 모달 */}
      {showConnectionModal && selectedSynaps.length === 2 && (
        <ConnectionModal
          fromSynap={synaps.find((s) => s.id === selectedSynaps[0])!}
          toSynap={synaps.find((s) => s.id === selectedSynaps[1])!}
          onSubmit={handleCreateConnection}
          onClose={() => {
            setShowConnectionModal(false);
            setSelectedSynaps([]);
          }}
        />
      )}
    </div>
  );
}

// 텍스트 → synap 추출 서브 컴포넌트
function TextExtractor({
  groupId,
  onExtracted,
}: {
  groupId: string;
  onExtracted: (synaps: Synap[]) => void;
}) {
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 10) return;
    setExtracting(true);

    const res = await fetch(`/api/groups/${groupId}/synaps/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source: "NOTE" }),
    });

    if (res.ok) {
      const data = await res.json();
      onExtracted(data.synaps);
      setText("");
    }
    setExtracting(false);
  }

  return (
    <form onSubmit={handleExtract} className="bg-white rounded-2xl border border-gray-200 p-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none text-sm"
        placeholder="모임에서 나온 대화나 메모를 붙여넣으세요. AI가 인사이트를 추출합니다..."
      />
      <button
        type="submit"
        disabled={extracting || text.trim().length < 10}
        className="mt-3 bg-amber-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
      >
        {extracting ? "추출 중..." : "Synap 추출하기"}
      </button>
    </form>
  );
}
