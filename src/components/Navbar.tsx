"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-amber-700">
              Creative Salon
            </Link>
            <div className="hidden md:flex ml-10 space-x-1">
              <Link
                href="/"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                  pathname === "/"
                    ? "text-amber-700 bg-amber-50"
                    : "text-gray-500 hover:text-amber-700 hover:bg-gray-50"
                }`}
              >
                소개
              </Link>
              {session && (
                <>
                  <Link
                    href="/my"
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                      isActive("/my")
                        ? "text-amber-700 bg-amber-50"
                        : "text-gray-500 hover:text-amber-700 hover:bg-gray-50"
                    }`}
                  >
                    나의 뇌
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                      isActive("/dashboard") || isActive("/groups")
                        ? "text-amber-700 bg-amber-50"
                        : "text-gray-500 hover:text-amber-700 hover:bg-gray-50"
                    }`}
                  >
                    모임
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-amber-700"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium">
                    {session.user?.name?.[0]}
                  </div>
                  <span className="hidden sm:inline">{session.user?.name}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    <Link
                      href="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      소개
                    </Link>
                    <Link
                      href="/my"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      나의 뇌
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      모임
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-amber-700 px-4 py-2 text-sm font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="bg-amber-600 text-white hover:bg-amber-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
