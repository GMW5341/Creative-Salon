// Claude API를 fetch로 직접 호출 (SDK 의존성 제거)
async function callClaudeAPI(messages: Array<{ role: string; content: string }>, maxTokens = 2048) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    console.error("Claude API 오류:", response.status, await response.text());
    return null;
  }

  return await response.json();
}

// ─── AI로 대화 텍스트에서 인사이트 추출 ───
export async function extractSynapsWithAI(
  text: string
): Promise<Array<{ content: string; summary: string; tags: string[] }>> {
  const response = await callClaudeAPI([
    {
      role: "user",
      content: `다음은 모임에서 나온 대화 또는 텍스트입니다. 여기서 유의미한 인사이트 조각(Synap)을 추출해주세요.

규칙:
1. 각 Synap은 독립적인 하나의 생각/관찰/통찰이어야 합니다
2. 결론을 내리지 마세요. 사고의 재료가 될 수 있는 날것의 조각만 추출하세요
3. "~인 것 같다", "~가 아닐까" 같은 탐색적 사고도 소중한 Synap입니다
4. 최소 1개, 최대 8개까지 추출하세요
5. 너무 일상적인 대화(인사, 잡담)는 제외하세요

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
[
  {
    "content": "원문에서 해당 인사이트가 담긴 부분 (있는 그대로 또는 최소한의 정리)",
    "summary": "한 줄 핵심 요약 (20자 이내)",
    "tags": ["태그1", "태그2"]
  }
]

대화 텍스트:
"""
${text}
"""`,
    },
  ]);

  if (response) {
    try {
      const content = response.content[0];
      if (content.type === "text") {
        let jsonStr = content.text.trim();
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        const synaps = JSON.parse(jsonStr);
        if (Array.isArray(synaps)) return synaps;
      }
    } catch (e) {
      console.error("Claude 응답 파싱 실패:", e);
    }
  }

  // API 키 없거나 실패 시 로컬 폴백
  return extractWithLocalLogic(text);
}

