import React from 'react';

interface HomeProps {
  onNavigate: (view: 'customer' | 'admin') => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">به سیستم هوشمند انتخاب فن صنعتی خوش آمدید</h2>
      <p className="text-lg text-slate-600 mb-12 text-center">لطفاً بخش مورد نظر خود را برای ادامه انتخاب کنید.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <button
          onClick={() => onNavigate('customer')}
          className="bg-white p-8 rounded-lg shadow-lg text-center cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-slate-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-2xl font-bold text-blue-600 mb-2">بخش مشتریان و انتخاب محصول</h3>
          <p className="text-slate-600">جستجو، فیلتر و شبیه‌سازی عملکرد فن‌ها بر اساس نیازهای پروژه شما.</p>
        </button>
        <button
          onClick={() => onNavigate('admin')}
          className="bg-white p-8 rounded-lg shadow-lg text-center cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-slate-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-2xl font-bold text-green-600 mb-2">بخش پرسنل و مشاوران</h3>
          <p className="text-slate-600">مدیریت پایگاه داده محصولات، افزودن فن جدید و ویرایش پارامترهای فنی.</p>
        </button>
      </div>
    </div>
  );
};

export default Home;
