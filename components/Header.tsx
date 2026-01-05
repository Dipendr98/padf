export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl">
            📄
          </div>
          <h1 className="text-xl font-bold text-gray-900">Smart PDF Reader</h1>
        </div>
      </div>
    </header>
  );
}
