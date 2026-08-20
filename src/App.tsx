import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardPage from './components/pages/dashboard'
import SeatsPage from './components/pages/seats'
import SeatsLayoutPage from './components/pages/seats-layout'
import BookedSeatsPage from './components/pages/booked-seats'
import HomePage from './components/pages/home'
import { AuthProvider } from './context/AuthProvider'
import LoginPage from './components/pages/login-page'
import ProtectedRoute from './components/protected-route'
import TicketsPage from './components/pages/tickets'
import TableBookedSeatPage from './components/pages/table-booked-seats'
import VerifyTicketPage from './components/pages/verify-ticket'
import BookingPage from './components/pages/booking'
import SettingsPage from './components/pages/settings'

import EventsPage from './components/pages/events'
import RegisterPage from './components/pages/register'
import CommunityPublicPage from './components/pages/community-public'
import AccountCommunitiesPage from './components/pages/account-communities'
import CommunityPortalDashboardPage from './components/pages/community-portal-dashboard'
import CommunityMembersPage from './components/pages/community-members'
import AcceptInvitationPage from './components/pages/accept-invitation'
import AccountSessionsPage from './components/pages/account-sessions'
import AccountFollowingPage from './components/pages/account-following'
import EventPublicDetailPage from './components/pages/event-public-detail'
import CommunityProfileSettingsPage from './components/pages/community-profile-settings'
import { PublicShell } from './components/layouts/public-shell'
import { AccountShell } from './components/layouts/account-shell'
import { CommunityPortalShell } from './components/layouts/community-portal-shell'

function App() {

  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route element={<PublicShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/communities/:slug" element={<CommunityPublicPage />} />
              <Route path="/events/:idOrSlug" element={<EventPublicDetailPage />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-ticket" element={<VerifyTicketPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/:slug" element={<BookingPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/invitations/:token" element={<AcceptInvitationPage />} />
              <Route element={<AccountShell />}>
                <Route path="/account/communities" element={<AccountCommunitiesPage />} />
                <Route path="/account/sessions" element={<AccountSessionsPage />} />
                <Route path="/account/following" element={<AccountFollowingPage />} />
              </Route>
              <Route path="/portal/:communityId" element={<CommunityPortalShell />}>
                <Route index element={<CommunityPortalDashboardPage />} />
                <Route path="members" element={<CommunityMembersPage />} />
                <Route path="profile" element={<CommunityProfileSettingsPage />} />
              </Route>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/seats" element={<SeatsPage />} />
              <Route path="/booked-seats" element={<BookedSeatsPage />} />
              <Route path="/seats-layout" element={<SeatsLayoutPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/booked" element={<TableBookedSeatPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>


    </>
  )
}

export default App
