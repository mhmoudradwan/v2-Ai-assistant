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


import icon7 from "../assets/lock.png";



function Forget(){
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation
        if (!newPassword || !confirmPassword) {
            setError("الرجاء ملء جميع الحقول");
            return;
        }

        if (newPassword.length < 6) {
            setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("كلمات المرور غير متطابقة");
            return;
        }

        // Update password in localStorage
        const storedUserData = localStorage.getItem("baseeraUserData");
        if (storedUserData) {
            const userData = JSON.parse(storedUserData);
            userData.password = newPassword;
            localStorage.setItem("baseeraUserData", JSON.stringify(userData));
        }

        setSuccess("تم تحديث كلمة المرور بنجاح!");
        setTimeout(() => {
            navigate("/login");
        }, 2000);
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
                         <Link className="link" to="/Login">
                    Back to Login
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

