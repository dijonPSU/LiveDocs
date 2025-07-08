import LoginPage from "./pages/LoginPage";
import CallbackPage from "./pages/CallbackPage";
import Homepage from "./pages/Homepage";
import DocumentPage from "./pages/DocumentPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/protectedRoute";
import  {UserProvider}  from "./context/UserContext";

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />

          <Route
            path="/Homepage"
            element={
              <ProtectedRoute>
                <Homepage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/DocumentPage"
            element={
              <ProtectedRoute>
                <DocumentPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
