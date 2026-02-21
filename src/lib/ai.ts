// Claude API 클라이언트 (lazy import로 dev 모드 모듈 resolve 문제 방지)
async function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  return new Anthropic({ apiKey });
}

// OpenAI 클라이언트 (Whisper STT용)
async function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const { default: OpenAI } = await import("openai");
  return new OpenAI({ apiKey });
}

// ─── AI로 대화 텍스트에서 인사이트 추출 ───
export async function extractSynapsWithAI(
  text: string
): Promise<Array<{ content: string; summary: string; tags: string[] }>> {
  const client = await getAnthropicClient();

  if (client) {
    return await extractWithClaude(client, text);
  }

  // API 키 없으면 로컬 폴백
  return extractWithLocalLogic(text);
}

async function extractWithClaude(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  text: string
): Promise<Array<{ content: string; summary: string; tags: string[] }>> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [
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
    ],
  });

  try {
    const content = response.content[0];
    if (content.type === "text") {
      let jsonStr = content.text.trim();
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const synaps = JSON.parse(jsonStr);
      return Array.isArray(synaps) ? synaps : [];
    }
  } catch (e) {
    console.error("Claude 응답 파싱 실패:", e);
  }

  return extractWithLocalLogic(text);
}

// ─── AI 없이 로컬에서 인사이트 추출 (폴백) ───
function extractWithLocalLogic(
  text: string
): Array<{ content: string; summary: string; tags: string[] }> {
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const insights: Array<{ content: string; summary: string; tags: string[] }> = [];

  for (const sentence of sentences) {
    const isInsightful =
      sentence.includes("것 같") ||
      sentence.includes("라고 생각") ||
      sentence.includes("결국") ||
      sentence.includes("왜냐하면") ||
      sentence.includes("중요한") ||
      sentence.includes("핵심") ||
      sentence.includes("본질") ||
      sentence.includes("의미") ||
      sentence.includes("이란") ||
      sentence.includes("아닐까") ||
      sentence.length > 30;

    if (isInsightful) {
      const tags = extractTags(sentence);
      insights.push({
        content: sentence,
        summary: sentence.length > 40 ? sentence.slice(0, 40) + "..." : sentence,
        tags,
      });
    }
  }

  return insights.slice(0, 8);
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
  const client = await getAnthropicClient();
  if (!client || candidates.length === 0) return [];

  try {
    const candidateList = candidates
      .slice(0, 20)
      .map((c, i) => `[${i}] "${c.summary}" — ${c.content.slice(0, 100)}`)
      .join("\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
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
      ],
    });

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

  try {
    const { AssemblyAI } = await import("assemblyai");
    const client = new AssemblyAI({ apiKey });

    // 1. 오디오 업로드
    const uint8 = new Uint8Array(audioBuffer);
    const uploadUrl = await client.files.upload(uint8);

    // 2. 화자 분리 옵션으로 트랜스크립션 요청
    const transcriptResponse = await client.transcripts.transcribe({
      audio_url: uploadUrl,
      language_code: "ko",
      speaker_labels: true,
    });

    if (transcriptResponse.status === "error") {
      console.error("AssemblyAI 오류:", transcriptResponse.error);
      return null;
    }

    // 3. 화자별 발화를 대화 형태로 구성
    const utterances: DiarizedUtterance[] = (transcriptResponse.utterances || []).map(
      (u) => ({
        speaker: u.speaker,
        text: u.text,
        start: u.start,
        end: u.end,
      })
    );

    // 화자 라벨 → 읽기 좋은 이름 매핑 (Speaker A → 화자 1)
    const speakerSet = Array.from(new Set(utterances.map((u) => u.speaker)));
    const speakerMap = new Map<string, string>();
    speakerSet.forEach((s, i) => {
      speakerMap.set(s, `화자 ${i + 1}`);
    });

    // 대화체 트랜스크립트 구성
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
  const client = await getOpenAIClient();
  if (!client) return null;

  try {
    const uint8 = new Uint8Array(audioBuffer);
    const file = new File([uint8], filename, { type: "audio/webm" });
    const transcription = await client.audio.transcriptions.create({
      model: "whisper-1",
      file: file,
      language: "ko",
    });
    return transcription.text;
  } catch (e) {
    console.error("Whisper 변환 실패:", e);
    return null;
  }
}
