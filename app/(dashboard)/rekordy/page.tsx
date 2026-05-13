"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Plus,
  Trash2,
  FileDown,
  Search,
  ArrowUpDown,
  Loader2,
  Archive,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Checkbox } from "../../../components/ui/checkbox";

const MONTHS: Record<number, string> = {
  1: "Styczeń", 2: "Luty", 3: "Marzec", 4: "Kwiecień",
  5: "Maj", 6: "Czerwiec", 7: "Lipiec", 8: "Sierpień",
  9: "Wrzesień", 10: "Październik", 11: "Listopad", 12: "Grudzień",
};

interface RecordType {
  id: string;
  kow?: string;
  wo?: string;
  ii_k?: string;
  nazwisko: string;
  imie: string;
  kod?: string;
  miejscowosc?: string;
  ulica?: string;
  nr_domu?: string;
  nr_lokalu?: string;
  nr_tel?: string;
  miesieczny_wymiar_godzin?: number;
  ilosc_miesiecy?: number;
  startowaLiczbaGodzin?: number;
  recordMonth?: number;
  recordYear?: number;
  data1?: string;
  data2?: string;
  uwagi?: string;
  suma: number;
  createdAt: string;
  updatedAt: string;
}

type SortField = keyof RecordType;
type SortDirection = "asc" | "desc";

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<RecordType[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingXlsx, setIsGeneratingXlsx] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    let filtered = records?.filter?.((record) => {
      const searchLower = searchQuery?.toLowerCase() || "";
      return (
        record?.nazwisko?.toLowerCase()?.includes(searchLower) ||
        record?.imie?.toLowerCase()?.includes(searchLower) ||
        record?.kow?.toLowerCase()?.includes(searchLower) ||
        record?.wo?.toLowerCase()?.includes(searchLower) ||
        record?.ii_k?.toLowerCase()?.includes(searchLower)
      );
    }) ?? [];

    // Sort
    filtered = filtered?.sort?.((a, b) => {
      let aVal = a?.[sortField];
      let bVal = b?.[sortField];

      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    }) ?? [];

    setFilteredRecords(filtered);
  }, [records, searchQuery, sortField, sortDirection]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/records");
      if (response?.ok) {
        const data = await response.json();
        setRecords(data ?? []);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRecords?.map?.((r) => r?.id) ?? []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...(selectedIds ?? []), id]);
    } else {
      setSelectedIds((selectedIds ?? []).filter?.((sid) => sid !== id) ?? []);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds?.length === 0) return;

    if (!confirm(`Czy na pewno chcesz usunąć ${selectedIds?.length} rekordów?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/records/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response?.ok) {
        await fetchRecords();
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Error deleting records:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateDocuments = async () => {
    if (selectedIds?.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/records/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds: selectedIds }),
      });

      if (response?.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ewidencja_${new Date().getTime()}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error generating documents:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleArchiveSelected = async () => {
    if (selectedIds?.length === 0) return;

    if (!confirm(`Czy na pewno chcesz przenieść ${selectedIds?.length} rekordów do archiwum?`)) {
      return;
    }

    setIsArchiving(true);
    try {
      const response = await fetch("/api/records/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response?.ok) {
        await fetchRecords();
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Error archiving records:", error);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleGenerateXlsx = async () => {
    if (selectedIds?.length === 0) return;

    setIsGeneratingXlsx(true);
    try {
      const response = await fetch("/api/records/generate-xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds: selectedIds }),
      });

      if (response?.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `zestawienie_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error generating XLSX:", error);
    } finally {
      setIsGeneratingXlsx(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return <ArrowUpDown className={`w-4 h-4 ${sortDirection === "asc" ? "text-blue-600" : "text-blue-600"}`} />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-3xl shadow-card p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rekordy</h1>
            <p className="text-gray-500 mt-1">
              Zarządzaj ewidencją godzin pracy społecznej
            </p>
          </div>
          <Link href="/rekordy/nowy">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-2xl h-12 px-6 shadow-soft hover:shadow-hover transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Nowy rekord
            </Button>
          </Link>
        </div>

        {/* Search and Bulk Actions */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Szukaj po nazwisku, imieniu, numerze sprawy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500"
            />
          </div>
          <AnimatePresence>
            {selectedIds?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-wrap gap-2"
              >
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="rounded-2xl h-12"
                >
                  {isDeleting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5 mr-2" />
                  )}
                  Usuń ({selectedIds?.length})
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleArchiveSelected}
                  disabled={isArchiving}
                  className="rounded-2xl h-12 bg-gray-100 hover:bg-gray-200"
                >
                  {isArchiving ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Archive className="w-5 h-5 mr-2" />
                  )}
                  Do archiwum
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerateDocuments}
                  disabled={isGenerating}
                  className="rounded-2xl h-12 border-2"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="w-5 h-5 mr-2" />
                  )}
                  Generuj DOCX
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerateXlsx}
                  disabled={isGeneratingXlsx}
                  className="rounded-2xl h-12 border-2"
                >
                  {isGeneratingXlsx ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-5 h-5 mr-2" />
                  )}
                  Zestawienie XLSX
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left">
                  <Checkbox
                    checked={
                      selectedIds?.length === filteredRecords?.length &&
                      filteredRecords?.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                {[
                  { field: "nazwisko", label: "Nazwisko" },
                  { field: "imie", label: "Imię" },
                  { field: "kow", label: "Kow" },
                  { field: "suma", label: "Suma godzin" },
                  { field: "miesieczny_wymiar_godzin", label: "Suma wyroku" },
                  { field: "recordMonth", label: "Miesiąc" },
                  { field: "createdAt", label: "Data utworzenia" },
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort(field as SortField)}
                  >
                    <div className="flex items-center gap-2">
                      {label}
                      <SortIcon field={field as SortField} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords?.map?.((record, index) => (
                <motion.tr
                  key={record?.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={(selectedIds ?? []).includes(record?.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(record?.id, checked as boolean)
                      }
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {record?.nazwisko}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record?.imie}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record?.kow || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {record?.suma}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(record?.miesieczny_wymiar_godzin && record?.ilosc_miesiecy)
                      ? (record.miesieczny_wymiar_godzin * record.ilosc_miesiecy)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                    {record?.recordMonth && record?.recordYear
                      ? `${MONTHS[record.recordMonth]} ${record.recordYear}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record?.createdAt
                      ? format(new Date(record.createdAt), "dd.MM.yyyy", {
                          locale: pl,
                        })
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/rekordy/${record?.id}`}>
                      <Button variant="ghost" size="sm" className="rounded-xl hover:bg-blue-50 hover:text-blue-600">
                        <Eye className="w-4 h-4 mr-2" />
                        Edytuj
                      </Button>
                    </Link>
                  </td>
                </motion.tr>
              )) ?? null}
            </tbody>
          </table>
          {filteredRecords?.length === 0 && (
            <div className="text-center py-16">
              <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchQuery ? "Brak wyników wyszukiwania" : "Brak rekordów do wyświetlenia"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
