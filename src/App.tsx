import { useEffect } from 'react'
import Lanyard from './Lanyard'
import './index.css'

function App() {
  // Load Phosphor Icons dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/@phosphor-icons/web";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return (
    <>
      <div className="background-animation"></div>
      
      <div className="canvas-container">
        <Lanyard />
      </div>

      <div className="ui-layer">
        <div className="links-container">
          <a href="https://www.linkedin.com/in/zulfahmi-2b6561325" target="_blank" rel="noopener noreferrer" className="link-card">
            <i className="ph ph-linkedin-logo"></i>
            <span>LinkedIn</span>
          </a>
          
          <a href="https://github.com/f4hmii" target="_blank" rel="noopener noreferrer" className="link-card">
            <i className="ph ph-github-logo"></i>
            <span>GitHub</span>
          </a>
          
          <a href="#" className="link-card">
            <i className="ph ph-briefcase"></i>
            <span>Portofolio</span>
          </a>

          <div className="footer">
            <p>&copy; 2026 Zulfahmi. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
