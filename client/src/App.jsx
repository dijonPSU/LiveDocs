import LoginPage from "./pages/loginPage";
import CallbackPage from "./pages/CallbackPage";
import Homepage from "./pages/Homepage";
import DocumentPage from "./pages/DocumentPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/Homepage" element={<Homepage />} />
        <Route path="/DocumentPage" element={<DocumentPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
