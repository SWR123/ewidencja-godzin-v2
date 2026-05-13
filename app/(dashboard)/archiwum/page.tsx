"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Trash2,
  Search,
  ArrowUpDown,
  Loader2,
  ArchiveRestore,
  Archive,
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
  recordMonth?: number;
  recordYear?: number;
  data1?: string;
  data2?: string;
  uwagi?: string;
  suma: number;
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ArchivePage() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"nazwisko" | "suma" | "archivedAt">("archivedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/records?archived=true");
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error("Error fetching archived records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: "nazwisko" | "suma" | "archivedAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const handleSelectRecord = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`Czy na pewno chcesz przywrócić ${selectedIds.length} rekord(ów) z archiwum?`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const response = await fetch("/api/records/archive", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        setSelectedIds([]);
        fetchRecords();
      }
    } catch (error) {
      console.error("Error restoring records:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`Czy na pewno chcesz TRWALE usunąć ${selectedIds.length} rekord(ów)? Ta operacja jest nieodwracalna!`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/records/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        setSelectedIds([]);
        fetchRecords();
      }
    } catch (error) {
      console.error("Error deleting records:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRecords = records
    .filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        record?.nazwisko?.toLowerCase()?.includes(searchLower) ||
        record?.imie?.toLowerCase()?.includes(searchLower) ||
        record?.kow?.toLowerCase()?.includes(searchLower) ||
        record?.wo?.toLowerCase()?.includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortField === "nazwisko") {
        aVal = a?.nazwisko?.toLowerCase() || "";
        bVal = b?.nazwisko?.toLowerCase() || "";
      } else if (sortField === "suma") {
        aVal = a?.suma || 0;
        bVal = b?.suma || 0;
      } else {
        aVal = a?.archivedAt ? new Date(a.archivedAt).getTime() : 0;
        bVal = b?.archivedAt ? new Date(b.archivedAt).getTime() : 0;
      }
      if (sortDirection === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="w-6 h-6" />
            Archiwum
          </h1>
          <p className="text-gray-600">Zarchiwizowane rekordy ({records.length})</p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Szukaj po nazwisku, imieniu, Kow, Wo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleRestoreSelected}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArchiveRestore className="w-4 h-4 mr-2" />
              )}
              Przywróć ({selectedIds.length})
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Usuń trwale ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={selectedIds.length === filteredRecords.length && filteredRecords.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort("nazwisko")}
                >
                  <div className="flex items-center gap-1">
                    Nazwisko i Imię
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Miesiąc
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Kow / Wo / II K
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort("suma")}
                >
                  <div className="flex items-center gap-1">
                    Suma godzin
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort("archivedAt")}
                >
                  <div className="flex items-center gap-1">
                    Zarchiwizowano
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords?.map?.((record, index) => (
                <motion.tr
                  key={record?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`hover:bg-gray-50 ${
                    selectedIds.includes(record?.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.includes(record?.id)}
                      onCheckedChange={() => handleSelectRecord(record?.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {record?.nazwisko} {record?.imie}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record?.miejscowosc}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record?.recordMonth && record?.recordYear ? (
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {MONTHS[record.recordMonth]} {record.recordYear}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {[record?.kow, record?.wo, record?.ii_k]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-blue-600">
                      {record?.suma?.toFixed?.(1) ?? "0"} h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record?.archivedAt
                      ? format(new Date(record.archivedAt), "dd.MM.yyyy HH:mm", {
                          locale: pl,
                        })
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/rekordy/${record?.id}`}>
                      <Button variant="ghost" size="sm">
                        Podgląd
                      </Button>
                    </Link>
                  </td>
                </motion.tr>
              )) ?? null}
            </tbody>
          </table>
          {filteredRecords?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Brak zarchiwizowanych rekordów
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
