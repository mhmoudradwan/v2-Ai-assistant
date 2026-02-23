import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
// import '../index.css'
import '../navbar.css'

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg bg-body">
            <div className="container-fluid navbar-inner">
                <Link className="navbar-brand" to="/">
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
                            <Link className="nav-link" to="/">
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
                            <Link className="nav-link" to="/login">
                                Login
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="navbar-actions">
                    <Link to="/register" className="register-btn">
                        Register
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;