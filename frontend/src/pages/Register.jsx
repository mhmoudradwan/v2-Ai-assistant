import React, { useState } from "react";
import "../index.css";
import "../components/Navbar"
import "../about.css";
import "../contact.css";
import "../register.css";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from '../api/authApi';
import Navbar from "../components/Navbar";



import icon1 from "../assets/logo.png";



function Register(){
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const firstName = (formData.get("fullName") || "").toString().trim();
        const lastName = (formData.get("lastName") || "").toString().trim();
        const username = (formData.get("username") || "").toString().trim();
        const email = (formData.get("email") || "").toString().trim();
        const password = (formData.get("password") || "").toString().trim();
        const phoneNumber = (formData.get("phoneNumber") || "").toString().trim() || null;
        const gender = (formData.get("gender") || "").toString().trim() || null;
        const dateOfBirth = (formData.get("dateOfBirth") || "").toString().trim() || null;
        const country = (formData.get("country") || "").toString().trim() || null;

        setError("");
        setSuccess("");
        setLoading(true);

        if (!firstName || !lastName || !username || !email || !password) {
            setError("Please fill all fields");
            setLoading(false);
            return;
        }

        if (!email.includes("@")) {
            setError("Invalid email address");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const response = await authApi.register({
                email,
                username,
                firstName,
                lastName,
                password,
                phoneNumber,
                gender,
                dateOfBirth,
                country
            });

            if (response.success) {
                setSuccess("Account created successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate("/login");
                }, 1500);
            } else {
                setError(response.message || "Registration failed");
            }
        } catch (error) {
            console.error("Registration error:", error);
            setError(error.response?.data?.message || "Error creating account. Please try again");
        } finally {
            setLoading(false);
        }
    };

    return(
        <>
           <Navbar/>
        <section className="register-container">
            <div className="register-box">
          <div className="logo-icon">
                                <img src={icon1} alt="login icon" width={30} height={30} />
                                <h2 className="logo-title">Baseera</h2>
            </div>
              <div className="register-info">
                    <div className="register-title">
                        <h1 className="create">Create Your Account</h1>
                        <p className="register-description">
                            Join Baseera to secure your digital presence
                        </p>
                </div>
                </div>
                    {error && <div style={{color: "#ffffff", padding: "8px 10px", backgroundColor: "rgba(211, 47, 47, 0.15)", borderLeft: "3px solid #d32f2f", borderRadius: "4px", textAlign: "center", fontSize: "13px", boxSizing: "border-box", marginTop: "15px", marginBottom: "0"}}>{error}</div>}
                    {success && <div style={{color: "rgb(197, 244, 201)", padding: "8px 10px", backgroundColor: "rgba(76, 175, 80, 0.15)", borderLeft: "3px solid #4caf50", borderRadius: "4px", textAlign: "center", fontSize: "13px", boxSizing: "border-box", marginTop: "15px", marginBottom: "0"}}>{success}</div>}
                <form className="register-form" onSubmit={handleSubmit}>
                    <h5 className="register-form-title">
                        First Name
                    </h5>
                    <div className="register-input-wrapper">
                        <i className="fa-solid fa-user register-input-icon"></i>
                        <input className="register-form-input" name="fullName" type="text" placeholder="Mark " disabled={loading} required />
                    </div>
                    <h5 className="register-form-title">
                        Last Name
                    </h5>
                    <div className="register-input-wrapper">
                        <i className="fa-solid fa-user register-input-icon"></i>
                        <input className="register-form-input" name="lastName" type="text" placeholder="Johnson" disabled={loading} required />
                    </div>
                    <h5 className="register-form-title">
                        Username
                    </h5>
                    <div className="register-input-wrapper">
                        <i className="fa-solid fa-at register-input-icon"></i>
                        <input className="register-form-input" name="username" type="text" placeholder=" Markjohnson" disabled={loading} required />
                    </div>
                    <h5 className="register-form-title">
                        Email Address
                    </h5>
                    <div className="register-input-wrapper">
                        <i className="fa-solid fa-envelope register-input-icon"></i>
                        <input className="register-form-input" name="email" type="email" placeholder=" Mark.johnson@baseera.security" disabled={loading} required />
                    </div>
                    <h5 className="register-form-title">
                        Password
                    </h5>
                    <div className="register-input-wrapper">
                        <i className="fa-solid fa-lock register-input-icon"></i>
                        <input className="register-form-input" name="password" type="password" placeholder=" ********" disabled={loading} required />
                    </div>
                    
                    <h5 className="register-form-title">
                        Phone Number <span style={{fontWeight: 'normal', fontSize: '12px'}}>(Optional)</span>
                    </h5>
                    <div className="register-input-wrapper">
                        <i className="fa-solid fa-phone register-input-icon"></i>
                        <input className="register-form-input" name="phoneNumber" type="tel" placeholder="+1 (555) 000-0000" disabled={loading} />
                    </div>
                    
                    <h5 className="register-form-title">
                        Gender <span style={{fontWeight: 'normal', fontSize: '12px'}}>(Optional)</span>
                    </h5>
                    <div className="register-input-wrapper">
                        <i className="fa-solid fa-venus-mars register-input-icon"></i>
                        <select className="register-form-input" name="gender" disabled={loading}>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    
                    <h5 className="register-form-title">
                        Date of Birth <span style={{fontWeight: 'normal', fontSize: '12px'}}>(Optional)</span>
                    </h5>
                    <div className="register-input-wrapper">
                        <i className="fa-solid fa-calendar register-input-icon"></i>
                        <input className="register-form-input" name="dateOfBirth" type="date" disabled={loading} />
                    </div>
                    
                    <h5 className="register-form-title">
                        Country <span style={{fontWeight: 'normal', fontSize: '12px'}}>(Optional)</span>
                    </h5>
                    <div className="register-input-wrapper">
                        <i className="fa-solid fa-globe register-input-icon"></i>
                        <input className="register-form-input" name="country" type="text" placeholder="Your country" disabled={loading} />
                    </div>
                    
                            <div className="btn">  
                                <button type="submit" disabled={loading}>
                                    {loading ? "Creating Account..." : "Create Account"}
                                </button>
                                </div>

                    </form>
                    <div className="login-2">
                        <p className="login-p"> Already have an account?</p>
                        <Link className="link" to="/Login">
                    Login Here.
                    </Link>
                    </div>
        </div>
        
    </section>
    
        </>            
    );

}
export default Register;

