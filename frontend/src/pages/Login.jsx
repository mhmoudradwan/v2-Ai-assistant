import React, { useState } from "react";
import "../index.css";
import "../about.css";
import "../contact.css";
import "../login.css";
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import icon7 from "../assets/lock.png";
import Navbar from "../components/Navbar";

function Login(){
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email || !password) {
            setError("Please fill all fields");
            setLoading(false);
            return;
        }

        if (!email.includes("@")) {
            setError("Invalid email address");
            setLoading(false);
            return;
        }

        try {
            const response = await authApi.login({ email, password });

            if (response.success) {
                localStorage.setItem("authToken", response.data);
                navigate("/landing");
            } else {
                setError(response.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError(error.response?.data?.message || "Invalid email or password");
        } finally {
            setLoading(false);
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
                        <h1 className="welcome">Welcome Back</h1>
                        <p className="login-description">
                            Sign in to your account to continue
                        </p>
                    </div>
                    {error && (
                        <div style={{
                            color: "#ffffff",
                            textAlign: "center",
                            padding: "8px 10px",
                            backgroundColor: "rgba(211, 47, 47, 0.27)",
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

                <form className="login-form" onSubmit={handleSubmit}>
                    <h5 className="login-form-title">
                        Email Address
                    </h5>

                    <i className="fa-solid fa-envelope"></i>
                    <input 
                        className="login-form-input" 
                        type="email" 
                        placeholder=" Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required 
                    />

                    <h5 className="login-form-title">
                        Password
                    </h5>

                    <i className="fa-solid fa-lock"></i>
                    <input 
                        className="login-form-input" 
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required 
                    />

                    <i
                        className="fa-solid fa-eye"
                        onClick={() => setShowPassword((prev) => !prev)}
                        role="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                setShowPassword((prev) => !prev);
                            }
                        }}
                    ></i>
                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="forget">
                    <Link className="link" to="/forget">
                        Forget Password ?
                    </Link>
                </div>

                <div className="register">
                    <p className="register-p">Don't have an account? </p>
                    <Link className="link" to="/register">
                        Register Here.
                    </Link>
                </div>

                </div>
                </div>
            </section>
        </>            
    );
}

export default Login;
