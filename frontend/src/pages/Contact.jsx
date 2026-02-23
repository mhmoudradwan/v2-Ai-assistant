import React, { useState } from "react";
import "../index.css";
import "../contact.css";
import Navbar from "../components/Navbar";
import LandingNavbar from "../components/LandingNavbar";
import Fotter from "../components/Fotter";
import icon2 from "../assets/Mission.png";

function Contact() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: ""
  });
  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowPopup(true);
    setFormData({
      fullName: "",
      email: "",
      subject: "",
      message: ""
    });
  };

  return (
    <>
       <LandingNavbar/>
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <div className="contact-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" 
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="contact-hero-title">
            Contact <span className="highlight">Us</span>
          </h1>
          <p className="contact-hero-subtitle">
            We're here to help. Reach out to us anytime.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-content" id="contact-form">
        <div className="contact-container">
          {/* Left Side - Form */}
          <div className="contact-form-wrapper">
            <div className="contact-form-header">
              <h2 className="form-section-title">Send us a Message</h2>
              <p className="form-section-subtitle">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Subject */}
              <div className="form-group">
                <label className="form-label" htmlFor="subject">
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  className="form-input"
                  placeholder="How can we help you?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Message */}
              <div className="form-group">
                <label className="form-label" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  className="form-textarea"
                  placeholder="Tell us more about your inquiry..."
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Submit Button */}
              <button type="submit" className="submit-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Send Message
              </button>
            </form>
          </div>

          {/* Right Side - Contact Info */}
          <div className="contact-info-wrapper">
            {/* Email */}
            <div className="info-card">
              <div className="info-icon email-icon">
                <i class="fa-solid fa-envelope"></i>
              </div>
              <div className="info-content">
                <h3 className="info-title">Email Address</h3>
                <p className="info-text">0xbaseera@gmail.com</p>
              </div>
            </div>

            {/* Phone */}
            <div className="info-card">
              <div className="info-icon phone-icon">
                <i class="fa-solid fa-phone"></i>
              </div>
              <div className="info-content">
                <h3 className="info-title">Phone Number</h3>
                <p className="info-text">+1 (555) 123-4567</p>
              </div>
            </div>

            {/* Location */}
            <div className="info-card">
              <div className="info-icon location-icon">
                 <i class="fa-solid fa-location-dot"></i>
              </div>
              <div className="info-content">
                <h3 className="info-title">Location</h3>
                <p className="info-text">San Francisco, CA</p>
              </div>
            </div>

            {/* Social Media */}
            <div className="social-card">
              <h3 className="social-title">Connect With Us</h3>
              
              <div className="social-link">
                <div className="social-icon">
                  <img src={icon2} alt="icon" width={24} height={24} />
                </div>
                <div className="social-content">
                  <h4 className="social-name">Facebook</h4>
                  <p className="social-url">https://www.facebook.com/share/1G1woB6zfG/</p>
                </div>
              </div>

              <div className="social-link">
                <div className="social-icon">
                <img src={icon2} alt="icon" width={24} height={24} />
                </div>
                <div className="social-content">
                  <h4 className="social-name">Instagram</h4>
                  <p className="social-url">https://www.instagram.com/0xbaseera?igsh=MzI6dGdr0zU2OW1h</p>
                </div>
              </div>

              <div className="social-link">
                <div className="social-icon">
                 <img src={icon2} alt="icon" width={24} height={24} />
                </div>
                <div className="social-content">
                  <h4 className="social-name">Linked in</h4>
                  <p className="social-url">http://www.linkedin.com/in/0xBaseeraEXT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <div className="map-container">
          <div className="map-placeholder">
            <div className="map-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="map-title">Map View</h3>
            <p className="map-location">San Francisco, CA</p>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="support-section">
        <div className="support-card">
          <h2 className="support-title">Need Immediate Support?</h2>
          <p className="support-text">
            Our support team is available 24/7 to help you with any security concerns or technical
            issues you may encounter.
          </p>
          <a className="support-btn" href="#contact-form">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Get Support
          </a>
        </div>
      </section>

      {/* Footer Component */}
      <Fotter />

      {showPopup && (
        <div className="contact-popup" role="dialog" aria-modal="true">
          <div className="contact-popup-backdrop" onClick={() => setShowPopup(false)} />
          <div className="contact-popup-card">
            <div className="contact-popup-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17L4 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="contact-popup-title">Message Sent</h3>
            <p className="contact-popup-text">
              Your message has been sent successfully. We will get back to you soon.
            </p>
            <button
              type="button"
              className="contact-popup-btn"
              onClick={() => setShowPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Contact;