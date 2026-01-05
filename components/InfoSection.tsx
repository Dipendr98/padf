export default function InfoSection() {
  return (
    <section className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
        <span>ℹ️</span>
        <span>How it works</span>
      </h3>
      <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
        <li>Upload a PDF file using the upload area above</li>
        <li>The first page will render with an interactive text layer</li>
        <li>Tap or click any word to see its English definition</li>
        <li>Popup appears near your cursor with definition from Dictionary API</li>
        <li>Click outside to close the popup</li>
      </ul>
    </section>
  );
}
