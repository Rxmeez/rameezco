import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Search from "./Search";

export default function MainLayout() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Header onSearchClick={() => setSearchOpen(true)} />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <Search isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
