import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

// Lazy initialization for Gemini API
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

interface StrategyDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8 p-6 bg-gray-50 rounded-lg">
    <h3 className="text-lg font-bold text-[#5D6D5F] border-b pb-2 mb-4">{title}</h3>
    <div className="text-sm text-gray-700 space-y-2">{children}</div>
  </div>
);

export default function StrategyDashboard({ isOpen, onClose }: StrategyDashboardProps) {
  if (!isOpen) return null;

  const [librarianQuery, setLibrarianQuery] = useState('');
  const [librarianResult, setLibrarianResult] = useState('');
  const [isLoadingLibrarian, setIsLoadingLibrarian] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
  const [transformedContent, setTransformedContent] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);

  const handleLibrarianSearch = async () => {
    if (!librarianQuery) return;
    setIsLoadingLibrarian(true);
    setLibrarianResult('');

    const ai = getAI();
    if (!ai) {
      setLibrarianResult("API Key가 설정되지 않았습니다.");
      setIsLoadingLibrarian(false);
      return;
    }

    const prompt = `당신은 '도서관 사서' 페르소나입니다. 다음 키워드/상담 내용과 관련하여, 7단계 글쓰기 프레임워크의 '배경 확장' 단계에 사용할 수 있는 흥미로운 역사, 과학, 심리학적 사실이나 일화를 3가지 추천해주세요. 각 항목은 출처(웹 검색 기반)와 함께 간결하게 요약해주세요.\n\n키워드: "${librarianQuery}"`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      setLibrarianResult(response.text || "검색 결과가 없습니다.");
    } catch (error) {
      console.error("Librarian Persona API error:", error);
      setLibrarianResult("자료 검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingLibrarian(false);
    }
  };

  const handleTransform = async (platform: 'youtube' | 'newsletter' | 'instagram') => {
    if (!originalContent) {
      setTransformedContent('먼저 원본 콘텐츠를 입력해주세요.');
      return;
    }
    setIsTransforming(true);
    setTransformedContent('');

    const ai = getAI();
    if (!ai) {
      setTransformedContent("API Key가 설정되지 않았습니다.");
      setIsTransforming(false);
      return;
    }

    let platformInstruction = '';
    switch (platform) {
      case 'youtube':
        platformInstruction = '유튜브 영상 스크립트 형식으로 변환해줘. 시청자의 흥미를 유발할 수 있도록 친근한 구어체를 사용하고, 각 단락에 어울리는 시각적 요소(예: 관련 이미지, 인포그래픽)를 괄호 안에 지시해줘.';
        break;
      case 'newsletter':
        platformInstruction = '독자에게 깊이 있는 정보를 제공하는 뉴스레터 형식으로 변환해줘. 전문가적인 톤을 유지하되, 명확한 소제목으로 단락을 나누어 가독성을 높여줘.';
        break;
      case 'instagram':
        platformInstruction = '인스타그램 포스트 형식으로 변환해줘. 첫 문장에서 시선을 사로잡고, 이모지를 적절히 사용하여 감성을 전달해줘. 마지막에는 관련성 높은 해시태그 3~5개를 추가해줘.';
        break;
    }

    const prompt = `다음 원본 콘텐츠를 '${platform}' 플랫폼에 최적화된 형태로 변환해줘. 다음 지시사항을 따라줘: ${platformInstruction}\n\n---원본 콘텐츠---\n${originalContent}`;

    try {
      const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: [{ parts: [{ text: prompt }] }] });
      setTransformedContent(response.text || "변환 결과를 생성할 수 없습니다.");
    } catch (error) {
      console.error("Content transformation API error:", error);
      setTransformedContent("콘텐츠 변환 중 오류가 발생했습니다.");
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold serif text-[#5D6D5F]">콘텐츠 전략 대시보드</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">닫기</button>
        </div>
        <div className="flex-grow overflow-y-auto pr-4">
          <Section title="(1) 핵심 가치 및 스타일 가이드">
            <p><strong>핵심 메시지:</strong> 성경적 지혜를 현대적인 삶에 적용하여 긍정적이고 보편적인 공감대를 형성한다.</p>
            <p><strong>어조 및 표현법:</strong> 비신앙인도 거부감 없이 받아들일 수 있는 긍정적이고 따뜻한 언어 사용. 특수기호, 불필요한 수식어 배제. 순수 텍스트와 논리적 전개에 집중.</p>
            <p><strong>콘텐츠 목표:</strong> 독자의 삶에 실질적인 변화를 유도하는 깊이 있는 통찰력 제공.</p>
          </Section>

          <Section title="(2) 7단계 글쓰기 프레임워크">
            <p><strong>1단계 (Hooking):</strong> 흥미로운 질문이나 일화로 독자의 시선 끌기</p>
            <p><strong>2단계 (일상 공감):</strong> 현대인의 일상과 연결되는 보편적인 문제 제시</p>
            <p><strong>3단계 (배경 확장):</strong> 역사, 과학, 심리학 등 외부 자료를 융합하여 문제의 다각적 분석</p>
            <p><strong>4단계 (극복 사례):</strong> 구체적인 인물이나 사건을 통해 문제 해결 과정 제시</p>
            <p><strong>5단계 (성경적 원리):</strong> 잠언의 핵심 원리를 보편적 가치로 재해석하여 연결</p>
            <p><strong>6단계 (사유 질문):</strong> 독자 스스로 생각하고 삶에 적용할 수 있는 질문 던지기</p>
            <p><strong>7단계 (마무리):</strong> 긍정적인 격려와 실천적 조언으로 마무리</p>
          </Section>

          <Section title="(3) '도서관 사서' 페르소나 (자료 검색)">
            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                value={librarianQuery}
                onChange={(e) => setLibrarianQuery(e.target.value)}
                placeholder="키워드 입력 (예: 용서, 불안, 관계)"
                className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D6D5F] outline-none"
              />
              <button 
                onClick={handleLibrarianSearch}
                disabled={isLoadingLibrarian}
                className="bg-[#5D6D5F] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-[#4a574c] transition-all disabled:opacity-50 flex items-center"
              >
                {isLoadingLibrarian ? '검색 중...' : '자료 검색'}
              </button>
            </div>
            {librarianResult && (
              <div className="p-4 bg-white rounded border whitespace-pre-wrap">{librarianResult}</div>
            )}
          </Section>

          <Section title="(4) 원클릭 콘텐츠 변환">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-xs mb-2 block">원본 콘텐츠 입력:</label>
                <textarea 
                  value={originalContent}
                  onChange={(e) => setOriginalContent(e.target.value)}
                  placeholder="10,000자 원본 콘텐츠를 여기에 붙여넣으세요..."
                  className="w-full h-48 p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D6D5F] outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-xs mb-2 block">변환 결과:</label>
                <div className="w-full h-48 p-3 text-sm bg-white rounded border whitespace-pre-wrap overflow-y-auto">{transformedContent || "플랫폼을 선택하여 변환하세요."}</div>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => handleTransform('youtube')} className="bg-red-600 text-white px-4 py-2 text-xs rounded-md hover:bg-red-700">유튜브 스크립트</button>
              <button onClick={() => handleTransform('newsletter')} className="bg-blue-600 text-white px-4 py-2 text-xs rounded-md hover:bg-blue-700">뉴스레터</button>
              <button onClick={() => handleTransform('instagram')} className="bg-purple-600 text-white px-4 py-2 text-xs rounded-md hover:bg-purple-700">인스타그램</button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
