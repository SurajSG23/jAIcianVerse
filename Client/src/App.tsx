import LandingPage from "./components/custom/LandingPage";
import { Route, Routes } from "react-router-dom";
import HomePage from "./components/custom/HomePage";
import Profile from "./components/custom/Profile";
import Materials from "./components/custom/Materials";
import MessagePage from "./components/custom/MessagePage";
import ChatBotWidget from "./components/custom/ChatBotWidget";
import { ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";

const App = () => {
  const location = useLocation();
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/messages" element={<MessagePage />} />
      </Routes>
      {location.pathname !== "/" && <ChatBotWidget />}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default App;
