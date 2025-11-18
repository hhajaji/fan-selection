import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// FIX: Define the SpeechRecognition interface to fix TypeScript errors for this experimental API.
interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface AIVoiceFilterProps {
  onFiltersUpdate: (filters: {
    airflow: number;
    staticPressure: number;
    temperature: number;
  }) => void;
}

const AIVoiceFilter: React.FC<AIVoiceFilterProps> = ({ onFiltersUpdate }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // FIX: Use `(window as any)` to access non-standard browser APIs without TypeScript errors.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('تشخیص گفتار توسط مرورگر شما پشتیبانی نمی‌شود.');
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = 'fa-IR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setAnalysis('');
      setError('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i][0].transcript;
      }
      setTranscript(interimTranscript);
    };

    recognition.onerror = (event) => {
      setError(`خطا در تشخیص گفتار: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);
  
  // Analyze transcript when listening stops and transcript exists
  useEffect(() => {
    if (!isListening && transcript.trim()) {
        analyzeTranscript(transcript);
    }
  }, [isListening, transcript]);

  const handleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const analyzeTranscript = async (text: string) => {
    setIsLoading(true);
    setError('');
    setAnalysis('');

    if (!process.env.API_KEY) {
        setError("API key is not configured.");
        setIsLoading(false);
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const schema = {
            type: Type.OBJECT,
            properties: {
                airflow: { type: Type.NUMBER, description: 'دبی هوای مورد نیاز به واحد متر مکعب بر ساعت (m³/h)' },
                staticPressure: { type: Type.NUMBER, description: 'فشار استاتیک مورد نیاز به واحد پاسکال (Pa)' },
                temperature: { type: Type.NUMBER, description: 'دمای کاری به واحد سانتی‌گراد (°C)' },
            },
            required: ['airflow', 'staticPressure', 'temperature']
        };

        const prompt = `You are an expert HVAC engineer assistant. Analyze the following user request in Persian and extract the exact technical parameters. The user is describing their need for an industrial fan. Convert all units to the standard metric system as defined in the schema (m³/h, Pa, °C). If a value is not mentioned, use a reasonable default (e.g., 25°C for temperature).

User Request: "${text}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        
        const parsedJson = JSON.parse(response.text);

        onFiltersUpdate({
            airflow: parsedJson.airflow || 15000,
            staticPressure: parsedJson.staticPressure || 400,
            temperature: parsedJson.temperature || 25,
        });

        setAnalysis(`تحلیل انجام شد: دبی ${parsedJson.airflow} m³/h، فشار ${parsedJson.staticPressure} Pa، دما ${parsedJson.temperature}°C. فیلترها اعمال شدند.`);

    } catch (e) {
        console.error(e);
        setError('خطا در تحلیل درخواست. لطفاً دوباره تلاش کنید.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md no-print">
      <h2 className="text-lg font-bold mb-4 border-b pb-2">فیلتر هوشمند صوتی</h2>
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleListen}
          className={`relative w-20 h-20 rounded-full transition-colors duration-300 flex items-center justify-center ${
            isListening ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          aria-label={isListening ? 'توقف شنیدن' : 'شروع شنیدن'}
        >
          {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 z-10" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
            <path fillRule="evenodd" d="M5.5 8a.5.5 0 00.5.5v1.5a4 4 0 004 4h.5a.5.5 0 000-1H10a3 3 0 01-3-3V8.5a.5.5 0 00-.5-.5z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M5 4a1 1 0 011-1h1.5a.5.5 0 000-1H6a2 2 0 00-2 2v6a2 2 0 002 2h1.5a.5.5 0 000-1H6a1 1 0 01-1-1V4z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M12.5 8a.5.5 0 00.5.5v1.5a3 3 0 01-3 3H10a.5.5 0 000 1h.5a4 4 0 004-4V8.5a.5.5 0 00-.5-.5z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M14 4a1 1 0 011-1h1.5a.5.5 0 000-1H15a2 2 0 00-2 2v6a2 2 0 002 2h1.5a.5.5 0 000-1H15a1 1 0 01-1-1V4z" clipRule="evenodd" />
          </svg>
        </button>
        <p className="text-xs text-slate-500 h-4 text-center">
            {isListening ? 'در حال شنیدن...' : 'برای شروع کلیک کنید'}
        </p>

        {(transcript || isLoading || analysis || error) && (
            <div className="w-full mt-2 p-3 bg-slate-50 rounded-md text-sm text-slate-700 border min-h-[60px]">
                {isLoading && <p className="text-blue-600 animate-pulse">در حال تحلیل با هوش مصنوعی...</p>}
                {error && <p className="text-red-600">{error}</p>}
                {analysis && <p className="text-green-700 font-semibold">{analysis}</p>}
                {!isLoading && !analysis && transcript && <p className="text-slate-500">شما گفتید: "{transcript}"</p>}
            </div>
        )}
      </div>
    </div>
  );
};

export default AIVoiceFilter;