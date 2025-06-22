import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init("eaBdGX9iZD0BzCpex");

createRoot(document.getElementById("root")!).render(<App />);
