import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'

import './index.css'
import App from './App.jsx'

import Header from './Component/Header/Header.jsx'
import Footer from './Component/Footer/Footer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* <Header /> */}
      <main>
        <App />
      </main>
      {/* <Footer /> */}
    </BrowserRouter>
  </StrictMode>
)
