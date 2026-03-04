import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Download, 
  MessageCircle, 
  Sparkles, 
  LayoutDashboard, 
  Settings, 
  RefreshCw,
  FileText,
  Music,
  Volume2
} from 'lucide-react';
import DayContent from './components/DayContent';
import AILab from './components/AILab';
import ProverbList from './components/ProverbList';
import StrategyDashboard from './components/StrategyDashboard';
import AdminDashboard from './components/AdminDashboard';
import { proverbs as initialProverbs, defaultVerse, ProverbData } from './data/proverbs';
import { getUIText } from './i18n/uiTexts';

import { EngineLangKey, EnginePiece, EngineLangBlock, EngineResponseData, DailyPack } from './types';

// ✅ Apps Script WebApp URL (v53.0)
const WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbzMNeTPcLIktMPqzkJnVH4tJG_fZNt6821LQDwJtaBAkr5sYCjpFX_LFS_bBsDJwHne/exec';
const SPREADSHEET_ID = '1qHteZrNUa3ln2lix3p1Bufsh1o6WN98Ogoy9acuTlBg';
const ACCESS_TOKEN = import.meta.env.VITE_ACCESS_TOKEN || 'bible2026secret';
const EDITOR_ID = '109430604282542310163';

function toDirectAudioUrl(urlOrId: string, webAppUrl?: string, token?: string, spreadsheetId?: string, editorId?: string) {
  if (!urlOrId) return '';
  try {
    // 1. 이미 fileId 형태(고유 문자열)이거나 드라이브 ID만 넘어온 경우 처리
    let id = '';
    if (urlOrId.includes('drive.google.com')) {
      const m = urlOrId.match(/[-\w]{25,}/);
      id = m ? m[0] : '';
    } else if (!urlOrId.includes('http') && urlOrId.length >= 25) {
      id = urlOrId; // 직접 ID가 넘어온 경우
    }

    if (id) {
      // Apps Script proxy for audio is not supported, fallback to direct Google Drive URL
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }

    // 2. 이미 GAS URL인 경우 토큰과 시트 ID 확인 및 추가 (이 부분도 직접 드라이브 URL로 변환 시도)
    if (urlOrId.includes("script.google.com")) {
      const newUrl = new URL(urlOrId);
      if (newUrl.searchParams.has("fileId")) {
        const fileId = newUrl.searchParams.get("fileId");
        if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      if (newUrl.searchParams.has("id")) {
        const fileId = newUrl.searchParams.get("id");
        if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      // 만약 fileId가 없다면 원래 URL 반환
      return urlOrId;
    }
  } catch (e) {
    console.error("Error in toDirectAudioUrl:", e);
  }
  return urlOrId;
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('1:1-2');
  const [proverbsData, setProverbsData] = useState<Record<string, ProverbData>>(initialProverbs);
  const [currentVerseData, setCurrentVerseData] = useState<ProverbData | null>(defaultVerse);
  const [error, setError] = useState<string | null>(null);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [appLang, setAppLang] = useState<EngineLangKey>(() => {
    return (localStorage.getItem('app_lang') as EngineLangKey) || 'KO';
  });

  const t = (key: string) => getUIText(appLang, key);

  useEffect(() => {
    localStorage.setItem('app_lang', appLang);
  }, [appLang]);

  // ✅ 초기 데이터 로드
  useEffect(() => {
    callBibleEngine();
  }, []);

  // ✅ URL 빌더 (토큰 및 시트 ID 자동 포함)
  const buildEngineUrl = (params: Record<string, string>) => {
    const url = new URL(WEBAPP_URL);
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));
    url.searchParams.set('token', ACCESS_TOKEN);
    url.searchParams.set('spreadsheetId', SPREADSHEET_ID);
    url.searchParams.set('editorId', EDITOR_ID);
    url.searchParams.set('t', Date.now().toString()); // 브라우저 캐시 완벽 차단
    return url.toString();
  };

  // ✅ Engine UI state
  const [isEngineLoading, setIsEngineLoading] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [enginePack, setEnginePack] = useState<DailyPack | null>(null);
  const [selectedSlot, setSelectedSlot] = useState(0); // 0 to 4
  const [engineLang, setEngineLang] = useState<EngineLangKey>('KO');
  // const [engineMode, setEngineMode] = useState<'dry' | 'devotion'>('devotion'); // ❌ 모드 제거
  const [audioStatus, setAudioStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const engineData = useMemo(() => {
    if (!enginePack || !enginePack.items || enginePack.items.length === 0) return null;
    return enginePack.items[selectedSlot] || enginePack.items[0];
  }, [enginePack, selectedSlot]);

  const downloadScript = () => {
    if (!engineBody) return;
    const element = document.createElement("a");
    const file = new Blob([engineBody], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `script-${engineData?.id || 'today'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAudio = () => {
    if (!engineAudio) return;
    const element = document.createElement("a");
    element.href = engineAudio;
    element.download = `audio-${engineData?.id || 'today'}.mp3`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const verse = proverbsData[query];
    if (verse) {
      setCurrentVerseData(verse);
      setError(null);
      setIsListOpen(false);
    } else {
      setError(`'${query}'에 해당하는 잠언을 찾을 수 없습니다.`);
      setCurrentVerseData(null);
    }
  };

  const handleSelectVerse = (key: string) => {
    setSearchQuery(key);
    setCurrentVerseData(proverbsData[key]);
    setError(null);
    setIsListOpen(false);
  };

  // ✅ 엔진 호출 (JSONP 방식) - 재귀적 폴백 지원 (로컬 캐싱 추가)
  const callBibleEngine = async (requestType: 'today' | 'latest' | 'random' = 'today', force = false) => {
    // ✅ 오늘 날짜 기반 캐시 키 생성
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const cacheKey = `bible_engine_cache_${todayStr}`;

    let hasCachedData = false;

    // ✅ 강제 새로고침 시 기존 캐시 완전 삭제
    if (force) {
      console.log("🗑️ Force refresh requested. Clearing local cache...");
      localStorage.removeItem(cacheKey);
    } else if (requestType === 'today') {
      // ✅ 강제 갱신이 아니고 'today' 요청인 경우 캐시 확인 (Stale-while-revalidate)
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const pack = JSON.parse(cached);
          console.log("🚀 Using cached engine data for today, but will revalidate in background.");
          setEnginePack(pack);
          setSelectedSlot(0);
          hasCachedData = true;
          // 캐시를 사용하더라도 백그라운드에서 최신 데이터를 확인하기 위해 return 하지 않음
        } catch (e) {
          console.error("Failed to parse cached data", e);
          localStorage.removeItem(cacheKey);
        }
      }
    }

    if (!hasCachedData) {
      setIsEngineLoading(true);
    }
    setEngineError(null);

    console.log(`📡 Calling Engine... Type: ${requestType}`);

    try {
      const callbackName = `__be_cb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const script = document.createElement('script');
      
      const cleanup = () => {
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as any)[callbackName];
      };

      const data = await new Promise<any>((resolve, reject) => {
        (window as any)[callbackName] = (res: any) => {
          cleanup();
          resolve(res);
        };
        script.src = buildEngineUrl({ type: requestType, callback: callbackName });
        script.onerror = () => {
          cleanup();
          reject(new Error('네트워크 오류 또는 CORS 문제로 엔진에 연결할 수 없습니다.'));
        };
        document.body.appendChild(script);
        
        // 15초 타임아웃
        setTimeout(() => {
          cleanup();
          reject(new Error('엔진 응답 시간이 초과되었습니다.'));
        }, 15000);
      });
      
      if (!data || data.success !== true) {
        throw new Error(data?.error || '엔진 데이터 형식이 올바르지 않습니다.');
      }
      
      const pack = data as DailyPack;
      console.log(`📦 Engine Response (${requestType}):`, pack);
      
      // 🚨 데이터가 비어있으면 폴백 로직 실행
      if (!pack.items || pack.items.length === 0) {
        console.warn(`⚠️ No items found for type: ${requestType}`);
        
        if (requestType === 'today') {
          console.log("🔄 Fallback: Trying 'latest' (Yesterday's data)...");
          await callBibleEngine('latest');
          return;
        } else if (requestType === 'latest') {
          console.log("🔄 Fallback: Trying 'random' (Previous archive)...");
          await callBibleEngine('random');
          return;
        } else {
          throw new Error("데이터를 불러올 수 없습니다. (모든 시도 실패)");
        }
      }

      // ✅ 데이터가 있으면 처리 (Adapter 로직 포함)
      if (pack.items && pack.items.length > 0) {
        // ✅ Adapter: 서버에서 merged가 안 내려올 경우 프론트에서 생성
        pack.items.forEach(item => {
          // ✅ Map langs to translations if translations is missing
          if (item.langs && !item.translations) {
            item.translations = item.langs;
          }

          // 1. 기본 merged 생성
          if (!item.merged) {
            const devTitle = item.devotion?.title || '';
            const dryBody = item.dry?.body || '';
            const devBody = item.devotion?.body || '';
            item.merged = {
              title: devTitle || item.dry?.title || '',
              body: dryBody && devBody ? `${dryBody}\n\n${devBody}` : (dryBody || devBody)
            };
          } else if (typeof item.merged === 'string') {
            // 서버에서 merged가 문자열(본문)로 내려올 경우
            const devTitle = item.devotion?.title || item.dry?.title || '';
            item.merged = {
              title: devTitle,
              body: item.merged
            };
          }

          // 2. 번역별 merged 생성
          if (item.translations) {
            (Object.keys(item.translations) as EngineLangKey[]).forEach(lang => {
              const tr = item.translations![lang];
              if (tr && !tr.merged) {
                const trDevTitle = tr.devotion?.title || '';
                const trDryBody = tr.dry?.body || '';
                const trDevBody = tr.devotion?.body || '';
                tr.merged = {
                  title: trDevTitle || tr.dry?.title || '',
                  body: trDryBody && trDevBody ? `${trDryBody}\n\n${trDevBody}` : (trDryBody || trDevBody)
                };
              } else if (tr && typeof tr.merged === 'string') {
                const trDevTitle = tr.devotion?.title || tr.dry?.title || '';
                tr.merged = {
                  title: trDevTitle,
                  body: tr.merged
                };
              }
            });
          }
        });

        const firstItem = pack.items[0];
        console.log("🔍 First Item Translations:", firstItem.translations);
        
        if (!firstItem.translations || Object.keys(firstItem.translations).length === 0) {
          console.warn("⚠️ No translations found in the response. Please check if the Apps Script is updated.");
        }

        pack.items.sort((a, b) => {
          const timeA = a.AUDIO_CREATED_AT ? new Date(a.AUDIO_CREATED_AT).getTime() : 0;
          const timeB = b.AUDIO_CREATED_AT ? new Date(b.AUDIO_CREATED_AT).getTime() : 0;
          return timeA - timeB;
        });
      }

      // ✅ 캐시된 데이터와 동일한지 확인 (Deep Comparison)
      if (hasCachedData) {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cachedPack = JSON.parse(cachedStr);
          
          // 단순 ID/updatedAt 비교가 아니라 전체 데이터 비교 (내용 변경 감지)
          const isContentSame = JSON.stringify(cachedPack.items) === JSON.stringify(pack.items);
          
          if (isContentSame) {
            console.log("✅ Server data is identical to cached data. No update needed.");
            setIsEngineLoading(false);
            return;
          } else {
            console.log("🔄 New data found on server! Updating cache and UI...");
          }
        }
      }

      setEnginePack(pack);
      // ✅ 호출 시 5개 중 랜덤으로 하나 선택 (사용자 요청)
      const randomIdx = Math.floor(Math.random() * (pack.items?.length || 1));
      setSelectedSlot(randomIdx);
      
      // ✅ 성공적으로 데이터를 가져왔다면 오늘 날짜로 캐싱 (today 또는 latest인 경우)
      if (requestType === 'today' || requestType === 'latest') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(pack));
        } catch (storageError: any) {
          console.warn("⚠️ Failed to save to localStorage, possibly quota exceeded. Clearing old caches...", storageError);
          // Attempt to clear old caches
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('bible_engine_cache_') && key !== cacheKey) {
              localStorage.removeItem(key);
            }
          }
          // Try saving again after clearing
          try {
            localStorage.setItem(cacheKey, JSON.stringify(pack));
          } catch (e) {
            console.error("❌ Still failed to save to localStorage after clearing old caches.", e);
          }
        }
      }

    } catch (e: any) {
      if (!hasCachedData) {
        setEngineError(e?.message || '엔진 호출 중 오류가 발생했습니다.');
      } else {
        console.error("Background revalidation failed:", e);
      }
    } finally {
      setIsEngineLoading(false);
    }
  };

  // ✅ 엔진 헬스체크 (디버그용)
  const checkEngineHealth = async () => {
    setHealthStatus('checking');
    const callbackName = `__be_health_cb_${Date.now()}`;
    const script = document.createElement('script');
    
    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    const jsonpPromise = new Promise<boolean>((resolve) => {
      (window as any)[callbackName] = (data: any) => {
        cleanup();
        resolve(data && data.success === true);
      };
      script.src = buildEngineUrl({ ping: '1', callback: callbackName });
      script.onerror = () => {
        cleanup();
        resolve(false);
      };
      document.body.appendChild(script);
      setTimeout(() => { cleanup(); resolve(false); }, 5000);
    });

    const isOk = await jsonpPromise;
    setHealthStatus(isOk ? 'ok' : 'error');
    if (isOk) {
      setTimeout(() => setHealthStatus('idle'), 3000);
    }
  };

  const engineTitle = useMemo(() => {
    if (!engineData) return '';
    const tr = engineData.translations?.[appLang] ?? engineData.translations?.KO ?? {};
    // ✅ merged 우선 사용
    const m = tr.merged ?? engineData.merged;
    if (typeof m === 'string') {
      return tr.devotion?.title || tr.dry?.title || engineData.devotion?.title || engineData.dry?.title || '';
    }
    return m?.title ?? (tr.devotion?.title || tr.dry?.title || engineData.devotion?.title || engineData.dry?.title || '');
  }, [engineData, appLang]);

  // ✅ 상단 네비게이션용 타이틀 (항상 1번째 글의 제목 사용)
  const navTitle = useMemo(() => {
    if (!enginePack || !enginePack.items || enginePack.items.length === 0) return t('appTitle');
    const firstItem = enginePack.items[0];
    const tr = firstItem.translations?.[appLang] ?? firstItem.translations?.KO ?? {};
    const m = tr.merged ?? firstItem.merged;
    const title = typeof m === 'string' ? (tr.devotion?.title || tr.dry?.title || firstItem.devotion?.title || firstItem.dry?.title) : (m?.title || tr.devotion?.title || tr.dry?.title || firstItem.devotion?.title || firstItem.dry?.title);
    return title || t('appTitle');
  }, [enginePack, appLang, t]);

  const engineBody = useMemo(() => {
    if (!engineData) return '';
    const tr = engineData.translations?.[appLang] ?? engineData.translations?.KO ?? {};
    // ✅ merged 우선 사용
    const m = tr.merged ?? engineData.merged;
    if (typeof m === 'string') return m;
    if (m?.body) return m.body;
    return tr.devotion?.body || tr.dry?.body || engineData.devotion?.body || engineData.dry?.body || '';
  }, [engineData, appLang]);

  // ✅ 성경 구절 다국어 대응 (서버에서 translations.LANG.bible.text 로 내려줄 경우 대비)
  const engineBibleText = useMemo(() => {
    if (!engineData) return '';
    const tr = engineData.translations?.[appLang] ?? engineData.translations?.KO ?? {};
    // @ts-ignore - 서버에서 bible 번역을 추가할 경우를 대비
    if (tr.bible?.text) return tr.bible.text;
    return engineData.bible?.text || '';
  }, [engineData, appLang]);

  const engineAudio = useMemo(() => {
    if (!engineData) return '';
    
    // ✅ 1순위: 언어별 오디오 URL (새 정책)
    // 예: engineData.audio.EN, engineData.audio.JP ...
    const langAudio = engineData.audio?.[appLang];
    if (langAudio) {
      return toDirectAudioUrl(langAudio, WEBAPP_URL, ACCESS_TOKEN, SPREADSHEET_ID, EDITOR_ID);
    }

    // ✅ 2순위: AUDIO_FILE_ID (기존 호환, 한국어 기본)
    if (appLang === 'KO' && engineData.AUDIO_FILE_ID) {
      return toDirectAudioUrl(engineData.AUDIO_FILE_ID, WEBAPP_URL, ACCESS_TOKEN, SPREADSHEET_ID, EDITOR_ID);
    }

    // ✅ 3순위: Legacy Fallback (KO만 해당)
    if (appLang === 'KO') {
      return toDirectAudioUrl(engineData.audio?.KO || engineData.audio?.KO_MUKSANG || '', WEBAPP_URL, ACCESS_TOKEN, SPREADSHEET_ID, EDITOR_ID);
    }

    return '';
  }, [engineData, appLang, WEBAPP_URL]);

  // ✅ 오디오 자가 치유 (Repair) 호출
  const repairAudio = async () => {
    const fileName = engineData?.AUDIO_FILE_NAME;
    const id = engineData?.id;

    if (!fileName) {
      alert("⚠️ 복구할 파일명(AUDIO_FILE_NAME)이 시트에 없습니다. 먼저 음성을 생성해 주세요.");
      return;
    }

    console.log(`🔧 Repairing Audio... Target: ${fileName} (ID: ${id})`);
    setAudioStatus('loading');
    
    const callbackName = `__be_repair_cb_${Date.now()}`;
    const script = document.createElement('script');
    const timeout = 20000; // 20초로 연장 (드라이브 검색 시간 고려)
    
    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    const jsonpPromise = new Promise<{success: boolean, message?: string}>((resolve, reject) => {
      (window as any)[callbackName] = (data: any) => {
        cleanup();
        resolve(data);
      };
      
      const params = {
        type: 'repair',
        fileName: fileName,
        id: id || '',
        callback: callbackName
      };
      
      script.src = buildEngineUrl(params);
      script.onerror = () => { cleanup(); reject(new Error('네트워크 오류가 발생했습니다.')); };
      document.body.appendChild(script);
      
      setTimeout(() => { 
        cleanup(); 
        reject(new Error('서버 응답 시간이 초과되었습니다. (20초)')); 
      }, timeout);
    });

    try {
      const result = await jsonpPromise;
      if (result.success) {
        alert("✅ 오디오 데이터 복구 성공! 데이터를 다시 불러옵니다.");
        callBibleEngine('today', true);
      } else {
        throw new Error(result.message || "파일을 찾을 수 없거나 업데이트에 실패했습니다.");
      }
    } catch (e: any) {
      console.error("❌ Repair Failed:", e.message);
      alert(`❌ 복구 실패: ${e.message}`);
      setAudioStatus('error');
    }
  };

  // ✅ 오디오 진단 로그 (매칭 오류 추적용)
  useMemo(() => {
    if (engineAudio && engineData) {
      console.group("🎵 Audio Diagnostic Log");
      console.log("ID (Original):", engineData.id);
      console.log("App Lang:", appLang);
      console.log("Target Audio:", engineData.audio?.[appLang]);
      console.log("Final URL:", engineAudio);
      console.groupEnd();
    }
  }, [engineAudio, engineData, appLang]);

  // ✅ 음성 생성 호출 (통합된 'merged' 타입 사용)
  const generateVoice = async (text: string) => {
    if (!text) return;
    setIsEngineLoading(true);
    
    const callbackName = `__be_voice_cb_${Date.now()}`;
    const script = document.createElement('script');
    
    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    const jsonpPromise = new Promise((resolve, reject) => {
      (window as any)[callbackName] = (data: any) => {
        cleanup();
        if (data && data.success) resolve(data);
        else reject(new Error(data?.message || '음성 생성 실패'));
      };
      
      // content_type 파라미터를 'merged'로 고정
      const params = {
        type: 'voice',
        text: text,
        content_type: 'merged', // ✅ 통합 타입
        lang: appLang, // ✅ 언어 전달
        id: engineData?.id || 'temp',
        callback: callbackName
      };
      
      script.src = buildEngineUrl(params);
      script.onerror = () => { cleanup(); reject(new Error('네트워크 오류')); };
      document.body.appendChild(script);
      setTimeout(() => { cleanup(); reject(new Error('시간 초과')); }, 30000);
    });

    try {
      await jsonpPromise;
      alert(`${appLang} 음성이 생성되었습니다. 다시 엔진을 불러와주세요.`);
      callBibleEngine('today', true); // 데이터 갱신
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsEngineLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 min-w-0 mr-4">
              <span className="text-2xl flex-shrink-0">🕯️</span>
              <span className="text-base md:text-xl font-bold serif tracking-tight text-[#5D6D5F] leading-tight truncate">
                {navTitle}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsListOpen(!isListOpen)}
                className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                {t('allList')}
              </button>

              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-full w-28 focus:ring-2 focus:ring-[#5D6D5F] outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gray-100 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
                >
                  {t('searchButton')}
                </button>
              </form>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {/* ✅ 새로고침 버튼 */}
              <button
                onClick={() => callBibleEngine('today', true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                title="새로고침 (최신 데이터 불러오기)"
              >
                <RefreshCw size={18} className={isEngineLoading ? "animate-spin" : ""} />
              </button>

              {/* ✅ 앱 전역 언어 선택기 */}
              <select
                value={appLang}
                onChange={(e) => setAppLang(e.target.value as EngineLangKey)}
                className="text-xs border border-gray-200 rounded-full px-2 py-1 outline-none bg-white"
              >
                <option value="KO">KO 한국어</option>
                <option value="EN">EN English</option>
                <option value="JP">JP 日本語</option>
                <option value="CN">CN 中文</option>
                <option value="ES">ES Español</option>
                <option value="DE">DE Deutsch</option>
                <option value="HI">HI हिन्दी</option>
              </select>

              {/* ✅ 헬스체크 버튼 */}
              <button
                onClick={checkEngineHealth}
                disabled={healthStatus === 'checking'}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                  healthStatus === 'ok' ? 'bg-green-100 border-green-500 text-green-600' :
                  healthStatus === 'error' ? 'bg-red-100 border-red-500 text-red-600' :
                  'bg-gray-100 border-gray-200 text-gray-400 hover:border-gray-400'
                }`}
                title="엔진 연결 확인"
              >
                {healthStatus === 'checking' ? (
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : healthStatus === 'ok' ? '✓' : healthStatus === 'error' ? '!' : '?' }
              </button>

              <button
                onClick={() => setIsDashboardOpen(true)}
                className="bg-gray-800 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-full text-xs font-bold hover:bg-black transition-all flex items-center gap-1"
                title={t('strategyDashboard')}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden xl:inline">{t('strategyDashboard')}</span>
              </button>

              {/* ✅ 엔진 버튼 추가 (강제 갱신) */}
              <button
                onClick={() => callBibleEngine('today', true)}
                disabled={isEngineLoading}
                className={`px-3 py-2 lg:px-4 lg:py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  isEngineLoading ? 'bg-gray-300 text-gray-700' : 'bg-[#2E5E4E] text-white hover:bg-[#244a3c]'
                }`}
                title={t('todayEngineGenerate')}
              >
                <RefreshCw className={`w-4 h-4 ${isEngineLoading ? 'animate-spin' : ''}`} />
                <span className="hidden xl:inline">{isEngineLoading ? t('generating') : t('todayEngineGenerate')}</span>
              </button>

              <button
                onClick={() => setIsLabOpen(!isLabOpen)}
                className="bg-[#5D6D5F] text-white px-3 py-2 lg:px-4 lg:py-2 rounded-full text-xs font-bold hover:bg-[#4a574c] transition-all flex items-center gap-1"
                title={t('aiLab')}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden xl:inline">{t('aiLab')}</span>
              </button>

              <button
                onClick={() => setIsAdminOpen(true)}
                className="bg-red-600 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-full text-xs font-bold hover:bg-red-700 flex items-center gap-1"
                title={t('admin')}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden xl:inline">{t('admin')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isListOpen && <ProverbList proverbs={proverbsData} onSelectVerse={handleSelectVerse} lang={appLang} />}

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div id="content-area" className="space-y-12">
          {appLang !== 'KO' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
              <span>⚠️</span>
              {t('edgeTranslate')}
            </div>
          )}
          {error && <p className="text-red-500 text-center font-bold">{error}</p>}
          {engineError && <p className="text-red-500 text-center font-bold">{engineError}</p>}

          <DayContent data={currentVerseData} lang={appLang} />

          {/* ✅ 엔진 결과 섹션 */}
          {enginePack && enginePack.items && (
            <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-[#5D6D5F]">{t('todaySectionTitle')}</div>
                  <div className="text-xs text-gray-400">{enginePack.dayKey} 업데이트</div>
                </div>

                <div className="flex gap-2">
                  {enginePack.items.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => setSelectedSlot(idx)}
                      className={`w-10 h-10 rounded-full text-xs font-bold transition-all border ${
                        selectedSlot === idx 
                          ? 'bg-[#5D6D5F] text-white border-[#5D6D5F]' 
                          : 'bg-white text-gray-400 border-gray-200 hover:border-[#5D6D5F]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {engineData && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-base font-bold text-gray-900">{engineData.id || 'ENGINE_RESULT'}</div>
                      {engineData.situation && <div className="text-sm text-gray-600">{engineData.situation}</div>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* ✅ 언어 선택기 추가 */}
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full p-1 mr-2">
                        {(['KO', 'EN', 'JP', 'CN', 'ES', 'DE', 'HI', 'HE'] as EngineLangKey[]).map((lang) => {
                          const trans = engineData?.translations?.[lang];
                          const hasTrans = !!(trans?.merged || trans?.dry?.title || trans?.devotion?.title);
                          return (
                            <button
                              key={lang}
                              onClick={() => setAppLang(lang)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-full transition-all relative ${
                                appLang === lang ? 'bg-[#5D6D5F] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {lang}
                              {lang !== 'KO' && !hasTrans && (
                                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-400 rounded-full" title="데이터 없음" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={downloadScript}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-all flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {t('downloadScript')}
                      </button>

                      <button
                        onClick={() => {
                          if (!engineData) return;
                          const key = engineData.id || `engine-${Date.now()}`;
                          setProverbsData(prev => ({
                            ...prev,
                            [key]: {
                              id: key,
                              reference: key,
                              title: engineTitle,
                              verse: engineData.bible?.text || '',
                              source: engineData.bible?.ref || `잠언 ${key}`,
                              theme: engineData.situation || '지혜',
                              commentary: engineBody,
                              application: '오늘의 적용을 실천해봅시다.',
                              accentColor: '#5D6D5F',
                              tag: engineData.tag || '',
                              chartType: 'none',
                              // ✅ translations 데이터도 함께 저장하여 검색 모드에서 언어 전환 가능하게 함
                              translations: engineData.translations
                              // ✅ 검색 모드 오디오 미지원 정책에 따라 audioUrl 저장 안함
                            }
                          }));
                          alert(t('savedAlert'));
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full hover:bg-emerald-700 transition-all"
                      >
                        {t('saveToList')}
                      </button>

                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full p-1">
                        {/* ❌ 모드 선택 버튼 제거됨 */}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {engineData.bible && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic text-sm text-gray-600">
                        <span className="font-bold block mb-1">{engineData.bible.ref}</span>
                        {engineBibleText}
                      </div>
                    )}
                    <h2 className="text-xl font-bold serif text-[#2b3a2f]">{engineTitle || '제목 없음'}</h2>
                    <p className="text-sm leading-7 text-gray-800 whitespace-pre-wrap">{engineBody || '본문 없음'}</p>
                  </div>

                  {engineAudio && (
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-gray-700">{appLang} Audio</div>
                          {audioStatus === 'loading' && <span className="text-[10px] text-blue-500 animate-pulse">{t('loading')}</span>}
                          {audioStatus === 'ready' && <span className="text-[10px] text-green-600">{t('audioReady')}</span>}
                          {audioStatus === 'error' && <span className="text-[10px] text-red-500">{t('audioError')}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <select 
                            value={playbackRate} 
                            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                            className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 outline-none"
                            title="재생 속도"
                          >
                            <option value="0.8">0.8x</option>
                            <option value="1.0">1.0x</option>
                            <option value="1.2">1.2x</option>
                            <option value="1.5">1.5x</option>
                          </select>
                          <button 
                            onClick={downloadAudio}
                            disabled={!engineAudio || audioStatus !== 'ready'}
                            className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                            title="음성 다운로드"
                          >
                            <Download className="w-3 h-3" />
                            다운로드
                          </button>
                          <button 
                            onClick={() => generateVoice(engineBody)}
                            disabled={isEngineLoading}
                            className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            {isEngineLoading ? t('generating') : t('voiceRegen')}
                          </button>
                        </div>
                      </div>
                      <audio 
                        controls 
                        src={engineAudio} 
                        className="w-full h-10" 
                        key={engineAudio}
                        preload="metadata"
                        ref={(el) => {
                          if (el) el.playbackRate = playbackRate;
                        }}
                        onLoadedMetadata={(e) => {
                          setAudioStatus('ready');
                          (e.target as HTMLAudioElement).playbackRate = playbackRate;
                        }}
                        onLoadStart={() => setAudioStatus('loading')}
                        onError={() => {
                          setAudioStatus('error');
                          console.error("❌ Audio Load Failed!");
                          console.error("Target ID:", engineData?.id);
                          console.error("Target URL:", engineAudio);
                        }}
                      />
                      {audioStatus === 'error' && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-red-500 font-bold">
                            {t('audioLoadFail')}
                          </p>
                          <button 
                            onClick={repairAudio}
                            className="text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded border border-red-200 hover:bg-red-100 transition-all"
                          >
                            {t('repairAudio')}
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 text-right">{t('voiceRegenGuide')}</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        <AILab verseData={currentVerseData} isOpen={isLabOpen} onClose={() => setIsLabOpen(false)} lang={appLang} />
        <StrategyDashboard isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} lang={appLang} />
        <AdminDashboard
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          proverbs={proverbsData}
          setProverbs={setProverbsData}
          lang={appLang}
          enginePack={enginePack}
          onRefreshEngine={() => callBibleEngine('today', true)}
          isLoadingEngine={isEngineLoading}
        />
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 serif">{t('footerSource')}</p>
          <p className="text-xs text-gray-400 mt-2">{t('footerCopyright')}</p>
        </div>
      </footer>
    </div>
  );
}