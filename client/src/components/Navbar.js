import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">Blood Bank</Link>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            {(isHome || isLogin || isRegister) && (
              <>
                <li className="nav-item">
                  <Link to="/register" className="nav-link">Register</Link>
                </li>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">Login</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
