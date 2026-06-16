import React from 'react';

const SearchPage: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      {/* Glassmorphism container */}
      <div className="w-full max-w-2xl rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-8 shadow-xl">
        <h1 className="mb-6 text-center text-4xl font-extrabold text-white tracking-wider">
          Пошук
        </h1>
        <input
          type="text"
          placeholder="Введіть запит..."
          className="w-full rounded-md bg-white/10 px-4 py-2 text-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <p className="mt-4 text-center text-sm text-gray-300">
          (Це демонстраційна сторінка пошуку. Реальна інтеграція з бекендом буде додана пізніше.)
        </p>
      </div>
    </div>
  );
};

export default SearchPage;
