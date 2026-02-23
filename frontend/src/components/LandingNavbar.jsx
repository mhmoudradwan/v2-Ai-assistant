import React, { useEffect, useState } from "react";
import '../navbar.css'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

const LandingNavbar = () => {
    const [displayName, setDisplayName] = useState("User");

    useEffect(() => {
        const savedName = localStorage.getItem("baseeraUserName");
        if (savedName) {
            setDisplayName(savedName);
        }
    }, []);

  return (
  <>
<nav className="navbar navbar-expand-lg bg-body">
            <div className="container-fluid navbar-inner">
                <Link className="navbar-brand" to="/landing">
                    <img src={logo} alt="logo" />
                    <span className="navbar-brand-text">Baseera</span>
                </Link>
                
                {/* Toggler for mobile */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link" to="/landing">
                                Home
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/about">
                                About
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/contact">
                                Contact
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/bugs">
                            Bugs
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/Profile">
                            Profile
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="navbar-actions ">
                    <div className="register-btn" style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    Hi, {displayName}
                    </div>
                    
            
                </div>
            </div>
        </nav>
  </>
  
  );
};

export default LandingNavbar;