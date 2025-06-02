
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">SpiZwiBu Generator</h1>
          <p className="text-gray-600">
            Einfache SpiZwiBu Verteilung
          </p>
        </header>
        
        {/* Main content */}
        <main className="space-y-8">
          {/* App description */}
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Faire SpiZwiBu Pläne erstellen</h2>
            <p className="mb-4 text-gray-700">
              Diese Anwendung hilft dir dabei, Mitarbeiter fair auf mehrere SpiZwiBu Stationen über einen wöchentlichen 
              Dienstplan zu verteilen, unter Berücksichtigung individueller Verfügbarkeiten. 
              <strong>Jede Station wird mit 2 Personen pro Zeitslot besetzt.</strong>
            </p>
            
            {/* Workflow steps */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Einfacher Arbeitsablauf:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Namen von Personen importieren</li>
                <li>Stationen konfigurieren</li>
                <li>Ausgewogenen Plan generieren</li>
                <li>Manuelle Anpassungen vornehmen</li>
                <li>Als CSV-Datei exportieren</li>
              </ol>
            </div>
          </section>
          
          {/* Get started section */}
          <div className="text-center mt-8">
            <Link 
              href="/import"
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors inline-block"
            >
              Neue Sitzung starten
            </Link>
            <p className="text-sm text-gray-500 mt-3">
              Alle Daten bleiben in Ihrem Browser und werden beim Schließen des Tabs gelöscht
            </p>
          </div>

          {/* Quick access section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/import"
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <h3 className="font-medium mb-2">1. Import</h3>
              <p className="text-sm text-gray-600">Namen manuell eingeben oder CSV-Datei hochladen</p>
            </Link>
            
            <Link
              href="/configuration"
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <h3 className="font-medium mb-2">2. Konfiguration</h3>
              <p className="text-sm text-gray-600">Stationen verwalten und konfigurieren</p>
            </Link>
            
            <Link
              href="/schedule"
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <h3 className="font-medium mb-2">3. Generierung</h3>
              <p className="text-sm text-gray-600">Fairen Dienstplan automatisch erstellen</p>
            </Link>
            
            <Link
              href="/display"
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <h3 className="font-medium mb-2">4. Export</h3>
              <p className="text-sm text-gray-600">Dienstplan anzeigen und als CSV exportieren</p>
            </Link>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Station Assignment Scheduler • Privacy-focused • Session-only storage</p>
        </footer>
      </div>
    </div>
  );
}