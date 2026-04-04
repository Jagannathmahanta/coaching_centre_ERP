// main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./shared/hooks/AuthContext";


const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      
      {/* 🔥 VERY IMPORTANT */}
      <AuthProvider>
        <App />
      </AuthProvider>

    </QueryClientProvider>
  </React.StrictMode>
);
