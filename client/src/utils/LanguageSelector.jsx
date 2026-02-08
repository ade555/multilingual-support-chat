import React from "react";

const LanguageSelector = ({ onSelect }) => {
  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ar", name: "Arabic" },
    { code: "pt", name: "Portuguese" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Agent Workspace
          </h1>
          <p className="text-gray-600">
            Select your preferred language for customer messages
          </p>
        </div>

        <div className="bg-white rounded-lg shadow border p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Choose Your Language
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onSelect(lang.code)}
                className="bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-4 transition-all"
              >
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-900">
                    {lang.name}
                  </div>
                  <div className="text-xs text-gray-500 uppercase mt-1">
                    {lang.code}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 text-center">
              All customer messages will be automatically translated to your
              selected language
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              localStorage.removeItem("agentLanguage");
              window.location.href = "/";
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
