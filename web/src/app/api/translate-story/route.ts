import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `당신은 한국어를 자연스러운 일본어로 번역하는 전문 번역가입니다.

사용자가 한국어 텍스트를 제공하면, 다음 형식의 JSON으로 응답하세요:

{
  "original": "원본 한국어 텍스트 전체",
  "japanese": "번역된 일본어 텍스트 전체",
  "reading": "일본어 전체의 히라가나 읽기",
  "sentences": [
    {
      "korean": "한국어 문장 1",
      "japanese": "일본어 번역 1",
      "reading": "히라가나 읽기 1"
    },
    {
      "korean": "한국어 문장 2",
      "japanese": "일본어 번역 2",
      "reading": "히라가나 읽기 2"
    }
  ]
}

번역 규칙:
1. 자연스럽고 문학적인 일본어로 번역하세요.
2. 동화나 이야기체의 경우 "です/ます"체 또는 "だ/である"체를 일관되게 사용하세요.
3. 한국어의 뉘앙스를 최대한 살려서 번역하세요.
4. 문장 단위로 분리하여 sentences 배열에 넣어주세요.
5. reading은 모든 한자를 히라가나로 표기한 것입니다.
6. 반드시 유효한 JSON만 반환하세요. 마크다운이나 추가 텍스트 없이 JSON만 출력하세요.`;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "번역할 텍스트가 필요합니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요." },
        { status: 500 }
      );
    }

    const userMessage = `${SYSTEM_PROMPT}

다음 한국어 텍스트를 일본어로 번역해주세요:

${text.trim()}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: userMessage,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error - Status:", response.status);
      console.error("Gemini API Error - Body:", errorText);
      throw new Error(`AI API 요청 실패 (${response.status})`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // JSON 파싱 시도
    try {
      let jsonStr = content;
      if (content.includes("```json")) {
        jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (content.includes("```")) {
        jsonStr = content.replace(/```\n?/g, "");
      }

      const parsed = JSON.parse(jsonStr.trim());
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw content:", content);
      return NextResponse.json(
        { error: "번역 결과 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Translate Story API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
