import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "../components/LandingNavbar";
import "../EditProfile.css";
import { authApi } from "../api/authApi";

const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2390a1b9'%3E%3Cpath d='M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z'/%3E%3C/svg%3E";

function EditProfile() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    gender: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    bio: "",
    avatar: localStorage.getItem("userAvatar") || PLACEHOLDER_AVATAR,
  });

  const [avatarPreview, setAvatarPreview] = useState(localStorage.getItem("userAvatar") || PLACEHOLDER_AVATAR);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Load user data from API on mount
  useEffect(() => {
    authApi.getProfile()
      .then(res => {
        if (res.success && res.data) {
          const d = res.data;
          const apiAvatar = d.profileImageUrl || localStorage.getItem("userAvatar") || PLACEHOLDER_AVATAR;
          if (d.profileImageUrl) {
            localStorage.setItem("userAvatar", d.profileImageUrl);
          }
          setAvatarPreview(apiAvatar);
          setFormData(prev => ({
            ...prev,
            avatar: apiAvatar,
            fullName: `${d.firstName || ''} ${d.lastName || ''}`.trim(),
            username: d.username || '',
            email: d.email || '',
            phone: d.phoneNumber || '',
            country: d.country || '',
            bio: d.bio || '',
            gender: d.gender ? d.gender.toLowerCase() : '',
            dateOfBirth: d.dateOfBirth ? (typeof d.dateOfBirth === 'string' ? d.dateOfBirth.substring(0, 10) : new Date(d.dateOfBirth).toISOString().substring(0, 10)) : ''
          }));
        }
      })
      .catch(() => {
        // Fallback to localStorage
        const storedAvatar = localStorage.getItem("userAvatar");
        if (storedAvatar) setAvatarPreview(storedAvatar);
        const storedUserData = localStorage.getItem("baseeraUserData");
        if (storedUserData) {
          try {
            const parsed = JSON.parse(storedUserData);
            setFormData(prev => ({
              ...prev,
              fullName: `${parsed.fullName || ''} ${parsed.lastName || ''}`.trim() || prev.fullName,
              username: parsed.username || prev.username,
              email: parsed.email || prev.email,
              phone: parsed.phone || prev.phone,
              country: parsed.country || prev.country,
              bio: parsed.bio || prev.bio,
              gender: parsed.gender || prev.gender,
              dateOfBirth: parsed.dateOfBirth || prev.dateOfBirth
            }));
          } catch (error) {
            console.log("Error loading user data:", error);
          }
        }
      });
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        // Save to localStorage immediately
        localStorage.setItem("userAvatar", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");
    
    // Save avatar to localStorage if changed
    if (avatarPreview !== formData.avatar) {
      localStorage.setItem("userAvatar", avatarPreview);
    }
    
    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const storedOrDefaultAvatar = localStorage.getItem("userAvatar") || PLACEHOLDER_AVATAR;
      const response = await authApi.updateProfile({
        firstName,
        lastName,
        phoneNumber: formData.phone || null,
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        country: formData.country || null,
        bio: formData.bio || null,
        profileImageUrl: avatarPreview !== storedOrDefaultAvatar ? avatarPreview : undefined
      });

      if (response.success) {
        setSaveSuccess("Profile updated successfully!");
        setTimeout(() => navigate('/profile'), 1200);
      } else {
        setSaveError(response.message || "Failed to update profile");
      }
    } catch (err) {
      // Fallback: save to localStorage
      const userData = JSON.parse(localStorage.getItem("baseeraUserData") || '{}');
      const updatedData = {
        ...userData,
        fullName: firstName,
        lastName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        bio: formData.bio,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth
      };
      localStorage.setItem("baseeraUserData", JSON.stringify(updatedData));
      navigate('/profile');
    }
  };

  return (
    <>
      <LandingNavbar />

      <div className="edit-profile-container">
        {/* Form */}
        <form className="edit-profile-form" onSubmit={handleSubmit}>
          {saveError && <div style={{color: "#ffffff", padding: "8px 10px", backgroundColor: "rgba(211, 47, 47, 0.15)", borderLeft: "3px solid #d32f2f", borderRadius: "4px", fontSize: "13px", marginBottom: "16px"}}>{saveError}</div>}
          {saveSuccess && <div style={{color: "rgb(197, 244, 201)", padding: "8px 10px", backgroundColor: "rgba(76, 175, 80, 0.15)", borderLeft: "3px solid #4caf50", borderRadius: "4px", fontSize: "13px", marginBottom: "16px"}}>{saveSuccess}</div>}
          {/* Avatar Upload */}
          <div className="avatar-upload-section">
            <div className="avatar-upload-wrapper">
              <img  src={avatarPreview} alt="Profile" className="avatar-preview" />
              <label htmlFor="avatar-input" className="avatar-upload-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.3333 5.33333L8 2L4.66667 5.33333" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V10" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </label>
              <input 
                type="file" 
                id="avatar-input" 
                accept="image/*"
                onChange={handleAvatarChange}
                style={{display: 'none'}}
              />
            </div>
            <p className="avatar-upload-text">Upload Profile Picture</p>
          </div>

          {/* Personal Information */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon personal-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.6667 17.5V15.8333C16.6667 14.9493 16.3155 14.1014 15.6904 13.4763C15.0652 12.8512 14.2174 12.5 13.3333 12.5H6.66667C5.78261 12.5 4.93476 12.8512 4.30964 13.4763C3.68452 14.1014 3.33333 14.9493 3.33333 15.8333V17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.99999 9.16667C11.8409 9.16667 13.3333 7.67428 13.3333 5.83333C13.3333 3.99238 11.8409 2.5 9.99999 2.5C8.15904 2.5 6.66666 3.99238 6.66666 5.83333C6.66666 7.67428 8.15904 9.16667 9.99999 9.16667Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Personal Information</h3>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Full Name <span className="required">*</span></label>
                <div className="input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 14V12.6667C13.3333 11.9594 13.0524 11.2811 12.5523 10.781C12.0522 10.281 11.3739 10 10.6667 10H5.33333C4.62609 10 3.94781 10.281 3.44772 10.781C2.94762 11.2811 2.66667 11.9594 2.66667 12.6667V14" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 7.33333C9.47276 7.33333 10.6667 6.13943 10.6667 4.66667C10.6667 3.19391 9.47276 2 8 2C6.52724 2 5.33333 3.19391 5.33333 4.66667C5.33333 6.13943 6.52724 7.33333 8 7.33333Z" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Username <span className="required">*</span></label>
                <div className="input-wrapper">
               <h5>@</h5>
                  <input 
                    type="text" 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Gender <span className="required">*</span></label>
                <div className="input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="10" r="3.33333" stroke="#90A1B9" strokeWidth="1.33333"/>
                    <path d="M13.3333 2.66667L9.33333 6.66667M13.3333 2.66667V5.33333M13.3333 2.66667H10.6667" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date of Birth <span className="required">*</span></label>
                <div className="input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="3.33333" width="12" height="10.6667" rx="1.33333" stroke="#90A1B9" strokeWidth="1.33333"/>
                    <path d="M10.6667 2V4.66667" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round"/>
                    <path d="M5.33333 2V4.66667" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round"/>
                    <path d="M2 6.66667H14" stroke="#90A1B9" strokeWidth="1.33333"/>
                  </svg>
                  <input 
                    type="date" 
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon contact-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.33301 3.33331H16.6663C17.583 3.33331 18.333 4.08331 18.333 4.99998V15C18.333 15.9166 17.583 16.6666 16.6663 16.6666H3.33301C2.41634 16.6666 1.66634 15.9166 1.66634 15V4.99998C1.66634 4.08331 2.41634 3.33331 3.33301 3.33331Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.333 5L9.99967 10.8333L1.66634 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Contact Information</h3>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Email Address <span className="required">*</span></label>
                <div className="input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.66667 2.66669H13.3333C14 2.66669 14.6667 3.33335 14.6667 4.00002V12C14.6667 12.6667 14 13.3334 13.3333 13.3334H2.66667C2 13.3334 1.33333 12.6667 1.33333 12V4.00002C1.33333 3.33335 2 2.66669 2.66667 2.66669Z" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.6667 4L8 8.66667L1.33333 4" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number <span className="required">*</span></label>
                <div className="input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.6667 11.28V13.28C14.6675 13.4657 14.6292 13.6494 14.5543 13.8195C14.4793 13.9897 14.3694 14.1424 14.2316 14.2679C14.0937 14.3934 13.9308 14.4889 13.7538 14.5485C13.5768 14.6081 13.3897 14.6308 13.2033 14.6153C11.1429 14.3904 9.16636 13.6584 7.42667 12.4767C5.8157 11.4113 4.46515 9.99357 3.48 8.32C2.29782 6.568 1.56736 4.57667 1.34667 2.50001C1.33117 2.31427 1.3537 2.12765 1.41295 1.95113C1.4722 1.77461 1.56713 1.61206 1.69209 1.47439C1.81705 1.33672 1.96901 1.22662 2.13838 1.15124C2.30775 1.07586 2.49081 1.03684 2.67667 1.03668H4.67667C5.00435 1.03342 5.32136 1.14708 5.57144 1.35716C5.82152 1.56725 5.98612 1.85962 6.03667 2.18001C6.13065 2.82001 6.29659 3.44811 6.53333 4.05334C6.62476 4.29175 6.64543 4.55155 6.59283 4.80096C6.54022 5.05036 6.41664 5.27874 6.23667 5.46001L5.39333 6.30334C6.39446 7.97647 7.82687 9.40888 9.5 10.41L10.3433 9.56668C10.5246 9.38671 10.753 9.26312 11.0024 9.21052C11.2518 9.15792 11.5116 9.17858 11.75 9.27001C12.3552 9.50675 12.9833 9.6727 13.6233 9.76668C13.9475 9.81756 14.2432 9.98535 14.4539 10.2399C14.6646 10.4945 14.7760 10.8172 14.7667 11.1467V11.28Z" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon location-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.5 8.33333C17.5 14.1667 10 19.1667 10 19.1667C10 19.1667 2.5 14.1667 2.5 8.33333C2.5 6.34420 3.29018 4.43655 4.6967 3.03141C6.10322 1.62589 8.01088 0.833328 10 0.833328C11.9891 0.833328 13.8968 1.62589 15.3033 3.03141C16.7098 4.43655 17.5 6.34420 17.5 8.33333Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 10.8333C11.3807 10.8333 12.5 9.71405 12.5 8.33333C12.5 6.95262 11.3807 5.83333 10 5.83333C8.61929 5.83333 7.5 6.95262 7.5 8.33333C7.5 9.71405 8.61929 10.8333 10 10.8333Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Location</h3>
            </div>

            <div className="form-group">
              <label>Country <span className="required">*</span></label>
              <div className="input-wrapper">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="6" stroke="#90A1B9" strokeWidth="1.33333"/>
                  <path d="M2 8H14" stroke="#90A1B9" strokeWidth="1.33333"/>
                  <path d="M8 2C9.5 3.5 10.5 5.5 10.5 8C10.5 10.5 9.5 12.5 8 14C6.5 12.5 5.5 10.5 5.5 8C5.5 5.5 6.5 3.5 8 2Z" stroke="#90A1B9" strokeWidth="1.33333"/>
                </svg>
                <input 
                  type="text" 
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter your country"
                  required
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon security-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4.16667" y="8.33333" width="11.6667" height="9.16667" rx="1.66667" stroke="white" strokeWidth="1.5"/>
                  <path d="M6.66667 8.33333V5.83333C6.66667 4.72826 7.10565 3.66846 7.88705 2.88706C8.66845 2.10565 9.72826 1.66667 10.8333 1.66667C11.9384 1.66667 12.9982 2.10565 13.7796 2.88706C14.561 3.66846 15 4.72826 15 5.83333V8.33333" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="12.5" r="1.25" fill="white"/>
                </svg>
              </div>
              <h3>Security</h3>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3.33333" y="6.66667" width="9.33333" height="7.33333" rx="1.33333" stroke="#90A1B9" strokeWidth="1.33333"/>
                    <path d="M5.33333 6.66667V4.66667C5.33333 3.78261 5.68452 2.93477 6.30964 2.30964C6.93477 1.68452 7.78261 1.33333 8.66667 1.33333C9.55072 1.33333 10.3986 1.68452 11.0237 2.30964C11.6488 2.93477 12 3.78261 12 4.66667V6.66667" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round"/>
                  </svg>
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.71859 10.2901C1.64914 10.103 1.64914 9.89715 1.71859 9.71006C2.39501 8.06993 3.54319 6.66759 5.01757 5.6808C6.49195 4.69402 8.22613 4.16724 10.0003 4.16724C11.7744 4.16724 13.5086 4.69402 14.9829 5.6808C16.4573 6.66759 17.6055 8.06993 18.2819 9.71006C18.3514 9.89715 18.3514 10.103 18.2819 10.2901C17.6055 11.9302 16.4573 13.3325 14.9829 14.3193C13.5086 15.3061 11.7744 15.8329 10.0003 15.8329C8.22613 15.8329 6.49195 15.3061 5.01757 14.3193C3.54319 13.3325 2.39501 11.9302 1.71859 10.2901Z" stroke="#90A1B9" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#90A1B9" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3.33333" y="6.66667" width="9.33333" height="7.33333" rx="1.33333" stroke="#90A1B9" strokeWidth="1.33333"/>
                    <path d="M5.33333 6.66667V4.66667C5.33333 3.78261 5.68452 2.93477 6.30964 2.30964C6.93477 1.68452 7.78261 1.33333 8.66667 1.33333C9.55072 1.33333 10.3986 1.68452 11.0237 2.30964C11.6488 2.93477 12 3.78261 12 4.66667V6.66667" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round"/>
                  </svg>
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.71859 10.2901C1.64914 10.103 1.64914 9.89715 1.71859 9.71006C2.39501 8.06993 3.54319 6.66759 5.01757 5.6808C6.49195 4.69402 8.22613 4.16724 10.0003 4.16724C11.7744 4.16724 13.5086 4.69402 14.9829 5.6808C16.4573 6.66759 17.6055 8.06993 18.2819 9.71006C18.3514 9.89715 18.3514 10.103 18.2819 10.2901C17.6055 11.9302 16.4573 13.3325 14.9829 14.3193C13.5086 15.3061 11.7744 15.8329 10.0003 15.8329C8.22613 15.8329 6.49195 15.3061 5.01757 14.3193C3.54319 13.3325 2.39501 11.9302 1.71859 10.2901Z" stroke="#90A1B9" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#90A1B9" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* About You */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon about-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13.3333V10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 6.66667H10.0083" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>About You</h3>
            </div>

            <div className="form-group">
              <label>Short Bio <span className="optional">(Optional)</span></label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us a little about yourself..."
                maxLength={500}
                rows={5}
              ></textarea>
              <div className="char-count">{formData.bio.length} / 500</div>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Save Changes
          </button>
        </form>
      </div>
    </>
  );
}

export default EditProfile;