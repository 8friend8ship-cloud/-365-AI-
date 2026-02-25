import { useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { ProverbData } from '../data/proverbs';

// Lazy initialization to prevent crash on startup if API key is missing
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

interface AILabProps {
  verseData: ProverbData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AILab({ verseData, isOpen, onClose }: AILabProps) {
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<{ uri: string; title: string }[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const [loadingGuru, setLoadingGuru] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingArt, setLoadingArt] = useState(false);
  const [loadingTTS, setLoadingTTS] = useState(false);

  if (!isOpen || !verseData) return null;

  const askAIGuru = async () => {
    if (!query) return;
    const ai = getAI();
    if (!ai) {
      setAiResponse("API Key가 설정되지 않았습니다.");
      return;
    }

    setLoadingGuru(true);
    setAiResponse(null);
    setGroundingLinks([]);

    const verse = verseData.reference;
    const sysInstruction = `당신은 성경적 지혜의 멘토입니다. 오늘의 말씀(${verse})과 조용기 목사님의 메시지를 결합하여 사용자의 고민에 대해 '훈계'와 '지혜'를 담은 조언을 하세요. 한국어로 답변하되, 구절의 의미를 현실적으로 적용해주세요.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: query }] }],
        config: {
          systemInstruction: sysInstruction,
        }
      });
      setAiResponse(response.text || "답변을 생성할 수 없습니다.");
    } catch (error) {
      console.error(error);
      setAiResponse("상담 중 오류가 발생했습니다.");
    } finally {
      setLoadingGuru(false);
    }
  };

  const searchDeepInsight = async () => {
    const ai = getAI();
    if (!ai) {
      setAiResponse("API Key가 설정되지 않았습니다.");
      return;
    }

    setLoadingInsight(true);
    setAiResponse(null);
    setGroundingLinks([]);

    const verse = verseData.reference;
    const prompt = `오늘의 말씀(${verse})에 등장하는 핵심 단어(지혜, 훈계, 명철 등)의 원어적 의미와 역사적 배경을 검색하여 깊은 신학적 통찰을 제공하세요.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            tools: [{ googleSearch: {} }],
        }
      });
      
      setAiResponse(response.text || "연구 결과를 찾을 수 없습니다.");
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const links = chunks
            .map((c: any) => c.web ? { uri: c.web.uri, title: c.web.title } : null)
            .filter((l: any) => l !== null);
        setGroundingLinks(links);
      }

    } catch (error) {
      console.error(error);
      setAiResponse("연구 중 오류가 발생했습니다.");
    } finally {
      setLoadingInsight(false);
    }
  };

  const generateWordArt = async () => {
    const ai = getAI();
    if (!ai) {
      setAiResponse("API Key가 설정되지 않았습니다.");
      return;
    }

    setLoadingArt(true);
    setGeneratedImage(null);

    const theme = verseData.id === 'jan1' 
      ? 'Light of Wisdom and Humility' 
      : 'Safety of choosing the path of obedience over shortcut';
    const prompt = `A cinematic, peaceful, and artistic spiritual illustration representing the theme: \"${theme}\". No text, warm professional aesthetic.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [ { text: prompt } ],
            },
            config: {
                imageConfig: { aspectRatio: "1:1" },
            },
        });

        let base64Image = null;
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64Image = part.inlineData.data;
                break;
            }
        }

        if (base64Image) {
            setGeneratedImage(`data:image/png;base64,${base64Image}`);
        } else {
            console.error("No image generated from API response");
            setAiResponse("AI가 이미지를 생성하지 못했습니다. 응답에 이미지 데이터가 없습니다.");
        }
    } catch (error) {
      console.error("Image generation API error:", error);
      setAiResponse("이미지 생성 중 API 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoadingArt(false);
    }
  };

  const speakResponse = async () => {
    if (!aiResponse) return;
    const ai = getAI();
    if (!ai) return;

    setLoadingTTS(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say warmly: ${aiResponse.slice(0, 500)}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        playPCM(base64Audio);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTTS(false);
    }
  };

  const playPCM = (base64: string) => {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for(let i=0; i<binary.length; i++) array[i] = binary.charCodeAt(i);
    
    const wav = createWav(array.buffer, 24000);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
  };

  const createWav = (pcmBuffer: ArrayBuffer, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + pcmBuffer.byteLength);
    const view = new DataView(buffer);
    const writeString = (offset: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)); };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmBuffer.byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmBuffer.byteLength, true);
    new Uint8Array(buffer, 44).set(new Uint8Array(pcmBuffer));
    return buffer;
  };

  return (
    <section id="ai-lab" className="mt-16">
      <div className="ai-glass rounded-3xl p-8 shadow-2xl border-2 border-[#5D6D5F]/10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold serif text-[#5D6D5F] flex items-center">
            <span className="mr-3">✨</span> AI 지혜 연구소
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">닫기</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature 1: AI Counseling */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-2">💬</span> ✨ AI 지혜 멘토링
            </h3>
            <p className="text-xs text-gray-500 mb-4">현재의 고민을 입력하면 오늘의 잠언과 연결하여 조언해 드립니다.</p>
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-3 text-sm border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5D6D5F] outline-none h-24 mb-4" 
              placeholder="오늘 어떤 선택의 갈림길에 서 계신가요?"
            />
            <button 
              onClick={askAIGuru} 
              disabled={loadingGuru}
              className="w-full bg-[#5D6D5F] text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex justify-center items-center disabled:opacity-50"
            >
              <span>지혜 구하기</span>
              {loadingGuru && <div className="loader ml-2"></div>}
            </button>
          </div>

          {/* Feature 2: Insight Search */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-2">🔍</span> ✨ 역사적 배경 탐구
            </h3>
            <p className="text-xs text-gray-500 mb-4">말씀의 시대적 배경이나 히브리어 원어의 깊은 의미를 검색합니다.</p>
            <div className="text-xs text-gray-600 h-32 overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg italic">
              버튼을 눌러 연구를 시작하세요.
            </div>
            <button 
              onClick={searchDeepInsight}
              disabled={loadingInsight}
              className="w-full border-2 border-[#5D6D5F] text-[#5D6D5F] py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex justify-center items-center disabled:opacity-50"
            >
              <span>연구 시작</span>
              {loadingInsight && <div className="loader ml-2"></div>}
            </button>
          </div>

          {/* Feature 3: Word Art Gen */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-2">🎨</span> ✨ 말씀 시각화
            </h3>
            <p className="text-xs text-gray-500 mb-4">오늘의 말씀이 가진 이미지를 AI가 예술로 승화시킵니다.</p>
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              {generatedImage ? (
                <img src={generatedImage} className="absolute inset-0 w-full h-full object-cover" alt="Generated Verse Art" />
              ) : (
                <span className="text-xs text-gray-400">이미지가 생성됩니다.</span>
              )}
            </div>
            <button 
              onClick={generateWordArt}
              disabled={loadingArt}
              className="w-full bg-[#D4A373] text-white py-3 rounded-xl font-bold text-sm mt-4 hover:shadow-lg transition-all flex justify-center items-center disabled:opacity-50"
            >
              <span>아트 생성</span>
              {loadingArt && <div className="loader ml-2"></div>}
            </button>
          </div>
        </div>

        {/* Response Area */}
        {aiResponse && (
          <div className="mt-8 bg-white/50 p-6 rounded-2xl border-l-4 border-[#5D6D5F] fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5D6D5F]">AI 조언 결과</span>
              <button onClick={speakResponse} disabled={loadingTTS} className="text-xs flex items-center text-gray-500 hover:text-gray-800 disabled:opacity-50">
                <span className="mr-1">🔊</span> ✨ 음성으로 듣기
                {loadingTTS && <div className="loader ml-2"></div>}
              </button>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</div>
            {groundingLinks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                {groundingLinks.map((link, idx) => (
                  <a key={idx} href={link.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-all">
                    🔗 {link.title || '출처'}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
