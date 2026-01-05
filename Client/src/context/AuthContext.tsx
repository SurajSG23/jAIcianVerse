import { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type AuthContextType = {
  checkUser: (destination: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const checkUser = (destination: string) => {
    const user = localStorage.getItem("userInfo");

    if (!user) {
      toast.info("Please login to continue");
      navigate("/");
    } else {
      navigate(`/${destination}`);
    }
  };

  return (
    <AuthContext.Provider value={{ checkUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
