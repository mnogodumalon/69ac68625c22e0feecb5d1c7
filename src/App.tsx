import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import PflegeplanungPage from '@/pages/PflegeplanungPage';
import GartenbereichePage from '@/pages/GartenbereichePage';
import ArbeitsprotokollPage from '@/pages/ArbeitsprotokollPage';
import SaisonaleAufgabenPage from '@/pages/SaisonaleAufgabenPage';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
              <Route path="pflegeplanung" element={<PflegeplanungPage />} />
              <Route path="gartenbereiche" element={<GartenbereichePage />} />
              <Route path="arbeitsprotokoll" element={<ArbeitsprotokollPage />} />
              <Route path="saisonale-aufgaben" element={<SaisonaleAufgabenPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
