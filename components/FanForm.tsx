import React, { useState, useEffect } from 'react';
import { Fan, PerformanceData } from '../types';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, DotProps } from 'recharts';

// Internal type with a temporary ID for stable editing
type EditablePerformancePoint = PerformanceData & { tempId: string };

interface FanFormProps {
  fanToEdit: Fan | null;
  onSubmit: (fanData: Fan | Omit<Fan, 'id'>) => void;
  onCancel: () => void;
}

const INITIAL_STATE: Omit<Fan, 'id'> = {
  model: '',
  type: 'فن محوری (Axial)',
  manufacturer: '',
  imageUrl: `https://picsum.photos/seed/fan${Date.now()}/400/300`,
  description: '',
  maxAirflow: 0,
  maxStaticPressure: 0,
  powerConsumption: 0,
  motorRpm: 0,
  noiseLevel: 0,
  minTemp: -20,
  maxTemp: 60,
  fluidType: ['هوای تمیز'],
  price: 0,
  electricalSpecs: {
    voltage: 380,
    phase: 3,
    frequency: 50,
  },
  dimensions: {
    height: 0,
    width: 0,
    depth: 0,
  },
  performanceCurve: [
    { airflow: 0, staticPressure: 0, power: 0, efficiency: 0 }
  ],
};

const calculateEfficiency = (point: Omit<PerformanceData, 'efficiency' | 'efficiency'>): number => {
    if (!point.airflow || !point.staticPressure || !point.power) {
      return 0;
    }
    const airflowM3s = point.airflow / 3600;
    const powerW = point.power * 1000;
    if (powerW === 0) return 0;

    const efficiency = (airflowM3s * point.staticPressure) / powerW;
    return parseFloat((efficiency * 100).toFixed(1));
};


