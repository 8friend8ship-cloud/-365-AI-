import { ProverbData } from '../data/proverbs';

interface ProverbListProps {
  proverbs: Record<string, ProverbData>;
  onSelectVerse: (key: string) => void;
  lang?: string;
}

export default function ProverbList({ proverbs, onSelectVerse, lang = 'KO' }: ProverbListProps) {
  return (
    <div className="absolute top-16 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-lg z-40 max-h-[50vh] overflow-y-auto animate-fade-in-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ul className="space-y-2">
          {Object.entries(proverbs).map(([key, proverb]) => {
            const tr = proverb.translations?.[lang] ?? proverb.translations?.KO ?? {};
            const displayTitle = tr?.devotion?.title ?? tr?.dry?.title ?? proverb.title ?? '';
            return (
              <li key={key}>
                <button
                  onClick={() => onSelectVerse(key)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <p className="font-bold text-sm text-[#5D6D5F]">{proverb.reference}</p>
                  <p className="text-xs text-gray-600 mt-1">{displayTitle}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