// ─── AI 없이 로컬에서 인사이트 추출 (폴백) ───
// 단순 문장 분리가 아닌, 주제 클러스터링 기반 맥락 추출
function extractWithLocalLogic(
  text: string
): Array<{ content: string; summary: string; tags: string[] }> {
  // 1단계: 문장 분리 (한국어 + 일반)
  const rawSentences = text
    .split(/\n+/)
    .flatMap((line) => {
      // 화자 레이블 있으면 줄 단위로 유지
      if (/^(화자\s*\d+|[A-Z]|.{1,5}):\s/.test(line)) return [line];
      // 아니면 마침표/물음표 기준 분리
      return line.split(/(?<=[다요죠네까지음함])\s*[.。]\s*|[!?]\s+/);
    })
    .map((s) => s.replace(/^(화자\s*\d+|[A-Z]|.{1,5}):\s*/, "").trim())
    .filter((s) => s.length > 8);

  if (rawSentences.length === 0 && text.trim().length >= 10) {
    return [{
      content: text.trim(),
      summary: text.trim().length > 40 ? text.trim().slice(0, 40) + "..." : text.trim(),
      tags: extractTags(text),
    }];
  }

  // 2단계: 주제별 클러스터링 (키워드 유사도 기반)
  const clusters: string[][] = [];

  for (const sentence of rawSentences) {
    const keywords = extractKeywords(sentence);
    let merged = false;

    for (const cluster of clusters) {
      const clusterText = cluster.join(" ");
      const clusterKeywords = extractKeywords(clusterText);
      // 키워드가 하나라도 겹치면 같은 클러스터
      const overlap = keywords.filter((k) => clusterKeywords.includes(k));
      if (overlap.length > 0 || cluster.length < 2) {
        cluster.push(sentence);
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push([sentence]);
    }
  }

  // 3단계: 각 클러스터를 하나의 인사이트로 종합
  const insights: Array<{ content: string; summary: string; tags: string[] }> = [];

  for (const cluster of clusters) {
    const combined = cluster.join(" ");
    if (combined.length < 10) continue;

    // 가장 핵심적인 문장을 요약으로 (가장 많은 키워드를 포함한 문장)
    const ranked = [...cluster].sort((a, b) => {
      const scoreA = getInsightScore(a);
      const scoreB = getInsightScore(b);
      return scoreB - scoreA;
    });
    const core = ranked[0];
    const summary = core.length > 40 ? core.slice(0, 40) + "..." : core;

    insights.push({
      content: combined.length > 300 ? combined.slice(0, 300) + "..." : combined,
      summary,
      tags: extractTags(combined),
    });
  }

  // 인사이트가 너무 많으면 점수 높은 것만
  if (insights.length > 8) {
    return insights
      .sort((a, b) => getInsightScore(b.content) - getInsightScore(a.content))
      .slice(0, 8);
  }

  // 결과가 비면 전체 텍스트를 단일 인사이트로
  if (insights.length === 0 && text.trim().length >= 10) {
    const cleaned = text.trim();
    insights.push({
      content: cleaned.length > 300 ? cleaned.slice(0, 300) + "..." : cleaned,
      summary: cleaned.length > 40 ? cleaned.slice(0, 40) + "..." : cleaned,
      tags: extractTags(cleaned),
    });
  }

  return insights;
}

// 문장의 인사이트 점수 (높을수록 핵심)
function getInsightScore(sentence: string): number {
  let score = 0;
  if (/것 같|아닐까|수도 있|모르겠|궁금/.test(sentence)) score += 3;
  if (/라고 생각|결국|왜냐하면|핵심|본질|중요한|의미/.test(sentence)) score += 3;
  if (/해야|필요|방법|이유|문제/.test(sentence)) score += 2;
  if (sentence.length > 30) score += 1;
  if (sentence.length > 60) score += 1;
  return score;
}

// 텍스트에서 핵심 키워드 추출 (명사 + 주요 표현)
function extractKeywords(text: string): string[] {
  const stopwords = new Set(["그리고", "하지만", "그래서", "또한", "그런데", "이것", "저것", "그것", "우리", "나는", "이런", "저런"]);
  // 2글자 이상 한글 단어 추출
  const words = text.match(/[가-힣]{2,}/g) || [];
  return words.filter((w) => !stopwords.has(w) && w.length >= 2);
}

function extractTags(text: string): string[] {
  const tagPatterns: Record<string, RegExp> = {
    "창작": /창작|글쓰기|쓰기|작가|저자/,
    "독서": /독서|읽기|책|도서|문학/,
    "삶": /삶|인생|살아|살다|생활/,
    "관계": /관계|사이|함께|소통|대화/,
    "성장": /성장|발전|변화|배움|배우/,
    "감정": /감정|느낌|기분|슬픔|기쁨|고통|행복/,
    "사회": /사회|세상|현실|시대|문화/,
    "철학": /철학|본질|의미|존재|자유|진리/,
    "교육": /교육|가르침|배움|학습|수업/,
    "예술": /예술|미학|아름다|표현|창조/,
  };

  const tags: string[] = [];
  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    if (pattern.test(text)) tags.push(tag);
  }
  return tags.length > 0 ? tags.slice(0, 4) : ["일반"];
}

