import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormPetition from '../pages/form_petition';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/formPetition" element={<FormPetition/>} />
      </Routes>
    </Router>
  );
}

