"use client";

import { useToast } from "@/components/ToastProvider";

export default function HudsonTranPage() {
  const { showSuccess } = useToast();

  const handleButtonClick = () => {
    showSuccess("matt is a kiss ass");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Hudson Tran
          </h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-xl text-gray-700">
              It's easy to vibe code
            </p>
            <p className="text-xl text-gray-700">
              It's easy to generate stuff with AI
            </p>
          </div>

          <button
            onClick={handleButtonClick}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Click me
          </button>
        </div>
      </div>
    </div>
  );
}