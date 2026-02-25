import { RadarChart, BarChart } from './Charts';
import { ProverbData } from '../data/proverbs';

interface DayContentProps {
  data: ProverbData | null;
}

const MountaineerSimulation = () => (
  <div className="mb-16">
    <h2 className="text-2xl font-bold serif text-center mb-8">하산의 갈림길: 선택의 시뮬레이션</h2>
    <div className="flex flex-col md:flex-row justify-center items-start gap-8">
      <div className="w-full md:w-1/3">
        <div className="flow-node bg-gray-800 text-white">폭설 속의 등반대</div>
        <div className="flow-line"></div>
        <div className="flex justify-between items-start">
          <div className="w-5/12">
            <div className="flow-node bg-[#5D6D5F] text-white text-xs">리더의 먼 길<br />(훈계 순종)</div>
            <div className="flow-line"></div>
            <div className="flow-node bg-green-100 text-green-800 font-bold border-2 border-green-500">생존 (안전)</div>
          </div>
          <div className="w-5/12">
            <div className="flow-node bg-[#B07D62] text-white text-xs">회원의 지름길<br />(자기 판단)</div>
            <div className="flow-line"></div>
            <div className="flow-node bg-red-100 text-red-800 font-bold border-2 border-red-500">멸망 (사망)</div>
          </div>
        </div>
      </div>
      <div className="w-full md:w-2/3 bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
        <h3 className="font-bold text-gray-500 mb-6">위험도 vs 생존 확률 분석</h3>
        <BarChart />
      </div>
    </div>
  </div>
);

export default function DayContent({ data }: DayContentProps) {
  if (!data) {
    return (
      <div className="text-center py-16 fade-in">
        <h2 className="text-2xl font-bold serif text-gray-500">잠언 구절을 검색해주세요.</h2>
        <p className="text-gray-400 mt-2">예: 1:1-2 또는 1:3</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-16">
        <span style={{color: data.accentColor}} className="font-bold tracking-[0.2em] text-sm uppercase">{data.tag}</span>
        <h1 className="text-4xl md:text-5xl font-bold serif mt-4 text-[#5D6D5F]">{data.title}</h1>
        <div style={{borderColor: data.accentColor}} className="mt-8 max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border-l-8">
          <p className="text-lg md:text-xl italic text-gray-700 serif leading-relaxed">
            "{data.verse}"
          </p>
          <p className="mt-4 font-bold text-gray-500">{data.source}</p>
        </div>
      </div>

      {data.simulation === 'mountaineer' ? (
        <MountaineerSimulation />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold serif border-b-2 border-[#5D6D5F]/20 pb-2">{data.theme}</h2>
            <p className="text-gray-600 leading-relaxed">
              {data.commentary}
            </p>
            {data.application && (
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h4 className="font-bold mb-2">오늘의 적용</h4>
                <p className="text-sm text-gray-500">{data.application}</p>
              </div>
            )}
          </div>
          <div className="card p-8 bg-white rounded-3xl shadow-lg border border-gray-100">
            <h3 className="text-center font-bold text-gray-500 mb-4">속성 분석 레이더</h3>
            <RadarChart />
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center max-w-2xl mx-auto">
        <p className="text-gray-600 italic">
          {data.simulation === 'mountaineer' ? data.commentary : ''}
        </p>
      </div>
    </div>
  );
}
