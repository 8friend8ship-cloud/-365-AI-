import { useState } from 'react';
import type React from 'react';
import DayContent from './components/DayContent';
import AILab from './components/AILab';
import ProverbList from './components/ProverbList';
import StrategyDashboard from './components/StrategyDashboard';
import AdminDashboard from './components/AdminDashboard';
import { proverbs as initialProverbs, defaultVerse, ProverbData } from './data/proverbs';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('1:1-2');
  const [proverbsData, setProverbsData] = useState<Record<string, ProverbData>>(initialProverbs);
  const [currentVerseData, setCurrentVerseData] = useState<ProverbData | null>(defaultVerse);
  const [error, setError] = useState<string | null>(null);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const verse = proverbsData[query];
    if (verse) {
      setCurrentVerseData(verse);
      setError(null);
      setIsListOpen(false); // Close list on search
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

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🕯️</span>
              <span className="text-xl font-bold serif tracking-tight text-[#5D6D5F]">지혜의 등불 365</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => setIsListOpen(!isListOpen)}
                className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                전체 목록
              </button>
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="예: 1:3"
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-full w-28 focus:ring-2 focus:ring-[#5D6D5F] outline-none"
                />
                <button type="submit" className="px-4 py-1.5 bg-gray-100 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors">검색</button>
              </form>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsDashboardOpen(true)}
                className="bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-black transition-all"
              >
                전략 대시보드
              </button>
              <button 
                onClick={() => setIsLabOpen(!isLabOpen)} 
                className="bg-[#5D6D5F] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#4a574c] transition-all"
              >
                ✨ AI 실험실
              </button>
              <button onClick={() => setIsAdminOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-red-700">관리자</button>
            </div>
          </div>
        </div>
      </nav>

      {isListOpen && <ProverbList proverbs={proverbsData} onSelectVerse={handleSelectVerse} />}

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div id="content-area" className="space-y-12">
          {error && <p className="text-red-500 text-center font-bold">{error}</p>}
          <DayContent data={currentVerseData} />
        </div>

        <AILab verseData={currentVerseData} isOpen={isLabOpen} onClose={() => setIsLabOpen(false)} />
        <StrategyDashboard isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} />
        <AdminDashboard 
          isOpen={isAdminOpen} 
          onClose={() => setIsAdminOpen(false)} 
          proverbs={proverbsData}
          setProverbs={setProverbsData}
        />
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 serif">조용기 목사 저 [잠언으로 여는 365일] 기반</p>
          <p className="text-xs text-gray-400 mt-2">© 2026 Interactive Wisdom Project. Powered by Gemini API.</p>
        </div>
      </footer>
    </div>
  );
}
