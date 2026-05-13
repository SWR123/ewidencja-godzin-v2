"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Users, Clock, TrendingUp, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../../../components/ui/button";

interface Stats {
  totalRecords: number;
  totalUsers: number;
  totalHours: number;
  recentRecords: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    totalUsers: 0,
    totalHours: 0,
    recentRecords: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (response?.ok) {
          const data = await response.json();
          setStats(data ?? {});
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Wszystkie rekordy",
      value: stats?.totalRecords ?? 0,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      href: "/rekordy",
    },
    {
      title: "Użytkownicy",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      href: "/uzytkownicy",
    },
    {
      title: "Suma godzin",
      value: stats?.totalHours ?? 0,
      icon: Clock,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Ostatnie 30 dni",
      value: stats?.recentRecords ?? 0,
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-card p-8"
      >
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <Image 
              src="/logo-osir.png" 
              alt="OSiR Brodnica" 
              width={150} 
              height={75}
              priority
              className="rounded-xl"
            />
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              Autor programu: Michał Brzeziński<br />
              all rights to the program reserved 2026
            </p>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              System Ewidencji Godzin Pracy Społecznej
            </h1>
            <p className="text-gray-500 text-lg">
              Zarządzaj ewidencją godzin pracy społecznej i generuj dokumenty
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards?.map?.((stat, index) => {
          const Icon = stat?.icon;
          return (
            <motion.div
              key={stat?.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="bg-white rounded-3xl shadow-card p-6 hover:shadow-hover transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-2xl`}>
                    {Icon && <Icon className={`w-6 h-6 ${stat.textColor}`} />}
                  </div>
                  {stat?.href && (
                    <Link href={stat.href}>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  {stat?.title}
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : stat?.value}
                </p>
              </div>
            </motion.div>
          );
        }) ?? null}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl shadow-card p-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Zarządzanie Rekordami
              </h2>
              <p className="text-gray-500">
                Twórz, edytuj i usuwaj rekordy ewidencji godzin. Każdy rekord
                reprezentuje jeden miesięczny raport.
              </p>
            </div>
          </div>
          <Link href="/rekordy/nowy">
            <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-2xl h-12 text-base font-medium shadow-soft">
              <Plus className="w-5 h-5 mr-2" />
              Dodaj nowy rekord
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl shadow-card p-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-purple-50 p-3 rounded-2xl">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Generowanie Dokumentów
              </h2>
              <p className="text-gray-500">
                Generuj dokumenty DOCX zgodne z szablonem urzędowym. Możliwość
                masowego generowania wielu dokumentów.
              </p>
            </div>
          </div>
          <Link href="/rekordy">
            <Button variant="outline" className="w-full rounded-2xl h-12 text-base font-medium border-2 hover:bg-gray-50">
              Przejdź do rekordów
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
