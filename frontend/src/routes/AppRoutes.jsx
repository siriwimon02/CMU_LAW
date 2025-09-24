import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/home';
import Register from '../pages/register';
import Login from '../pages/login';
import Auditor_Check from '../pages/auditor_check';
import Petition from '../pages/petition';
import Dashboard from '../pages/dashboard';
// user
import FormPetition from '../pages/staff/form_petition';
import Tracking from '../pages/staff/tracking';
import Detail from "../pages/staff/detail";
import Modify from "../pages/staff/modify";
// อธิการ
import TrackingForChancellor from "../pages/Chancellor/tracking"
// admin
import Admin_Panel from '../pages/admin/admin_panel';
// ผู้อำนวยการคัดกรองเอกสาร
import SpvAuditor from "../pages/spvauditor";
// auditor
import Employee_Paper from '../pages/employee_paper';
import DetailForAuditor from '../pages/auditor/moreDetail';
import ViewAuditor from '../pages/auditor/viewPetition';
// head auditor
import ViewHeadAuditor from '../pages/headAuditor/viewPetition';
import DetailForHeadAuditor from '../pages/headAuditor/moreDetail';

import ViewPetition from "../pages/viewPetition";

export default function AppRoutes() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/register" element={<Register/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path="/petition" element={<Petition/>} />
        <Route path="/auditor_check" element={<Auditor_Check/>} />
        {/* head auditor */}
        <Route path="/viewHeadAuditor/:id" element={<ViewHeadAuditor/>}/>
        <Route path="/detailForHeadAuditor/:id" element={<DetailForAuditor/>}/>
        {/* auditor */}
        <Route path="/employeePaper" element={<Employee_Paper/>} />
        <Route path="/petitionDetailForAuditor/:id" element={<DetailForAuditor/>}/>
        <Route path="/viewAuditor/:id" element={<ViewAuditor/>}/>
        {/* staff */}
        <Route path="/formPetition" element={<FormPetition/>} />
        <Route path="/tracking" element={<Tracking/>} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/modify/:id" element={<Modify />}/>
        {/* admin */}
        <Route path="/admin_panel" element={<Admin_Panel/>} />
        {/* อธิการบดี */}
        <Route path="/chancellorTracking" element={<TrackingForChancellor/>}/>
        {/* ผู้อำนวยการคัดกรองเอกสาร */}
        <Route path="/spvauditor" element={<SpvAuditor />} />
        <Route path="/view/:id" element={<ViewPetition/>}/>
      </Routes>
    </Router>
  );
}


