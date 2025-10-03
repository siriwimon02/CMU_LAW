import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/home';
import Register from '../pages/register';
import Login from '../pages/login';
import Petition from '../pages/petition';
import Dashboard from '../pages/dashboard';
import ViewPetition from "../pages/viewPetition";
import Detail from "../pages/detail";
// staff
import FormPetition from '../pages/staff/form_petition';
import Tracking from '../pages/staff/tracking';
import Modify from "../pages/staff/modify";
// อธิการ
import TrackingForChancellor from "../pages/Chancellor/tracking"
// admin
import Admin_Panel from '../pages/admin/admin_panel';
// ผู้อำนวยการคัดกรองเอกสาร (EYE)
import SuperAuditorTracking from "../pages/superAuditor/superAuditorTracking";
// auditor (NOT)
import AuditorTracking from '../pages/auditor/auditorTracking';
// ผู้อำนวยการคัดกรองเอกสาร

import SpvFinalAudited from '../pages/spv_finalaudited';

// auditor

// head auditor (BEL)
import HeadAuditorTracking from '../pages/headAuditor/headAuditorTracking';
import UploadDocumentApproved from '../pages/auditor/auditorApprove';

export default function AppRoutes() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/register" element={<Register/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path="/petition" element={<Petition/>} />
        {/* head auditor */}
        <Route path="/headAuditTracking" element={<HeadAuditorTracking/>} />
        {/* auditor */}
        <Route path="/auditTracking" element={<AuditorTracking/>} />
        {/* ผู้อำนวยการคัดกรองเอกสาร Super Auditor */}
        <Route path="/spvAuditTracking" element={<SuperAuditorTracking />} />
        <Route path="/view/:id" element={<ViewPetition/>}/>
        <Route path="/finalaudit" element={<SpvFinalAudited />} />
        {/* staff */}
        <Route path="/formPetition" element={<FormPetition/>} />
        <Route path="/tracking" element={<Tracking/>} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/modify/:id" element={<Modify />}/>
        <Route path="/pending_approval" element={<UploadDocumentApproved/>}/>
        {/* admin */}
        <Route path="/admin_panel" element={<Admin_Panel/>} />
        {/* อธิการบดี */}
        <Route path="/chancellorTracking" element={<TrackingForChancellor/>}/>
        
      </Routes>
    </Router>
  );
}


