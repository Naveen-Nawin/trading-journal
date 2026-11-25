import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JournalProvider } from "@/context/JournalContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Trades from "@/pages/Trades";
import CalendarPage from "@/pages/CalendarPage";
import Plan from "@/pages/Plan";

function App() {
  return (
    <JournalProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/plan" element={<Plan />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </JournalProvider>
  );
}

export default App;
