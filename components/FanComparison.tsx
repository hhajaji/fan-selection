import React, { useState, useMemo } from 'react';
import { Fan } from '../types';
import { GoogleGenAI } from '@google/genai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { m3hToCfm, cfmToM3h, paToInwg, inwgToPa } from '../utils/conversions';

interface FanComparisonProps {
  fans: Fan[];
  onBack: () => void;
}

type AirflowUnit = 'm³/h' | 'CFM';
type PressureUnit = 'Pa' | 'inWG';

const ComparisonRow: React.FC<{ label: string; values: (string | number)[]; highlight?: 'min' | 'max' }> = ({ label, values, highlight }) => {
  let bestValue: number | undefined = undefined;
  if (highlight) {
      const numericValues = values.map(v => typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''))).filter(v => !isNaN(v));
      if (numericValues.length > 1) {
          bestValue = highlight === 'max' ? Math.max(...numericValues) : Math.min(...numericValues);
      }
  }

  return (
    <tr className="border-b border-slate-200">
      <th scope="row" className="p-3 text-sm font-medium text-slate-600 bg-slate-50 text-right sticky left-0 z-10">{label}</th>
      {values.map((value, index) => {
        const isBest = typeof value === 'number' && value === bestValue;
        return (
          <td key={index} className={`p-3 text-sm text-center ${isBest ? 'bg-green-100 font-bold text-green-800' : 'text-slate-700'}`}>
            {typeof value === 'number' ? value.toLocaleString('fa-IR', { maximumFractionDigits: 2 }) : value}
          </td>
        );
      })}
    </tr>
  );
};

