"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Upload, Database, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/backup/export");
      if (!response.ok) {
        throw new Error("Błąd podczas tworzenia kopii zapasowej");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      a.download = `backup_ewidencja_${date}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setMessage({ type: "success", text: "Kopia zapasowa została pobrana pomyślnie" });
    } catch (error) {
      setMessage({ type: "error", text: "Błąd podczas tworzenia kopii zapasowej" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const response = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Błąd podczas importowania");
      }

      setMessage({ type: "success", text: result.message });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Błąd podczas importowania kopii zapasowej",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kopie Zapasowe</h1>
            <p className="text-gray-600">Twórz i przywracaj kopie zapasowe danych</p>
          </div>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={message.type === "success" ? "text-green-700" : "text-red-700"}>
              {message.text}
            </p>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500 p-2 rounded-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Eksport danych</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Pobierz kopię zapasową wszystkich rekordów i danych użytkowników w formacie JSON.
            Zalecamy regularne tworzenie kopii zapasowych.
          </p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Tworzenie kopii...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Pobierz kopię zapasową
              </>
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Import danych</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Przywróć dane z wcześniej utworzonej kopii zapasowej. Duplikaty rekordów zostaną
            automatycznie pominięte.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="backup-file"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            variant="outline"
            className="w-full"
          >
            {isImporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Importowanie...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Wybierz plik kopii zapasowej
              </>
            )}
          </Button>
        </motion.div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Ważne informacje</h3>
        <ul className="text-yellow-700 space-y-1 text-sm">
          <li>• Kopia zapasowa zawiera wszystkie rekordy ewidencji oraz listę użytkowników</li>
          <li>• Hasła użytkowników nie są eksportowane ze względów bezpieczeństwa</li>
          <li>• Podczas importu duplikaty rekordów są automatycznie pomijane</li>
          <li>• Zalecamy tworzenie kopii zapasowej przed wprowadzeniem większych zmian</li>
        </ul>
      </div>
    </div>
  );
}
