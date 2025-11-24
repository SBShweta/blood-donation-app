import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    navigate('/', { replace: true }); // Redirect to home
  }, [navigate]);

  return (
    <div className="container mt-5">
      <h3>Logging out...</h3>
    </div>
  );
};

export default Logout;
