import { Routes, Route, Link } from "react-router-dom";
import UploadPage from "./pages/UploadPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";

export default function App() {
  return (
    <>
      <nav>
        <span className="logo">FoundIT</span>
        <Link to="/">I Found Something</Link>
        <Link to="/search">I Lost Something</Link>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </div>
    </>
  );
}