const FanForm: React.FC<FanFormProps> = ({ fanToEdit, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Fan, 'id' | 'performanceCurve'> & { id?: number; performanceCurve: EditablePerformancePoint[] }>(() => {
    const initialData = fanToEdit ? JSON.parse(JSON.stringify(fanToEdit)) : JSON.parse(JSON.stringify(INITIAL_STATE));
    const curveWithTempId = initialData.performanceCurve
      .map((p: PerformanceData, index: number) => ({
        ...p,
        tempId: `point-${Date.now()}-${index}`,
        efficiency: calculateEfficiency(p),
      }))
      .sort((a: PerformanceData, b: PerformanceData) => a.airflow - b.airflow);
    return { ...initialData, performanceCurve: curveWithTempId };
  });
  
  const isEditing = fanToEdit !== null;
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  useEffect(() => {
    const initialData = fanToEdit ? JSON.parse(JSON.stringify(fanToEdit)) : JSON.parse(JSON.stringify(INITIAL_STATE));
    const curveWithTempId = initialData.performanceCurve
      .map((p: PerformanceData, index: number) => ({
        ...p,
        tempId: `point-${Date.now()}-${index}`,
        efficiency: calculateEfficiency(p),
      }))
      .sort((a: PerformanceData, b: PerformanceData) => a.airflow - b.airflow);
    setFormData({ ...initialData, performanceCurve: curveWithTempId });
  }, [fanToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumber = e.target.type === 'number';
    setFormData(prev => ({
      ...prev,
      [name]: isNumber ? Number(value) : value,
    }));
  };
  
  const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'dimensions' | 'electricalSpecs') => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [category]: {
            ...((prev as any)[category]),
            [name]: Number(value),
        }
      }));
  };

  const handleFluidTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setFormData(prev => ({
          ...prev,
          fluidType: value.split(',').map(s => s.trim())
      }));
  };
  
  const handlePerfPointChange = (tempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let newCurve = formData.performanceCurve.map(p => {
        if (p.tempId === tempId) {
          const updatedPoint = { ...p, [name]: Number(value) || 0 };
          if (['airflow', 'staticPressure', 'power'].includes(name)) {
            updatedPoint.efficiency = calculateEfficiency(updatedPoint);
          }
          return updatedPoint;
        }
        return p;
      });

      if (name === 'airflow') {
        newCurve.sort((a, b) => a.airflow - b.airflow);
      }
      
      setFormData(prev => ({ ...prev, performanceCurve: newCurve }));
  };

  const addPerfPoint = () => {
    setFormData(prev => {
        const curve = [...prev.performanceCurve];
        const newTempId = `point-${Date.now()}-${curve.length}`;
        let newPoint: EditablePerformancePoint = { tempId: newTempId, airflow: 0, staticPressure: 0, power: 0, efficiency: 0 };
        
        if (curve.length > 0) {
            const last = curve[curve.length - 1];
            newPoint.airflow = Math.round((last.airflow + 5000) / 100) * 100;
            newPoint.staticPressure = Math.max(0, Math.round((last.staticPressure * 0.9) / 10) * 10);
            newPoint.power = parseFloat((last.power + 0.5).toFixed(1));
        }
        newPoint.efficiency = calculateEfficiency(newPoint);
        
        const newCurve = [...curve, newPoint].sort((a,b) => a.airflow - b.airflow);
        return { ...prev, performanceCurve: newCurve };
    });
  };
  
  const removePerfPoint = (tempId: string) => {
    if (formData.performanceCurve.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      performanceCurve: prev.performanceCurve.filter(p => p.tempId !== tempId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFormData = {
      ...formData,
      performanceCurve: formData.performanceCurve.map(({ tempId, ...rest }) => rest),
    };
    onSubmit(finalFormData as Fan | Omit<Fan, 'id'>);
  };
  
  const CustomDot: React.FC<DotProps & { payload?: any }> = (props) => {
      const { cx, cy, stroke, payload } = props;
      
      if (payload.tempId === hoveredPointId) {
          return <circle cx={cx} cy={cy} r={8} fill={stroke} stroke="#fff" strokeWidth={3} />;
      }

      return <circle cx={cx} cy={cy} r={5} fill={stroke} stroke="#fff" strokeWidth={2} />;
  };

  const formInputClass = "mt-1 w-full p-2 border rounded-md bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-12 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b">
                <h3 className="text-lg font-bold">{isEditing ? `ویرایش محصول: ${fanToEdit.model}` : 'افزودن محصول جدید'}</h3>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                    <legend className="px-2 font-semibold text-sm">اطلاعات عمومی</legend>
                    <div>
                        <label className="block text-sm font-medium">مدل</label>
                        <input name="model" value={formData.model} onChange={handleChange} required className={formInputClass}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">سازنده</label>
                        <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} required className={formInputClass}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">نوع فن</label>
                        <select name="type" value={formData.type} onChange={handleChange} className={formInputClass}>
                            <option>فن محوری (Axial)</option>
                            <option>فن سانتریفیوژ (Centrifugal)</option>
                            <option>جت فن (Jet Fan)</option>
                            <option>فن سقفی (Roof Fan)</option>
                            <option>فن ضد انفجار (Explosion Proof)</option>
                            <option>سایر</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">آدرس تصویر</label>
                        <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} className={formInputClass}/>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium">توضیحات</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={formInputClass}/>
                    </div>
                </fieldset>

                <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-4 border p-4 rounded-md">
                    <legend className="px-2 font-semibold text-sm">مشخصات عملکردی</legend>
                     <div>
                        <label className="block text-sm font-medium">حداکثر دبی (m³/h)</label>
                        <input type="number" name="maxAirflow" value={formData.maxAirflow} onChange={handleChange} required className={formInputClass}/>
                     </div>
                     <div>
                        <label className="block text-sm font-medium">حداکثر فشار (Pa)</label>
                        <input type="number" name="maxStaticPressure" value={formData.maxStaticPressure} onChange={handleChange} required className={formInputClass}/>
                     </div>
                      <div>
                        <label className="block text-sm font-medium">توان (kW)</label>
                        <input type="number" name="powerConsumption" value={formData.powerConsumption} onChange={handleChange} step="0.1" required className={formInputClass}/>
                     </div>
                      <div>
                        <label className="block text-sm font-medium">دور موتور (RPM)</label>
                        <input type="number" name="motorRpm" value={formData.motorRpm} onChange={handleChange} required className={formInputClass}/>
                     </div>
                      <div>
                        <label className="block text-sm font-medium">سطح صدا (dB)</label>
                        <input type="number" name="noiseLevel" value={formData.noiseLevel} onChange={handleChange} required className={formInputClass}/>
                     </div>
                </fieldset>

                 <fieldset className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-md">
                    <legend className="px-2 font-semibold text-sm">شرایط کاری و قیمت</legend>
                    <div>
                        <label className="block text-sm font-medium">حداقل دما (°C)</label>
                        <input type="number" name="minTemp" value={formData.minTemp} onChange={handleChange} required className={formInputClass}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">حداکثر دما (°C)</label>
                        <input type="number" name="maxTemp" value={formData.maxTemp} onChange={handleChange} required className={formInputClass}/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">نوع سیال (با کاما جدا کنید)</label>
                        <input name="fluidType" value={Array.isArray(formData.fluidType) ? formData.fluidType.join(', ') : ''} onChange={handleFluidTypeChange} className={formInputClass}/>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium">قیمت (ریال)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} required className={formInputClass}/>
                    </div>
                 </fieldset>

                 <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-4 border p-4 rounded-md">
                    <legend className="px-2 font-semibold text-sm">ابعاد و مشخصات الکتریکی</legend>
                    <div>
                        <label className="block text-sm font-medium">ارتفاع (mm)</label>
                        <input type="number" name="height" value={formData.dimensions.height} onChange={(e) => handleNestedChange(e, 'dimensions')} required className={formInputClass}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">عرض (mm)</label>
                        <input type="number" name="width" value={formData.dimensions.width} onChange={(e) => handleNestedChange(e, 'dimensions')} required className={formInputClass}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">عمق (mm)</label>
                        <input type="number" name="depth" value={formData.dimensions.depth} onChange={(e) => handleNestedChange(e, 'dimensions')} required className={formInputClass}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">ولتاژ (V)</label>
                        <input type="number" name="voltage" value={formData.electricalSpecs.voltage} onChange={(e) => handleNestedChange(e, 'electricalSpecs')} required className={formInputClass}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">فاز</label>
                        <input type="number" name="phase" value={formData.electricalSpecs.phase} onChange={(e) => handleNestedChange(e, 'electricalSpecs')} required className={formInputClass}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">فرکانس (Hz)</label>
                        <input type="number" name="frequency" value={formData.electricalSpecs.frequency} onChange={(e) => handleNestedChange(e, 'electricalSpecs')} required className={formInputClass}/>
                    </div>
                 </fieldset>

                 <fieldset className="border p-4 rounded-md">
                     <legend className="px-2 font-semibold text-sm">منحنی عملکرد</legend>
                        <div className="h-80 w-full mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={formData.performanceCurve}
                                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                >
                                    <CartesianGrid stroke="#f5f5f5" />
                                    <XAxis dataKey="airflow" type="number" name="Airflow" unit=" m³/h" domain={['dataMin', 'dataMax + 1000']} allowDataOverflow={true} />
                                    <YAxis dataKey="staticPressure" type="number" name="Pressure" unit=" Pa" domain={['dataMin', 'dataMax + 50']} allowDataOverflow={true} />
                                    <Tooltip />
                                    <Legend />
                                    <Line 
                                        dataKey="staticPressure" 
                                        name="فشار استاتیک"
                                        stroke="#3b82f6" 
                                        strokeWidth={2} 
                                        type="monotone" 
                                        dot={<CustomDot />}
                                        activeDot={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                      <p className="text-xs text-slate-500 mb-3 text-center">
                        مقادیر را در جدول زیر ویرایش کنید. نمودار به صورت زنده بروزرسانی خواهد شد.
                      </p>
                      <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                              <thead className="text-right text-slate-600">
                                  <tr>
                                      <th className="p-2 font-medium">دبی (m³/h)</th>
                                      <th className="p-2 font-medium">فشار (Pa)</th>
                                      <th className="p-2 font-medium">توان (kW)</th>
                                      <th className="p-2 font-medium">راندمان (%)</th>
                                      <th className="w-16"></th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {formData.performanceCurve.map((point) => (
                                      <tr 
                                        key={point.tempId} 
                                        className={`transition-colors ${hoveredPointId === point.tempId ? 'bg-blue-50' : ''}`}
                                        onMouseEnter={() => setHoveredPointId(point.tempId)}
                                        onMouseLeave={() => setHoveredPointId(null)}
                                      >
                                          <td className="p-1"><input type="number" name="airflow" placeholder="دبی" value={point.airflow} onChange={(e) => handlePerfPointChange(point.tempId, e)} className="p-2 border rounded-md text-sm w-full bg-white text-gray-900 border-gray-300"/></td>
                                          <td className="p-1"><input type="number" name="staticPressure" placeholder="فشار" value={point.staticPressure} onChange={(e) => handlePerfPointChange(point.tempId, e)} className="p-2 border rounded-md text-sm w-full bg-white text-gray-900 border-gray-300"/></td>
                                          <td className="p-1"><input type="number" name="power" placeholder="توان" value={point.power} onChange={(e) => handlePerfPointChange(point.tempId, e)} step="0.1" className="p-2 border rounded-md text-sm w-full bg-white text-gray-900 border-gray-300"/></td>
                                          <td className="p-1"><input type="number" name="efficiency" readOnly placeholder="راندمان" value={point.efficiency || ''} className="p-2 border rounded-md text-sm w-full bg-slate-100 text-slate-600 cursor-not-allowed"/></td>
                                          <td className="p-1 text-center">
                                            <button type="button" onClick={() => removePerfPoint(point.tempId)} disabled={formData.performanceCurve.length <= 1} className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold p-2">حذف</button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                     <button type="button" onClick={addPerfPoint} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-semibold">افزودن نقطه جدید</button>
                 </fieldset>

            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-x-3">
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">انصراف</button>
                <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">{isEditing ? 'ذخیره تغییرات' : 'ایجاد محصول'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default FanForm;