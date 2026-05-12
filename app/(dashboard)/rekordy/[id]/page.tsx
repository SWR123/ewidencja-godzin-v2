"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecordForm } from "@/components/record-form";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditRecordPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchRecord(params.id as string);
    }
  }, [params?.id]);

  const fetchRecord = async (id: string) => {
    try {
      const response = await fetch(`/api/records/${id}`);
      if (response?.ok) {
        const data = await response.json();
        setRecord(data);
      } else {
        router.push("/rekordy");
      }
    } catch (error) {
      console.error("Error fetching record:", error);
      router.push("/rekordy");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Czy na pewno chcesz usunąć ten rekord?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/records/${params?.id}`, {
        method: "DELETE",
      });

      if (response?.ok) {
        router.push("/rekordy");
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Wystąpił błąd podczas usuwania rekordu");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">Rekord nie został znaleziony</p>
        <Link href="/rekordy">
          <Button className="mt-4">Powrót do listy</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/rekordy">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edytuj rekord
              </h1>
              <p className="text-gray-600 mt-1">
                {record?.nazwisko} {record?.imie}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Usuń
          </Button>
        </div>
      </div>

      <RecordForm initialData={record} isEdit />
    </div>
  );
}
