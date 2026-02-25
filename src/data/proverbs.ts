export interface ProverbData {
  id: string;
  reference: string;
  title: string;
  verse: string;
  source: string;
  theme: string;
  commentary: string;
  application: string;
  chartType: 'radar' | 'bar' | 'none';
  accentColor: string;
  tag: string;
  simulation?: 'mountaineer';
}

export const proverbs: Record<string, ProverbData> = {
  '1:1-2': {
    id: 'jan1',
    reference: 'Proverbs 1:1-2',
    title: '지혜와 훈계의 시작',
    verse: '다윗의 아들 이스라엘 왕 솔로몬의 잠언이라 이는 지혜와 훈계를 알게 하며 명철의 말씀을 깨닫게 하며',
    source: '잠언 1:1-2',
    theme: '지식 vs 지혜',
    commentary: '영국 시인 쿠퍼는 "지식은 박식함을 자랑하지만, 지혜는 자신의 무지를 부끄러워한다"고 말했습니다. 단순한 정보의 나열인 \'지식\'은 우리를 교만하게 만들지만, 하나님의 인도함을 받는 \'지혜\'는 우리를 겸손의 자리로 이끕니다.',
    application: '지식보다 지혜를 얻기 위해 당신은 하나님께 무엇을 준비하고 있습니까?',
    chartType: 'radar',
    accentColor: '#D4A373',
    tag: 'JANUARY 1st',
  },
  '1:3': {
    id: 'jan2',
    reference: 'Proverbs 1:3',
    title: '순종의 갈림길',
    verse: '지혜롭게, 의롭게, 공평하게, 정직하게 행할 일에 대하여 훈계를 받게 하며',
    source: '잠언 1:3',
    theme: '하산의 갈림길: 선택의 시뮬레이션',
    commentary: '"눈에 보이는 가까운 길이 때로는 죽음의 길일 수 있습니다. 훈계를 받는 것은 생명을 지키는 지혜입니다."',
    application: '', 
    chartType: 'bar',
    accentColor: '#B07D62',
    tag: 'JANUARY 2nd',
    simulation: 'mountaineer',
  },
  '1:4': {
    id: 'jan3',
    reference: 'Proverbs 1:4',
    title: '어리석은 자를 위한 지혜',
    verse: '어리석은 자로 슬기롭게 하며 젊은 자에게 지식과 근신함을 주기 위한 것이니',
    source: '잠언 1:4',
    theme: '분별력의 중요성',
    commentary: '어리석음은 단순히 지식이 없는 상태가 아니라, 올바른 판단을 내리지 못하는 상태를 의미합니다. 하나님의 말씀은 우리에게 분별력을 주어 세상의 유혹을 이기게 합니다.',
    application: '오늘 당신의 분별력을 흐리게 하는 것은 무엇입니까?',
    chartType: 'none',
    accentColor: '#8A817C',
    tag: 'JANUARY 3rd',
  },
  '1:5': {
    id: 'jan4',
    reference: 'Proverbs 1:5',
    title: '지혜 있는 자의 학식',
    verse: '지혜 있는 자는 듣고 학식이 더할 것이요 명철한 자는 모략을 얻을 것이라',
    source: '잠언 1:5',
    theme: '경청의 자세',
    commentary: '진정한 지혜는 자신의 지식을 자랑하는 것이 아니라, 다른 사람의 말을 경청하고 배우는 자세에서 나옵니다. 하나님은 겸손히 듣는 자에게 더 큰 지혜를 주십니다.',
    application: '당신은 오늘 누구의 말에 귀를 기울여야 합니까?',
    chartType: 'radar',
    accentColor: '#5D6D5F',
    tag: 'JANUARY 4th',
  },
  '1:6': {
    id: 'jan5',
    reference: 'Proverbs 1:6',
    title: '오묘한 말씀의 의미',
    verse: '잠언과 비유와 지혜 있는 자의 말과 그 오묘한 말을 깨달으리라',
    source: '잠언 1:6',
    theme: '영적 통찰력',
    commentary: '하나님의 말씀에는 깊고 오묘한 의미가 담겨 있습니다. 성령의 조명을 통해 우리는 그 말씀의 참된 의미를 깨닫고 삶에 적용할 수 있습니다.',
    application: '말씀을 묵상하며 성령의 조명을 구하고 있습니까?',
    chartType: 'none',
    accentColor: '#463F3A',
    tag: 'JANUARY 5th',
  },
  '1:7': {
    id: 'jan6',
    reference: 'Proverbs 1:7',
    title: '지식의 근본',
    verse: '여호와를 경외하는 것이 지식의 근본이어늘 미련한 자는 지혜와 훈계를 멸시하느니라',
    source: '잠언 1:7',
    theme: '경외함',
    commentary: '하나님을 경외하는 마음이 모든 지혜와 지식의 출발점입니다. 하나님을 인정하지 않는 지식은 결국 우리를 교만과 멸망으로 이끌 뿐입니다.',
    application: '당신의 삶에서 하나님을 경외하는 마음이 가장 먼저 나타나는 영역은 어디입니까?',
    chartType: 'bar',
    accentColor: '#D4A373',
    tag: 'JANUARY 6th',
  },
  '1:8': {
    id: 'jan7',
    reference: 'Proverbs 1:8',
    title: '부모의 훈계',
    verse: '내 아들아 네 아비의 훈계를 들으며 네 어미의 법을 떠나지 말라',
    source: '잠언 1:8',
    theme: '가정 교육',
    commentary: '부모님의 훈계와 가르침은 우리 인생의 든든한 기초가 됩니다. 그 안에는 우리를 향한 사랑과 지혜가 담겨 있습니다.',
    application: '최근 부모님께 받은 훈계나 가르침 중 마음에 새기고 있는 것은 무엇입니까?',
    chartType: 'none',
    accentColor: '#B07D62',
    tag: 'JANUARY 7th',
  },
  '1:9': {
    id: 'jan8',
    reference: 'Proverbs 1:9',
    title: '아름다운 관과 금사슬',
    verse: '이는 네 머리의 아름다운 관이요 네 목의 금사슬이니라',
    source: '잠언 1:9',
    theme: '순종의 가치',
    commentary: '부모님께 순종하고 그 가르침을 따르는 것은 우리를 가장 아름답고 존귀하게 만드는 장식과 같습니다.',
    application: '순종의 아름다움을 삶으로 어떻게 표현할 수 있을까요?',
    chartType: 'radar',
    accentColor: '#8A817C',
    tag: 'JANUARY 8th',
  },
  '1:10': {
    id: 'jan9',
    reference: 'Proverbs 1:10',
    title: '악한 자의 유혹',
    verse: '내 아들아 악한 자가 너를 꾈지라도 좇지 말라',
    source: '잠언 1:10',
    theme: '유혹 분별',
    commentary: '세상은 달콤한 말로 우리를 유혹하여 죄의 길로 이끌려고 합니다. 하나님의 말씀으로 분별력을 키워 그 유혹을 단호히 거절해야 합니다.',
    application: '당신을 유혹하는 악한 자의 꾀임은 주로 어떤 모습으로 다가옵니까?',
    chartType: 'none',
    accentColor: '#5D6D5F',
    tag: 'JANUARY 9th',
  }
};

export const defaultVerseKey = '1:1-2';
export const defaultVerse = proverbs[defaultVerseKey];