const GeminiComparisonSummary: React.FC<{ fans: Fan[] }> = ({ fans }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getSummary = async () => {
        setIsLoading(true);
        setError('');
        setSummary('');

        if (!process.env.API_KEY) {
            setError("API key is not configured.");
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const fanDataString = fans.map(f => `Model: ${f.model}, Type: ${f.type}, Airflow: ${f.maxAirflow} m3/h, Pressure: ${f.maxStaticPressure} Pa, Power: ${f.powerConsumption} kW, Noise: ${f.noiseLevel} dB, Price: ${f.price} ریال`).join('\n');
            const prompt = `As an expert HVAC engineer, compare the following industrial fans. Provide a concise, professional comparison in Persian, highlighting the pros and cons of each model for different applications. Identify the best fan for specific scenarios (e.g., best for high pressure, quietest operation, most cost-effective). Format the output clearly using Markdown for readability.\n\nFan Data:\n${fanDataString}`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            setSummary(response.text);
        } catch (e) {
            console.error(e);
            setError('An error occurred while generating the summary.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-blue-800">تحلیل مقایسه‌ای هوشمند</h3>
                <button onClick={getSummary} disabled={isLoading || fans.length < 2} className="bg-blue-600 text-white text-xs py-1 px-3 rounded-md hover:bg-blue-700 disabled:bg-slate-400">
                    {isLoading ? 'در حال پردازش...' : 'تولید تحلیل'}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {summary && (
                <div className="mt-4 text-sm text-slate-700 whitespace-pre-wrap prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }}></div>
            )}
        </div>
    );
};

// FIX: Explicitly cast values to Number to avoid potential type inference issues during arithmetic operations.
const interpolate = (x: number, p1: [number, number], p2: [number, number]): number => {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    if (x1 === x2) return y1;
    return Number(y1) + ((Number(x) - Number(x1)) * (Number(y2) - Number(y1))) / (Number(x2) - Number(x1));
};

// FIX: Replaced `any` with a strong type for Tooltip props to ensure type safety.
interface CustomTooltipProps extends TooltipProps<number, string> {
    fans: Fan[];
    units: { airflow: AirflowUnit, pressure: PressureUnit };
}

const CustomComparisonTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, units }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white shadow-lg rounded-md border border-slate-200">
          <p className="font-bold text-slate-800 border-b pb-1 mb-2">
              {`دبی: ${typeof label === 'number' ? label.toLocaleString('fa-IR') : label} ${units.airflow}`}
          </p>
          <ul className="space-y-1 text-sm">
            {payload.map((entry, index) => (
              <li key={`item-${index}`} className="flex items-center gap-2">
                <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: entry.stroke }}></span>
                <span className="font-semibold">{entry.name}:</span>
                <span>{typeof entry.value === 'number' ? entry.value.toLocaleString('fa-IR', { maximumFractionDigits: 2 }) : entry.value} {units.pressure}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  };

const FanComparison: React.FC<FanComparisonProps> = ({ fans, onBack }) => {
  const [units, setUnits] = useState<{ airflow: AirflowUnit, pressure: PressureUnit }>({
    airflow: 'm³/h',
    pressure: 'Pa'
  });

  const { chartData, specRows, getSpecValue, colors } = useMemo(() => {
    const colors = ['#3b82f6', '#16a34a', '#ef4444', '#f97316'];
    
    // --- Chart Data Processing ---
    const allAirflowPoints = [...new Set(fans.flatMap(f => f.performanceCurve.map(p => p.airflow)))].sort((a, b) => a - b);

    const chartData = allAirflowPoints.map(airflow => {
        const dataPoint: { [key: string]: number } = { airflow };
        fans.forEach(fan => {
            const curve = fan.performanceCurve;
            let pressure = 0;
            const exactPoint = curve.find(p => p.airflow === airflow);
            if (exactPoint) {
                pressure = exactPoint.staticPressure;
            } else {
                const lowerPoints = curve.filter(p => p.airflow < airflow);
                const upperPoints = curve.filter(p => p.airflow > airflow);
                if (lowerPoints.length > 0 && upperPoints.length > 0) {
                    const p1: [number, number] = [lowerPoints[lowerPoints.length - 1].airflow, lowerPoints[lowerPoints.length - 1].staticPressure];
                    const p2: [number, number] = [upperPoints[0].airflow, upperPoints[0].staticPressure];
                    pressure = interpolate(airflow, p1, p2);
                }
            }
            dataPoint[`pressure_${fan.id}`] = pressure;
        });
        return dataPoint;
    });

    const convertedChartData = chartData.map(point => {
        // FIX: Add explicit type to newPoint to prevent unsafe property assignment.
        const newPoint: { [key: string]: number } = { ...point };
        newPoint.airflow = units.airflow === 'CFM' ? m3hToCfm(point.airflow) : point.airflow;
        Object.keys(point).forEach(key => {
            if (key.startsWith('pressure_')) {
                newPoint[key] = units.pressure === 'inWG' ? paToInwg(point[key]) : point[key];
            }
        });
        return newPoint;
    });

    // --- Table Data Processing ---
    const getSpecValue = (fan: Fan, key: string): string | number => {
        switch (key) {
            case 'maxAirflow':
                return units.airflow === 'CFM' ? m3hToCfm(fan.maxAirflow) : fan.maxAirflow;
            case 'maxStaticPressure':
                return units.pressure === 'inWG' ? paToInwg(fan.maxStaticPressure) : fan.maxStaticPressure;
            case 'tempRange':
                return `${fan.minTemp} الی ${fan.maxTemp}`;
            case 'dimensions':
                return `${fan.dimensions.height}x${fan.dimensions.width}x${fan.dimensions.depth}`;
            case 'electrical':
                return `${fan.electricalSpecs.voltage}V / ${fan.electricalSpecs.phase}Ph / ${fan.electricalSpecs.frequency}Hz`;
            // FIX: Replaced unsafe fan[key] with type-safe, explicit property access.
            case 'type':
                return fan.type;
            case 'manufacturer':
                return fan.manufacturer;
            case 'powerConsumption':
                return fan.powerConsumption;
            case 'motorRpm':
                return fan.motorRpm;
            case 'noiseLevel':
                return fan.noiseLevel;
            case 'price':
                return fan.price;
            default:
                return '';
        }
    };

    const specRows = [
        { label: 'نوع فن', key: 'type', highlight: undefined },
        { label: 'سازنده', key: 'manufacturer', highlight: undefined },
        { label: `حداکثر دبی هوا (${units.airflow})`, key: 'maxAirflow', highlight: 'max' as const },
        { label: `حداکثر فشار استاتیک (${units.pressure})`, key: 'maxStaticPressure', highlight: 'max' as const },
        { label: 'توان مصرفی (kW)', key: 'powerConsumption', highlight: 'min' as const },
        { label: 'دور موتور (RPM)', key: 'motorRpm', highlight: undefined },
        { label: 'سطح صدا (dB)', key: 'noiseLevel', highlight: 'min' as const },
        { label: 'محدوده دمای کاری (°C)', key: 'tempRange', highlight: undefined },
        { label: 'ابعاد (HxWxD mm)', key: 'dimensions', highlight: undefined },
        { label: 'مشخصات الکتریکی', key: 'electrical', highlight: undefined },
        { label: 'قیمت تخمینی (ریال)', key: 'price', highlight: 'min' as const },
    ];
    
    return { chartData: convertedChartData, specRows, getSpecValue, colors };
  }, [fans, units]);

  if (!fans || fans.length < 2) {
    return (
      <div className="text-center p-8">
        <p>برای مقایسه حداقل دو فن را انتخاب کنید.</p>
        <button onClick={onBack} className="mt-4 py-2 px-4 bg-slate-500 text-white rounded-md hover:bg-slate-600">
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">مقایسه محصولات</h2>
          <p className="text-md text-slate-500">مقایسه مشخصات فنی فن‌های انتخاب شده</p>
        </div>
        <button
          onClick={onBack}
          className="py-2 px-4 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          <span>بازگشت به لیست</span>
        </button>
      </div>

      <div className="flex justify-start items-center gap-4 text-sm mb-6 p-4 bg-slate-50 rounded-md">
            <span className="font-medium text-slate-700">واحد مقادیر:</span>
            <div className="flex items-center gap-2">
                 <label className="text-slate-600">دبی:</label>
                 <select value={units.airflow} onChange={e => setUnits(u => ({...u, airflow: e.target.value as AirflowUnit}))} className="bg-white border border-slate-300 text-slate-700 text-xs rounded p-1">
                     <option value="m³/h">m³/h</option>
                     <option value="CFM">CFM</option>
                 </select>
            </div>
            <div className="flex items-center gap-2">
                 <label className="text-slate-600">فشار:</label>
                 <select value={units.pressure} onChange={e => setUnits(u => ({...u, pressure: e.target.value as PressureUnit}))} className="bg-white border border-slate-300 text-slate-700 text-xs rounded p-1">
                     <option value="Pa">Pa</option>
                     <option value="inWG">inWG</option>
                 </select>
            </div>
      </div>
      
      <GeminiComparisonSummary fans={fans} />

      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse text-right">
          <thead>
            <tr className="border-b-2 border-slate-300">
              <th className="p-3 text-sm font-semibold text-slate-800 bg-slate-100 text-right sticky left-0 z-10">مشخصات</th>
              {fans.map(fan => (
                <th key={fan.id} className="p-3 text-sm font-semibold text-slate-800 text-center">
                  <img src={fan.imageUrl} alt={fan.model} className="w-32 h-24 object-cover mx-auto rounded-md mb-2" />
                  {fan.model}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specRows.map(row => (
                <ComparisonRow 
                    key={row.label}
                    label={row.label}
                    values={fans.map(fan => getSpecValue(fan, row.key))}
                    highlight={row.highlight}
                />
            ))}
          </tbody>
        </table>
      </div>

       <div className="mt-12">
            <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">انطباق نمودار عملکرد</h3>
            <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="airflow" type="number" name={`دبی هوا (${units.airflow})`} unit={` ${units.airflow}`} domain={['dataMin', 'dataMax']} tickFormatter={(tick) => tick.toLocaleString('en-US')} />
                        <YAxis name={`فشار استاتیک (${units.pressure})`} unit={` ${units.pressure}`} domain={['auto', 'auto']} tickFormatter={(tick) => tick.toLocaleString('en-US')} />
                        <Tooltip content={<CustomComparisonTooltip fans={fans} units={units} />} />
                        <Legend />
                        {fans.map((fan, index) => (
                            <Line 
                                key={fan.id}
                                type="monotone"
                                dataKey={`pressure_${fan.id}`}
                                name={fan.model}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
       </div>

    </div>
  );
};

export default FanComparison;