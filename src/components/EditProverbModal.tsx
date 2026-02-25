import React, { useState, useEffect } from 'react';
import type { ProverbData } from '../data/proverbs';

interface EditProverbModalProps {
  proverbData: [string, ProverbData];
  onClose: () => void;
  onSave: (updatedProverb: ProverbData) => void;
}

export default function EditProverbModal({ proverbData, onClose, onSave }: EditProverbModalProps) {
  const [key, initialData] = proverbData;
  const [editedData, setEditedData] = useState<ProverbData>(initialData);

  useEffect(() => {
    setEditedData(initialData);
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(editedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-60 flex justify-center items-center animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-[#5D6D5F]">잠언 수정: <span className="font-mono">{key}</span></h3>
        </div>
        <div className="p-6 flex-grow overflow-y-auto space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">제목 (후킹 질문)</label>
            <input type="text" name="title" value={editedData.title} onChange={handleInputChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">잠언 말씀</label>
            <textarea name="verse" value={editedData.verse} onChange={handleInputChange} className="w-full p-2 border rounded h-24" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">해설 (V4)</label>
            <textarea name="commentary" value={editedData.commentary} onChange={handleInputChange} className="w-full p-2 border rounded h-48" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">적용 (V4)</label>
            <textarea name="application" value={editedData.application} onChange={handleInputChange} className="w-full p-2 border rounded h-48" />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">취소</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-white bg-[#5D6D5F] rounded-md hover:bg-[#4a574c]">저장</button>
        </div>
      </div>
    </div>
  );
}
