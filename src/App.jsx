import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Sparkles, Search, User } from 'lucide-react';
import Onboarding from './pages/Onboarding';
import DiscoveryFeed from './pages/Home';
import SearchCompare from './pages/SearchCompare';

// Navigation Component (Bottom Bar)
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="bottom-nav">
      <button onClick={() => navigate('/')} className={`nav-item ${currentPath === '/' ? 'active' : ''}`}>
        <Search size={24} />
        <span>검색/비교</span>
      </button>
      <button onClick={() => navigate('/home')} className={`nav-item ${currentPath === '/home' ? 'active' : ''}`}>
        <Home size={24} />
        <span>할인특가</span>
      </button>
      <button onClick={() => navigate('/onboarding')} className={`nav-item ${currentPath === '/onboarding' ? 'active' : ''}`}>
        <User size={24} />
        <span>MY 혜택</span>
      </button>
    </nav>
  );
};

// Header Component
const Header = () => (
  <header className="header">
    <div className="brand">
      <Sparkles size={20} style={{ color: "var(--primary)" }} />
       Jerry's Price
    </div>
  </header>
);

function App() {
  return (
    <div className="app-container">
      <Header />
      <Routes>
        <Route path="/" element={<SearchCompare />} />
        <Route path="/home" element={<DiscoveryFeed />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
      <Navigation />
    </div>
  );
}

export default App;
