import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/home';
import Register from '../pages/register';
import Login from '../pages/login';
import FormPetition from '../pages/form_petition';
import Dashboard from '../pages/dashboard';
import Petition from '../pages/petition';

export default function AppRoutes() {

  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home/>} />
        <Route path="/register" element={<Register/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path="/formPetition" element={<FormPetition/>} />
        <Route path="/petition" element={<Petition/>} />
      </Routes>
    </Router>
  );
}


