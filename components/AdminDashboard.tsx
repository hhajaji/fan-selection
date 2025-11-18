import React, { useState, useRef } from 'react';
import { Fan, PerformanceData } from '../types';
import FanForm from './FanForm';

// To satisfy TypeScript, as XLSX is loaded from a script tag in index.html
declare const XLSX: any;

interface AdminDashboardProps {
  fans: Fan[];
  onAddFan: (newFan: Omit<Fan, 'id'>) => void;
  onUpdateFan: (updatedFan: Fan) => void;
  onDeleteFan: (fanId: number) => void;
  onAddFansBatch: (newFans: Omit<Fan, 'id'>[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ fans, onAddFan, onUpdateFan, onDeleteFan, onAddFansBatch }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFan, setEditingFan] = useState<Fan | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddNew = () => {
    setEditingFan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (fan: Fan) => {
    setEditingFan(fan);
    setIsFormOpen(true);
  };

  const handleDelete = (fanId: number) => {
    if (window.confirm('آیا از حذف این محصول اطمینان دارید؟')) {
      onDeleteFan(fanId);
    }
  };

  const handleFormSubmit = (fanData: Fan | Omit<Fan, 'id'>) => {
    if ('id' in fanData) {
      onUpdateFan(fanData);
    } else {
      onAddFan(fanData);
    }
    setIsFormOpen(false);
  };

  const handleDownloadTemplate = () => {
    const headers = [
        'model', 'type', 'manufacturer', 'imageUrl', 'description', 'maxAirflow', 'maxStaticPressure', 'powerConsumption', 
        'motorRpm', 'noiseLevel', 'minTemp', 'maxTemp', 'fluidType (comma-separated)', 'price', 
        'electricalSpecs_voltage', 'electricalSpecs_phase', 'electricalSpecs_frequency', 
        'dimensions_height', 'dimensions_width', 'dimensions_depth', 'performanceCurve_json'
    ];
    const examplePerformanceCurve = JSON.stringify([
      { "airflow": 0, "staticPressure": 480, "power": 2.5 },
      { "airflow": 25000, "staticPressure": 150, "power": 4.5 }
    ]);
    const exampleRow = [
      'AXC-560M', 'فن محوری (Axial)', 'Systemair', 'https://picsum.photos/seed/fan1/400/300', 'توضیحات محصول', 25000, 450, 4.5, 1450, 75, -20, 60, 'هوای تمیز,دود', 180000000, 380, 3, 50, 700, 700, 400, examplePerformanceCurve
    ]

    const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fans');
    XLSX.writeFile(workbook, 'Fan_Import_Template.xlsx');
  };

  const handleFileImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);

            const newFans: Omit<Fan, 'id'>[] = json.map(row => {
                // Basic validation
                if (!row.model || !row.maxAirflow) {
                    throw new Error(`ردیف نامعتبر: مدل یا دبی هوا وجود ندارد. ${JSON.stringify(row)}`);
                }

                return {
                    model: String(row.model),
                    type: String(row.type),
                    manufacturer: String(row.manufacturer),
                    imageUrl: String(row.imageUrl),
                    description: String(row.description),
                    maxAirflow: Number(row.maxAirflow),
                    maxStaticPressure: Number(row.maxStaticPressure),
                    powerConsumption: Number(row.powerConsumption),
                    motorRpm: Number(row.motorRpm),
                    noiseLevel: Number(row.noiseLevel),
                    minTemp: Number(row.minTemp),
                    maxTemp: Number(row.maxTemp),
                    fluidType: String(row['fluidType (comma-separated)']).split(',').map(s => s.trim()),
                    price: Number(row.price),
                    electricalSpecs: {
                        voltage: Number(row.electricalSpecs_voltage),
                        phase: Number(row.electricalSpecs_phase),
                        frequency: Number(row.electricalSpecs_frequency),
                    },
                    dimensions: {
                        height: Number(row.dimensions_height),
                        width: Number(row.dimensions_width),
                        depth: Number(row.dimensions_depth),
                    },
                    performanceCurve: JSON.parse(row.performanceCurve_json) as PerformanceData[],
                };
            });

            onAddFansBatch(newFans);
            alert(`${newFans.length} محصول با موفقیت وارد شد.`);

        } catch (error) {
            console.error("Error parsing Excel file:", error);
            alert(`خطا در پردازش فایل اکسل: ${error.message}`);
        } finally {
            // Reset file input
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    reader.readAsArrayBuffer(file);
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 border-b pb-4">
        <h2 className="text-xl font-bold">مدیریت محصولات</h2>
        <div className="flex gap-2 flex-wrap">
            <button
                onClick={handleDownloadTemplate}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors font-semibold flex items-center gap-2 text-sm"
            >
                <span>دانلود نمونه</span>
            </button>
            <button
                onClick={handleFileImportClick}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 text-sm"
            >
                <span>ورود از اکسل</span>
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
            />
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>افزودن فن جدید</span>
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مدل</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">سازنده</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حداکثر دبی</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fans.map((fan) => (
              <tr key={fan.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fan.model}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fan.manufacturer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fan.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fan.maxAirflow.toLocaleString('fa-IR')} m³/h</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 space-x-reverse">
                  <button onClick={() => handleEdit(fan)} className="text-indigo-600 hover:text-indigo-900">ویرایش</button>
                  <button onClick={() => handleDelete(fan.id)} className="text-red-600 hover:text-red-900">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <FanForm
          fanToEdit={editingFan}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;