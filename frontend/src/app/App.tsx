import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './Landing';
import { InstitutionView } from '../roles/institution/InstitutionView';
import { ScrutinyWorkbench } from '../roles/scrutiny/ScrutinyWorkbench';
import { RegionalCommandView } from '../roles/regional/RegionalCommandView';
import { BureauControlRoom } from '../roles/bureau/BureauControlRoom';
import { EvcScheduler } from '../roles/evc/EvcScheduler';
import { CommitteeDesk } from '../roles/committee/CommitteeDesk';
import { ComplianceTracker } from '../roles/compliance/ComplianceTracker';
import { ExecutiveOverview } from '../roles/authority/ExecutiveOverview';
import { ConfigurationStudio } from '../roles/admin/ConfigurationStudio';
import { AuditorView } from '../roles/auditor/AuditorView';
import { RoleRouteGuard } from './RoleRouteGuard';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Hub */}
        <Route path="/" element={<Landing />} />

        {/* Role 1: Institution */}
        <Route
          path="/institution/*"
          element={
            <RoleRouteGuard requiredRole="INSTITUTION">
              <InstitutionView />
            </RoleRouteGuard>
          }
        />

        {/* Role 2: Scrutiny Officer */}
        <Route
          path="/scrutiny/*"
          element={
            <RoleRouteGuard requiredRole="SCRUTINY_OFFICER">
              <ScrutinyWorkbench />
            </RoleRouteGuard>
          }
        />

        {/* Role 3: Regional Officer */}
        <Route
          path="/regional/*"
          element={
            <RoleRouteGuard requiredRole="REGIONAL_OFFICER">
              <RegionalCommandView />
            </RoleRouteGuard>
          }
        />

        {/* Role 4: Bureau Officer */}
        <Route
          path="/bureau/*"
          element={
            <RoleRouteGuard requiredRole="BUREAU_OFFICER">
              <BureauControlRoom />
            </RoleRouteGuard>
          }
        />

        {/* Role 5: EVC Coordinator */}
        <Route
          path="/evc/*"
          element={
            <RoleRouteGuard requiredRole="EVC_COORDINATOR">
              <EvcScheduler />
            </RoleRouteGuard>
          }
        />

        {/* Role 6: Committee Member */}
        <Route
          path="/committee/*"
          element={
            <RoleRouteGuard requiredRole="COMMITTEE_MEMBER">
              <CommitteeDesk />
            </RoleRouteGuard>
          }
        />

        {/* Role 7: Compliance Officer */}
        <Route
          path="/compliance/*"
          element={
            <RoleRouteGuard requiredRole="COMPLIANCE_OFFICER">
              <ComplianceTracker />
            </RoleRouteGuard>
          }
        />

        {/* Role 8: Senior Authority */}
        <Route
          path="/authority/*"
          element={
            <RoleRouteGuard requiredRole="SENIOR_AUTHORITY">
              <ExecutiveOverview />
            </RoleRouteGuard>
          }
        />

        {/* Role 9: System Admin */}
        <Route
          path="/admin/*"
          element={
            <RoleRouteGuard requiredRole="SYSTEM_ADMIN">
              <ConfigurationStudio />
            </RoleRouteGuard>
          }
        />

        {/* Role 10: Auditor */}
        <Route
          path="/auditor/*"
          element={
            <RoleRouteGuard requiredRole="AUDITOR">
              <AuditorView />
            </RoleRouteGuard>
          }
        />

        {/* Fallback to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
