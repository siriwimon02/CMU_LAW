import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormPetition from '../pages/form_petition';
import Register from '../pages/register';
import Login from '../pages/login';
import Home from '../pages/home';
import Petition from '../pages/petition';

export default function AppRoutes() {

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/home' element={<Home/>} />
        <Route path="/formPetition" element={<FormPetition/>} />
        <Route path="/petition" element={<Petition/>} />
      </Routes>
    </Router>
  );
}


