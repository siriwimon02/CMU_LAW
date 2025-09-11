import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/home';
import Register from '../pages/register';
import Login from '../pages/login';
import FormPetition from '../pages/form_petition';
import Dashboard from '../pages/dashboard';
import Petition from '../pages/petition';
import Admin_Panel from '../pages/admin_panel';
import Auditor_Check from '../pages/auditor_check';
import Tracking from '../pages/tracking'

export default function AppRoutes() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/register" element={<Register/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path="/formPetition" element={<FormPetition/>} />
        <Route path="/petition" element={<Petition/>} />
        <Route path="/admin_panel" element={<Admin_Panel/>} />
        <Route path="/auditor_check" element={<Auditor_Check/>} />
        <Route path="/tracking" element={<Tracking/>} />
      </Routes>
    </Router>
  );
}


