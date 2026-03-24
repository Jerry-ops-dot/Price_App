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
        <Home size={24} />
        <span>홈</span>
      </button>
      <button onClick={() => navigate('/search')} className={`nav-item ${currentPath === '/search' ? 'active' : ''}`}>
        <Search size={24} />
        <span>비교/검색</span>
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
       PickPrice
    </div>
  </header>
);

function App() {
  return (
    <div className="app-container">
      <Header />
      <Routes>
        <Route path="/" element={<DiscoveryFeed />} />
        <Route path="/search" element={<SearchCompare />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
      <Navigation />
    </div>
  );
}

export default App;
