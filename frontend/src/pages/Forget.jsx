import React, { useState } from "react";
import "../index.css";
import "../login.css";
import "../forget.css";
import { Link, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import { authApi } from "../api/authApi";

import icon7 from "../assets/lock.png";

function Forget() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem("authToken");

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setSuccess("If an account with that email exists, a reset link has been sent.");
        setTimeout(() => {
            setSuccess("");
            setStep(2);
        }, 2000);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

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
                setTimeout(() => navigate("/profile"), 2000);
            } else {
                localStorage.removeItem("authToken");
                localStorage.removeItem("baseeraUserName");
                localStorage.removeItem("baseeraUserData");
                localStorage.removeItem("userAvatar");
                setTimeout(() => navigate("/login"), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update password. Please try again.");
        }
    };

    return (
        <>
            <Navbar />
            <section className="login-section">
                <div className="login-box">
                    <div className="login-icon">
                        <img src={icon7} alt="login icon" width={30} height={30} />
                    </div>
                    <div className="login">
                        {step === 1 ? (
                            <>
                                <div className="login-title">
                                    <h1 className="welcome">Forgot Password?</h1>
                                    <p className="login-description">
                                        Enter your registered email address and we&apos;ll send you a reset link.
                                    </p>
                                </div>
                                {error && <div className="form-error-msg">{error}</div>}
                                {success && <div className="form-success-msg">{success}</div>}
                                <form className="login-form" onSubmit={handleEmailSubmit}>
                                    <h5 className="login-form-title">Email Address</h5>
                                    <div className="forget-input-wrapper">
                                        <i className="fa-solid fa-envelope forget-input-icon"></i>
                                        <input
                                            className="login-form-input"
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-forget-primary">Send Reset Link</button>
                                    <div className="forget-pass">
                                        <Link className="link" to={isLoggedIn ? "/profile" : "/Login"}>
                                            {isLoggedIn ? "Back to Profile" : "Back to Login"}
                                        </Link>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <>
                                <div className="login-title">
                                    <h1 className="welcome">Reset Your Password</h1>
                                    <p className="login-description">
                                        Enter and confirm your new password below.
                                    </p>
                                </div>
                                {error && <div className="form-error-msg">{error}</div>}
                                {success && <div className="form-success-msg">{success}</div>}
                                <form className="login-form" onSubmit={handlePasswordSubmit}>
                                    <h5 className="login-form-title">New Password</h5>
                                    <div className="forget-input-wrapper">
                                        <i className="fa-solid fa-lock forget-input-icon"></i>
                                        <input
                                            className="login-form-input"
                                            type="password"
                                            name="newPassword"
                                            placeholder="Enter your new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <h5 className="login-form-title">Confirm New Password</h5>
                                    <div className="forget-input-wrapper">
                                        <i className="fa-solid fa-lock forget-input-icon"></i>
                                        <input
                                            className="login-form-input"
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="Confirm your new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-forget-primary">Reset Password</button>
                                    <div className="forget-pass">
                                        <Link className="link" to={isLoggedIn ? "/profile" : "/Login"}>
                                            {isLoggedIn ? "Back to Profile" : "Back to Login"}
                                        </Link>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

export default Forget;

