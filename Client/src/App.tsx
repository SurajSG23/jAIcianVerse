import React from "react";
import LandingPage from "./components/custom/LandingPage";
import { Route, Routes } from "react-router-dom";
import HomePage from "./components/custom/HomePage";
const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/homepage" element={<HomePage />} />
      </Routes>
    </div>
  );
};

export default App;
