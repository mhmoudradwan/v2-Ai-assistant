import React, { useState } from "react";
import "../index.css";
import "../components/Navbar"
import "../about.css";
import "../contact.css";
import "../login.css";
import "../forget.css";
import "../register.css";
import { Link, useNavigate } from 'react-router-dom'
import Navbar from "../components/Navbar";
import { authApi } from "../api/authApi";


import icon7 from "../assets/lock.png";



function Forget(){
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem("authToken");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation
        if (!newPassword || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await authApi.changePassword(newPassword);
            setSuccess("Password updated successfully!");
            if (isLoggedIn) {
                // User changed password from profile — keep session, go back to profile
                setTimeout(() => {
                    navigate("/profile");
                }, 2000);
            } else {
                // Forgot-password flow — clear auth data and redirect to login
                localStorage.removeItem("authToken");
                localStorage.removeItem("baseeraUserName");
                localStorage.removeItem("baseeraUserData");
                localStorage.removeItem("userAvatar");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update password. Please try again.");
        }
    };
    return(
        <>
           <Navbar/>
            <section className="login-section">
                <div className="login-box">
                    <div className="login-icon">
                        <img src={icon7} alt="login icon" width={30} height={30} />
                    </div>
                        <div className="login">
                    <div className="login-title">
                        <h1 className="welcome">Reset Your Password</h1>
                        <p className="login-description">
                        Enter and confirm your new password below.
                        </p>
                        </div>
                    {error && (
                        <div style={{
                            color: "#ffffff",
                            textAlign: "center",
                            padding: "8px 10px",
                            backgroundColor: "rgba(211, 47, 47, 0.15)",
                            borderLeft: "3px solid #d32f2f",
                            borderRadius: "4px",
                            fontSize: "13px",
                            boxSizing: "border-box",
                            marginTop: "15px",
                            marginBottom: "0"
                        }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div style={{
                            color: "#adf0b2",
                            textAlign: "center",
                            padding: "8px 10px",
                            backgroundColor: "rgba(76, 175, 80, 0.15)",
                            borderLeft: "3px solid #4caf50",
                            borderRadius: "4px",
                            fontSize: "13px",
                            boxSizing: "border-box",
                            marginTop: "15px",
                            marginBottom: "0"
                        }}>
                            {success}
                        </div>
                    )}
                        <form className="login-form" onSubmit={handleSubmit}>
                    <h5 className="login-form-title">
                        New Password
                    </h5>
                
                    <i className="fa-solid fa-lock one"></i>
                    <input 
                        className="login-form-input" 
                        type="password" 
                        name="newPassword"
                        placeholder=" Enter your new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required 
                    />
                    <h5 className="login-form-title">
                    Confirm New Password
                    </h5>
                
                    <i className="fa-solid fa-lock"></i>
                    <input 
                        className="login-form-input" 
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                    />
                    <button type="submit" className="btn-forget">Save New Password</button>
                      <div className="forget-pass">
                         <Link className="link" to={isLoggedIn ? "/profile" : "/Login"}>
                    {isLoggedIn ? "Back to Profile" : "Back to Login"}
                    </Link>
                       </div>
                </form>
                
                </div>  
                </div>
                </section>    
    
        </>            
    );

}
export default Forget ;