// ─── AI로 두 synap 사이 유사성 분석 (nearby 보조) ───
export async function findNearbyWithAI(
  targetSynap: { content: string; summary: string },
  candidates: Array<{ id: string; content: string; summary: string }>
): Promise<Array<{ id: string; relevance: string }>> {
  if (candidates.length === 0) return [];

  try {
    const candidateList = candidates
      .slice(0, 20)
      .map((c, i) => `[${i}] "${c.summary}" — ${c.content.slice(0, 100)}`)
      .join("\n");

    const response = await callClaudeAPI([
      {
        role: "user",
        content: `기준 인사이트: "${targetSynap.summary}" — ${targetSynap.content}

아래 후보 인사이트들 중에서 기준과 표면적으로는 달라 보이더라도 구조적으로 연결될 수 있는 것들을 골라주세요.
단순한 키워드 매칭이 아니라, 깊은 수준의 유사성(유추)을 찾아주세요.

후보:
${candidateList}

관련 있는 것만 골라서 JSON으로 응답하세요:
[{"index": 0, "relevance": "왜 연결되는지 한 줄 설명"}]`,
      },
    ], 1024);

    if (response) {
      const content = response.content[0];
      if (content.type === "text") {
        let jsonStr = content.text.trim();
        const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[0];
        const results = JSON.parse(jsonStr);
        return results.map((r: { index: number; relevance: string }) => ({
          id: candidates[r.index]?.id,
          relevance: r.relevance,
        })).filter((r: { id: string | undefined }) => r.id);
      }
    }
  } catch (e) {
    console.error("Nearby AI 분석 실패:", e);
  }

  return [];
}

// ─── AssemblyAI 화자 분리 + STT ───
export interface DiarizedUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface TranscribeResult {
  transcript: string;
  utterances: DiarizedUtterance[];
  speakerCount: number;
}

export async function transcribeWithDiarization(
  audioBuffer: Buffer
): Promise<TranscribeResult | null> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) return null;

  const headers = { authorization: apiKey, "content-type": "application/json" };

  try {
    // 1. 오디오 업로드
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: apiKey, "content-type": "application/octet-stream" },
      body: new Uint8Array(audioBuffer),
    });
    if (!uploadRes.ok) {
      console.error("AssemblyAI 업로드 실패:", uploadRes.status);
      return null;
    }
    const { upload_url } = await uploadRes.json();

    // 2. 화자 분리 옵션으로 트랜스크립션 요청
    const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers,
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: "ko",
        speaker_labels: true,
      }),
    });
    if (!transcriptRes.ok) {
      console.error("AssemblyAI 트랜스크립션 요청 실패:", transcriptRes.status);
      return null;
    }
    const { id: transcriptId } = await transcriptRes.json();

    // 3. 폴링으로 완료 대기
    let transcriptData: { status: string; error?: string; utterances?: Array<{ speaker: string; text: string; start: number; end: number }> };
    while (true) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers,
      });
      transcriptData = await pollRes.json();
      if (transcriptData.status === "completed" || transcriptData.status === "error") break;
    }

    if (transcriptData.status === "error") {
      console.error("AssemblyAI 오류:", transcriptData.error);
      return null;
    }

    // 4. 화자별 발화를 대화 형태로 구성
    const utterances: DiarizedUtterance[] = (transcriptData.utterances || []).map(
      (u) => ({
        speaker: u.speaker,
        text: u.text,
        start: u.start,
        end: u.end,
      })
    );

    const speakerSet = Array.from(new Set(utterances.map((u) => u.speaker)));
    const speakerMap = new Map<string, string>();
    speakerSet.forEach((s, i) => {
      speakerMap.set(s, `화자 ${i + 1}`);
    });

    const dialogueLines = utterances.map(
      (u) => `${speakerMap.get(u.speaker)}: ${u.text}`
    );

    return {
      transcript: dialogueLines.join("\n"),
      utterances: utterances.map((u) => ({
        ...u,
        speaker: speakerMap.get(u.speaker) || u.speaker,
      })),
      speakerCount: speakerSet.length,
    };
  } catch (e) {
    console.error("AssemblyAI 변환 실패:", e);
    return null;
  }
}

// ─── Whisper API로 음성 → 텍스트 변환 (화자 분리 없음, 폴백) ───
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const formData = new FormData();
    const uint8 = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8], { type: "audio/webm" });
    formData.append("file", blob, filename);
    formData.append("model", "whisper-1");
    formData.append("language", "ko");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error("Whisper API 오류:", response.status, await response.text());
      return null;
    }

    const result = await response.json();
    return result.text;
  } catch (e) {
    console.error("Whisper 변환 실패:", e);
    return null;
  }
}
