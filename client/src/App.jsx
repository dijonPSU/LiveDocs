import LoginPage from "./pages/LoginPage";
import CallbackPage from "./pages/CallbackPage";
import HomePage from "./pages/HomePageC.jsx";
import DocumentPage from "./pages/DocumentPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/protectedRoute";
import { UserProvider } from "./context/UserContext";
import { WebSocketProvider } from "./context/WebsocketContext";

function App() {
  return (
    <UserProvider>
      <WebSocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/callback" element={<CallbackPage />} />

            <Route
              path="/Homepage"
              element={
                <ProtectedRoute>
                  <HomePage />
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
      </WebSocketProvider>
    </UserProvider>
  );
}

export default App;
