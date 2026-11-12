import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `당신은 일본어 교육 전문가입니다. 한국인 학습자에게 일본어 문장을 분석하고 설명합니다.

사용자가 일본어 문장과 질문을 제공하면, 다음 형식의 JSON으로 응답하세요:

{
  "explanation": "문장에 대한 상세한 설명 (한국어)",
  "grammarPoints": [
    {
      "pattern": "문법 패턴 (예: ~ていました)",
      "explanation": "문법 설명",
      "jlptLevel": "N5/N4/N3/N2/N1"
    }
  ],
  "vocabulary": [
    {
      "word": "단어",
      "reading": "읽기",
      "meaning": "의미",
      "note": "왜 이 단어를 사용했는지 등 (선택)"
    }
  ],
  "culturalNote": "문화적 배경 설명 (있는 경우)",
  "alternativeExpressions": [
    {
      "expression": "대체 표현",
      "meaning": "의미",
      "nuance": "원문과의 뉘앙스 차이"
    }
  ]
}

응답 규칙:
1. 반드시 유효한 JSON만 반환하세요. 마크다운이나 추가 텍스트 없이 JSON만 출력하세요.
2. 모든 설명은 한국어로 작성하세요.
3. 질문이 없으면 문장의 전반적인 분석을 제공하세요.
4. 질문이 있으면 해당 질문에 집중하여 답변하세요.
5. grammarPoints와 vocabulary는 문장에 실제로 있는 것만 포함하세요.
6. alternativeExpressions는 질문이 관련된 경우에만 포함하세요.`;

export async function POST(request: NextRequest) {
  try {
    const { sentence, question, context } = await request.json();

    if (!sentence) {
      return NextResponse.json(
        { error: "문장이 필요합니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // API 키가 없으면 기본 응답 반환
      return NextResponse.json({
        explanation: "AI 설명 기능을 사용하려면 환경 변수에 ANTHROPIC_API_KEY를 설정해주세요.",
        grammarPoints: [],
        vocabulary: [],
      });
    }

    const userMessage = `문장: ${sentence}
${context ? `맥락: ${context}` : ""}
${question ? `질문: ${question}` : "이 문장을 분석해주세요."}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Anthropic API Error:", errorData);
      throw new Error(errorData.error?.message || "AI API 요청 실패");
    }

    const data = await response.json();
    const content = data.content[0]?.text || "";

    // JSON 파싱 시도
    try {
      // JSON이 마크다운 코드 블록으로 감싸져 있을 수 있음
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
      // JSON 파싱 실패 시 원본 텍스트를 explanation으로 반환
      return NextResponse.json({
        explanation: content,
        grammarPoints: [],
        vocabulary: [],
      });
    }
  } catch (error) {
    console.error("Explain Sentence API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
