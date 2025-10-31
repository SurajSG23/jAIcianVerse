import LandingPage from "./components/custom/LandingPage";
import { Route, Routes } from "react-router-dom";
import HomePage from "./components/custom/HomePage";
import Profile from "./components/custom/Profile";
import Materials from "./components/custom/Materials";
import Messages from "./components/custom/Messages";
import AIAvatar from "./components/custom/AiAvatar";
const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/aiteacher" element={<AIAvatar />} />
      </Routes>
    </div>
  );
};

export default App;
