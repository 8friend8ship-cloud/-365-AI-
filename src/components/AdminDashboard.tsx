import React, { useState } from 'react';
import type { ProverbData } from '../data/proverbs';
import { historicalEvents } from '../data/historicalEvents';
import { GoogleGenAI } from '@google/genai';
import EditProverbModal from './EditProverbModal';

// Lazy initialization for Gemini API
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  proverbs: Record<string, ProverbData>;
  setProverbs: React.Dispatch<React.SetStateAction<Record<string, ProverbData>>>;
}

export default function AdminDashboard({ isOpen, onClose, proverbs, setProverbs }: AdminDashboardProps) {
  if (!isOpen) return null;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ key: string; commentary: string; application: string } | null>(null);
  const [editingProverb, setEditingProverb] = useState<[string, ProverbData] | null>(null);

  const handleDownload = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(proverbs, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "proverbs.json";
    link.click();
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        if (e.target && typeof e.target.result === 'string') {
          try {
            const newProverbsData = JSON.parse(e.target.result);
            setProverbs(newProverbsData);
            alert('잠언 데이터가 성공적으로 업데이트되었습니다.');
          } catch (error) {
            alert('에러: 유효하지 않은 JSON 파일입니다.');
          }
        }
      };
    }
  };

  const triggerUpload = () => {
    const input = document.getElementById('json-upload-input') as HTMLInputElement;
    input?.click();
  };

  const handleDelete = (keyToDelete: string) => {
    if (window.confirm(`정말로 '${keyToDelete}' 잠언을 삭제하시겠습니까?`)) {
      const { [keyToDelete]: _, ...remainingProverbs } = proverbs;
      setProverbs(remainingProverbs);
    }
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    setGeneratedResult(null);

    const incompleteKey = Object.keys(proverbs).find(key => 
      !proverbs[key].title || !proverbs[key].commentary || proverbs[key].commentary.length < 20 // Simple check for placeholder
    );

    if (!incompleteKey) {
      alert("모든 잠언에 V4 콘텐츠가 채워져 있습니다.");
      setIsGenerating(false);
      return;
    }

    const targetProverb = proverbs[incompleteKey];
    const theme = targetProverb.theme;

    const eventForTheme = historicalEvents.find(e => e.theme.toLowerCase() === theme.toLowerCase());

    if (!eventForTheme) {
      alert(`'${theme}' 주제에 맞는 역사적 사건 DB를 찾을 수 없습니다.`);
      setIsGenerating(false);
      return;
    }

    const ai = getAI();
    if (!ai) {
      alert("API Key가 설정되지 않았습니다.");
      setIsGenerating(false);
      return;
    }

    const v4_prompt = `
      당신은 역사적 사건을 바탕으로 잠언을 스토리텔링하는 콘텐츠 작가입니다.
      다음 V4 템플릿 구조와 제공된 정보를 사용하여, 독자가 몰입하고 깨달음을 얻을 수 있는 묵상 글을 생성해주세요.
      반드시 JSON 형식으로만 응답해야 합니다.

      --- 제공된 정보 ---
      - 잠언 구절: "${targetProverb.verse}" (참고: ${targetProverb.source})
      - 핵심 주제: ${theme}
      - 관련 역사 사건: ${eventForTheme.event} (${eventForTheme.person || '관련 인물들'})
      - 사건 요약: ${eventForTheme.summary}

      --- V4 템플릿 (이 구조를 반드시 지켜주세요) ---
      1. hookingQuestion: '왜' 또는 '어떻게'로 시작하는 강한 질문.
      2. historicalStory: 제공된 역사 사건 요약을 바탕으로 5~8문장의 몰입감 있는 이야기로 재구성. 설명조 금지.
      3. insight: 역사 이야기에서 인간의 보편적인 심리나 본성에 대한 통찰로 연결하는 문장. (예: 문제는 환경이 아니었습니다. 교만은 판단을 흐립니다.)
      4. quote: 주제와 관련된 유명 인물/철학자의 격언 1~2 문장.
      5. interpretation: 잠언의 핵심 의미를 하나님의 관점에서 해석.
      6. wisdomAcquisition: 지혜를 얻는 구체적인 방법 2~3가지 제시. (예: 기도, 겸손, 말씀 묵상)
      7. applicationDeclaration: '그러므로 우리는 ... 해야 합니다.' 형식의 적용 선언.
      8. conclusion: 지혜로운 사람의 정의와 하나님 의존의 중요성을 강조하는 결론.
      9. finalQuestion: 독자에게 던지는 마지막 질문. (예: 당신은 지금 어떤 선택 앞에 서 있습니까?)
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: v4_prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              hookingQuestion: { type: 'STRING' },
              historicalStory: { type: 'STRING' },
              insight: { type: 'STRING' },
              quote: { type: 'STRING' },
              interpretation: { type: 'STRING' },
              wisdomAcquisition: { type: 'STRING' },
              applicationDeclaration: { type: 'STRING' },
              conclusion: { type: 'STRING' },
              finalQuestion: { type: 'STRING' },
            },
          },
        },
      });
      const v4_content = JSON.parse(response.text || '{}');
      
      // V4 콘텐츠로 기존 잠언 데이터 업데이트
      setProverbs(currentProverbs => ({
        ...currentProverbs,
        [incompleteKey]: {
          ...currentProverbs[incompleteKey],
          title: v4_content.hookingQuestion, // 후킹 질문을 제목으로 사용
          commentary: `${v4_content.historicalStory}\n\n${v4_content.insight}\n\n${v4_content.quote}\n\n${v4_content.interpretation}`,
          application: `${v4_content.wisdomAcquisition}\n\n${v4_content.applicationDeclaration}\n\n${v4_content.conclusion}\n\n${v4_content.finalQuestion}`,
        }
      }));

      setGeneratedResult({ 
        key: incompleteKey, 
        commentary: v4_content.historicalStory, 
        application: v4_content.finalQuestion 
      });

    } catch (error) {
      console.error("V4 Content Generation error:", error);
      alert("V4 콘텐츠 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold serif text-[#5D6D5F]">관리자 대시보드</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">닫기</button>
        </div>
        <div className="flex-grow overflow-y-auto pr-4">
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-[#5D6D5F] border-b pb-2 mb-4">잠언 데이터 관리</h3>
            <div className="flex gap-4">
              <button onClick={handleDownload} className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700">JSON 다운로드</button>
              <button onClick={triggerUpload} className="bg-green-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-green-700">JSON 업로드</button>
              <input type="file" id="json-upload-input" accept=".json" onChange={handleUpload} className="hidden" />
            </div>
          </div>
          
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-[#5D6D5F] border-b pb-2 mb-4">콘텐츠 현황 및 관리</h3>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                총 <span className="font-bold">{Object.keys(proverbs).length}</span>개 중
                <span className="font-bold text-green-600"> {Object.values(proverbs).filter(p => p.title && p.commentary.length > 20).length}</span>개 완성,
                <span className="font-bold text-red-600"> {Object.values(proverbs).filter(p => !p.title || p.commentary.length < 20).length}</span>개 미완성
              </p>
            </div>
            <div className="h-64 overflow-y-auto border rounded-md bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2">구절</th>
                    <th className="p-2">제목 (후킹 질문)</th>
                    <th className="p-2">상태</th>
                    <th className="p-2">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(proverbs).map(([key, proverb]) => (
                    <tr key={key} className="border-b">
                      <td className="p-2 font-mono">{key}</td>
                      <td className="p-2 truncate max-w-xs">{proverb.title || '(비어 있음)'}</td>
                      <td className="p-2">
                        {proverb.title && proverb.commentary.length > 20 ? (
                          <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">완성</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">미완성</span>
                        )}
                      </td>
                      <td className="p-2">
                        <button onClick={() => setEditingProverb([key, proverb])} className="text-blue-600 hover:underline text-xs">수정</button>
                        <button onClick={() => handleDelete(key)} className="text-red-600 hover:underline text-xs ml-2">삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-[#5D6D5F] border-b pb-2 mb-4">V4 자동 콘텐츠 생성</h3>
            <p className="text-sm text-gray-500 mb-4">버튼을 누르면 제목이나 해설이 비어있는 잠언을 자동으로 찾아 V4 템플릿에 맞춰 AI가 콘텐츠를 생성하고 데이터를 즉시 업데이트합니다.</p>
            <button onClick={handleAutoGenerate} disabled={isGenerating} className="w-full bg-[#5D6D5F] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-[#4a574c] disabled:opacity-50">
              {isGenerating ? '생성 중...' : '미완성 잠언 찾아 V4 콘텐츠 생성'}
            </button>
            {generatedResult && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-bold mb-2">✅ <span className="text-blue-600">{generatedResult.key}</span> V4 콘텐츠 생성 및 업데이트 완료</h4>
                <h5 className="font-bold mt-4 mb-2">생성된 역사 이야기:</h5>
                <p className="text-sm bg-white p-3 rounded border">{generatedResult.commentary}</p>
                <h5 className="font-bold mt-4 mb-2">생성된 마지막 질문:</h5>
                <p className="text-sm bg-white p-3 rounded border">{generatedResult.application}</p>
              </div>
            )}
          </div>

        </div>
        {editingProverb && (
          <EditProverbModal 
            proverbData={editingProverb} 
            onClose={() => setEditingProverb(null)}
            onSave={(updatedProverb) => {
              setProverbs(current => ({
                ...current,
                [editingProverb[0]]: updatedProverb,
              }));
              setEditingProverb(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
