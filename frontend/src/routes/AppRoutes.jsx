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
import DetailForUser from '../pages/staff/detailForUser';

// admin
import Admin_Panel from '../pages/admin/admin_panel';
import Admin_Action_Log from '../pages/admin/admin_action_log';
import DocumentDetails from "../pages/admin/DocumentDetails";

// ผู้อำนวยการคัดกรองเอกสาร 
import SuperAuditorTracking from "../pages/superAuditor/superAuditorTracking";
// auditor 
import AuditorTracking from '../pages/auditor/auditorTracking';
// ผู้อำนวยการคัดกรองเอกสาร

import SpvFinalAudited from '../pages/superAuditor/spv_finalaudited';

// auditor
import AuditorModify from "../pages/auditor/auditorModify";

// head auditor 
import HeadAuditorTracking from '../pages/headAuditor/headAuditorTracking';
import UploadDocumentApproved from '../pages/auditor/auditorApprove';
import RequireAuth from '../components/RequireAuth';
import Forbidden from '../pages/Forbidden';

export default function AppRoutes() {

  return (
    <Router>
      <Routes>
        <Route path="/403" element={<Forbidden />} />
        <Route path="/" element={<Home/>} />
        <Route path="/register" element={<Register/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/dashboard' element={<RequireAuth> <Dashboard/> </RequireAuth> } />
        <Route path="/petition" element={<RequireAuth roles={['user']}> <Petition/> </RequireAuth>}/>
        {/* head auditor */}
        <Route path="/headAuditTracking" element={<RequireAuth roles={['head_auditor']}> <HeadAuditorTracking/> </RequireAuth>} />

        {/* auditor */}
        <Route path="/auditTracking" element={<RequireAuth roles={['auditor']}> <AuditorTracking/> </RequireAuth>} />
        <Route path="/pending_approval" element={<RequireAuth roles={['auditor']}> <UploadDocumentApproved/> </RequireAuth>}/>
        <Route path="/auditorModify/:id" element={<RequireAuth roles={['auditor']}> <AuditorModify/> </RequireAuth>}/>


        {/* ผู้อำนวยการคัดกรองเอกสาร Super Auditor */}
        <Route path="/spvAuditTracking" element={<RequireAuth roles={['spv_auditor']}> <SuperAuditorTracking/> </RequireAuth>} />
        <Route path="/view/:id" element={<RequireAuth> <ViewPetition/> </RequireAuth>}/>
        <Route path="/finalaudit" element={<RequireAuth roles={['spv_auditor']}> <SpvFinalAudited/> </RequireAuth>}/>

        {/* staff */}
        <Route path="/formPetition" element={<RequireAuth roles={['user']}> <FormPetition/> </RequireAuth>} />
        <Route path="/tracking" element={<RequireAuth roles={['user']}> <Tracking/> </RequireAuth>}/>
        <Route path="/detail/:id" element={<RequireAuth roles={['spv_auditor', 'admin', 'auditor', 'head_auditor']}> <Detail/> </RequireAuth>} />
        <Route path="/modify/:id" element={<RequireAuth roles={['user']}> <Modify/> </RequireAuth>}/>
        <Route path="/detailForUser/:id" element={<RequireAuth roles={['user']}> <DetailForUser/> </RequireAuth>}/>


        
        {/* admin */}
        <Route path="/admin_panel" element={<RequireAuth roles={['admin']}> <Admin_Panel/> </RequireAuth>} />
        <Route path="/admin_action_log" element={<RequireAuth roles={['admin']}> <Admin_Action_Log/> </RequireAuth>} />
        <Route path="/document/:docId" element={<RequireAuth roles={['admin']}> <DocumentDetails/> </RequireAuth>} />
        
        
      </Routes>
    </Router>
  );
}


