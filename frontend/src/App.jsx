import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import NewApplication from './pages/NewApplication';
import ApplicationHistory from './pages/ApplicationHistory';
import AnalysisResult from './pages/AnalysisResult';
import PolicyAssistant from './pages/PolicyAssistant';
import About from './pages/About';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing — no sidebar */}
          <Route path="/" element={<LandingPage />} />

          {/* App routes — with sidebar layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/applications/new" element={<NewApplication />} />
            <Route path="/history" element={<ApplicationHistory />} />
            <Route path="/analysis/:id" element={<AnalysisResult />} />
            <Route path="/assistant" element={<PolicyAssistant />} />
            <Route path="/about" element={<About />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
