"use client";

import { RecordForm } from "@/components/record-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewRecordPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/rekordy">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nowy rekord
            </h1>
            <p className="text-gray-600 mt-1">
              Dodaj nową ewidencję godzin pracy społecznej
            </p>
          </div>
        </div>
      </div>

      <RecordForm />
    </div>
  );
}
