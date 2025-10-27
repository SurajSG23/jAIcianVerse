import React from "react";
import LandingPage from "./components/custom/LandingPage";
import { Route, Routes } from "react-router-dom";
import HomePage from "./components/custom/HomePage";
import Profile from "./components/custom/Profile";
const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
};

export default App;
