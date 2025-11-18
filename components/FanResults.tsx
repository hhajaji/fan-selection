import React, { useState } from 'react';
import { Fan } from '../types';
// Correct import for GoogleGenAI as per guidelines
import { GoogleGenAI } from '@google/genai';

interface FanCardProps {
  fan: Fan;
  onSelect: () => void;
  onToggleCompare: () => void;
  isSelectedForCompare: boolean;
}

const FanCard: React.FC<FanCardProps> = ({ fan, onSelect, onToggleCompare, isSelectedForCompare }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border flex flex-col">
    <img src={fan.imageUrl} alt={fan.model} className="w-full h-48 object-cover" />
    <div className="p-4 flex flex-col flex-grow">
      <h3 className="text-lg font-bold text-slate-800">{fan.model}</h3>
      <p className="text-sm text-slate-500 mb-2">{fan.manufacturer} - {fan.type}</p>
      <p className="text-xs text-slate-600 mb-4 flex-grow">{fan.description.substring(0, 100)}...</p>
      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div className="bg-slate-100 p-2 rounded-md">
            <div className="font-semibold text-slate-700">دبی هوا</div>
            <div className="text-slate-500">{fan.maxAirflow.toLocaleString('fa-IR')} m³/h</div>
        </div>
        <div className="bg-slate-100 p-2 rounded-md">
            <div className="font-semibold text-slate-700">فشار استاتیک</div>
            <div className="text-slate-500">{fan.maxStaticPressure.toLocaleString('fa-IR')} Pa</div>
        </div>
      </div>
    </div>
    <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
       <button onClick={onSelect} className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold">
        مشاهده جزئیات
      </button>
      <button 
        onClick={onToggleCompare} 
        className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm font-semibold border ${
          isSelectedForCompare 
          ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' 
          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
        }`}
      >
        {isSelectedForCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
      </button>
    </div>
  </div>
);

interface FanResultsProps {
  fans: Fan[];
  onSelectFan: (fan: Fan) => void;
  onToggleCompare: (fan: Fan) => void;
  compareList: Fan[];
  onShowComparison: () => void;
}

const GeminiSummary: React.FC<{ fans: Fan[] }> = ({ fans }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getSummary = async () => {
        setIsLoading(true);
        setError('');
        setSummary('');

        try {
            // Correct initialization of GoogleGenAI using API key from environment
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const fanDataString = fans.map(f => `Model: ${f.model}, Type: ${f.type}, Airflow: ${f.maxAirflow} m3/h, Pressure: ${f.maxStaticPressure} Pa, Power: ${f.powerConsumption} kW, Noise: ${f.noiseLevel} dB`).join('\n');
            const prompt = `As an expert HVAC engineer, provide a brief, professional summary in Persian for the following list of industrial fans. Highlight the key strengths and ideal applications for each model based on the provided data. Keep the summary concise and easy to understand for a project manager.\n\nFan Data:\n${fanDataString}`;
            
            // Correct API call using generateContent
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            // Correct text extraction from response
            setSummary(response.text);

        } catch (e) {
            console.error(e);
            setError('An error occurred while generating the summary.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-blue-800">خلاصه هوشمند</h3>
                <button onClick={getSummary} disabled={isLoading || fans.length === 0} className="bg-blue-600 text-white text-xs py-1 px-3 rounded-md hover:bg-blue-700 disabled:bg-slate-400">
                    {isLoading ? 'در حال پردازش...' : 'تولید خلاصه'}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {summary && (
                <div className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{summary}</div>
            )}
        </div>
    );
};


const FanResults: React.FC<FanResultsProps> = ({ fans, onSelectFan, onToggleCompare, compareList, onShowComparison }) => {
  return (
    <div>
       {compareList.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-8 z-10 flex justify-between items-center">
              <div className="flex-grow">
                <span className="font-bold">{compareList.length}</span> محصول برای مقایسه انتخاب شده: 
                <span className="text-sm text-slate-600 mr-2">
                    {compareList.map(f => f.model).join('، ')}
                </span>
              </div>
              <button 
                onClick={onShowComparison} 
                disabled={compareList.length < 2}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    مقایسه کن ({compareList.length}/4)
                </button>
          </div>
       )}
      {fans.length > 0 && <GeminiSummary fans={fans} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {fans.map(fan => (
          <FanCard
            key={fan.id}
            fan={fan}
            onSelect={() => onSelectFan(fan)}
            onToggleCompare={() => onToggleCompare(fan)}
            isSelectedForCompare={compareList.some(f => f.id === fan.id)}
          />
        ))}
      </div>
      {fans.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">نتیجه‌ای یافت نشد</h3>
          <p className="mt-1 text-sm text-slate-500">لطفاً پارامترهای فنی پروژه را تغییر دهید و مجدداً تلاش کنید.</p>
        </div>
      )}
    </div>
  );
};

export default FanResults;