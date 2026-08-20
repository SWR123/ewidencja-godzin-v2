"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Plus,
  Trash2,
  Users as UsersIcon,
  Loader2,
  Mail,
  Calendar,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const ADMIN_EMAIL = "admin@ewidencja.pl";
const SUPERVISOR_EMAIL = "brzezinscy@yahoo.pl";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  requirePasswordReset: boolean;
}

export default function UsersPage() {
  const { data: session } = useSession() || {};
  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  const isSupervisor = session?.user?.email === SUPERVISOR_EMAIL;
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response?.ok) {
        const data = await response.json();
        setUsers(data ?? []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserName || !newUserEmail || !newUserPassword) {
      alert("Wszystkie pola są wymagane");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
        }),
      });

      if (response?.ok) {
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setShowAddForm(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData?.error || "Wystąpił błąd");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Wystąpił błąd podczas dodawania użytkownika");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tego użytkownika?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response?.ok) {
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData?.error || "Wystąpił błąd");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Wystąpił błąd podczas usuwania użytkownika");
    }
  };

  const handleTogglePasswordReset = async (userId: string, value: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/require-password-reset`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirePasswordReset: value }),
      });

      if (response?.ok) {
        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, requirePasswordReset: value } : user
          )
        );
      } else {
        const errorData = await response.json();
        alert(errorData?.error || "Wystąpił błąd podczas aktualizacji flagi resetu hasła");
      }
    } catch (error) {
      console.error("Error toggling password reset:", error);
      alert("Wystąpił błąd podczas aktualizacji flagi resetu hasła");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold text-gray-900">Użytkownicy</h1>
            <p className="text-gray-500 mt-1">
              Zarządzaj użytkownikami systemu
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-2xl h-12 px-6 shadow-soft hover:shadow-hover transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Dodaj użytkownika
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Szukaj użytkownika..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Add User Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl shadow-card p-8 overflow-hidden"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Nowy użytkownik
            </h3>
            <form onSubmit={handleAddUser} className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-gray-700 font-medium">Imię i nazwisko</Label>
                <Input
                  id="name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  placeholder="Jan Kowalski"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  placeholder="jan@email.com"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium">Hasło</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-2xl h-12 px-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5 mr-2" />
                  )}
                  Dodaj
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-2xl h-12 px-6 border-2"
                >
                  Anuluj
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers?.map?.((user, index) => (
          <motion.div
            key={user?.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-3xl shadow-card hover:shadow-hover transition-all duration-300 p-6 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-base">
                    {user?.name || "Bez nazwy"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>
                      {user?.createdAt
                        ? format(new Date(user.createdAt), "dd.MM.yyyy", {
                            locale: pl,
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Password reset toggle - only visible to supervisor */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id={`reset-${user.id}`}
                    checked={user.requirePasswordReset}
                    disabled={!isSupervisor}
                    onChange={(e) => handleTogglePasswordReset(user.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <label
                    htmlFor={`reset-${user.id}`}
                    className="text-xs text-gray-500 whitespace-nowrap"
                  >
                    Reset hasła
                  </label>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteUser(user?.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )) ?? null}
      </div>

      {filteredUsers?.length === 0 && (
        <div className="bg-white rounded-3xl shadow-card p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchQuery ? "Brak wyników wyszukiwania" : "Brak użytkowników w systemie"}
          </p>
        </div>
      )}
    </div>
  );
}
