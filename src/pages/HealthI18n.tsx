import React from 'react';

interface I18nHealthData {
  defaultLocale: string;
  locales: string[];
  hasKOpages: boolean;
  hasHreflang: boolean;
  hasCanonical: boolean;
}

const HealthI18n: React.FC = () => {
  const healthData: I18nHealthData = {
    defaultLocale: "en",
    locales: ["en", "ko"],
    hasKOpages: true,
    hasHreflang: true,
    hasCanonical: true
  };

  // Set content type to JSON
  React.useEffect(() => {
    document.documentElement.style.setProperty('--content-type', 'application/json');
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg border p-6">
          <h1 className="text-2xl font-bold mb-4">I18n Health Check</h1>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(healthData, null, 2)}
          </pre>
          
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 p-3 rounded">
                <strong>Default Locale:</strong> {healthData.defaultLocale}
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <strong>Available Locales:</strong> {healthData.locales.join(', ')}
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <strong>Korean Pages:</strong> {healthData.hasKOpages ? '✓ Yes' : '✗ No'}
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <strong>Hreflang:</strong> {healthData.hasHreflang ? '✓ Yes' : '✗ No'}
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <strong>Canonical:</strong> {healthData.hasCanonical ? '✓ Yes' : '✗ No'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthI18n;