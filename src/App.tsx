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

import EventsPage from './components/pages/events'

function App() {

  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-ticket" element={<VerifyTicketPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/:slug" element={<BookingPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/seats" element={<SeatsPage />} />
              <Route path="/booked-seats" element={<BookedSeatsPage />} />
              <Route path="/seats-layout" element={<SeatsLayoutPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/booked" element={<TableBookedSeatPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>


    </>
  )
}

export default App
