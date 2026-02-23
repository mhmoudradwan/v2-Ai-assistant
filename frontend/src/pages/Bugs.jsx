import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import LandingNavbar from "../components/LandingNavbar";
import "../index.css";
import "../bugs.css";
import icon1 from "../assets/lock.png";
import icon2 from "../assets/circle-score.png";
import icon3 from "../assets/calander.png";
import apiClient from "../api/axios.config";

function Bugs() {
  const [activeTab, setActiveTab] = useState('overview');
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Derived stats from scans
  const totalCritical = scans.reduce((sum, s) => sum + (s.criticalCount || 0), 0);
  const totalHigh = scans.reduce((sum, s) => sum + (s.highCount || 0), 0);
  const totalMedium = scans.reduce((sum, s) => sum + (s.mediumCount || 0), 0);
  const totalLow = scans.reduce((sum, s) => sum + (s.lowCount || 0), 0);
  const totalVulns = scans.reduce((sum, s) => sum + (s.totalVulns || 0), 0);

  // Filtered scans for display
  const filteredScans = scans.filter(s => {
    const matchesSearch = !searchQuery || s.targetURL?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' ||
      (severityFilter === 'critical' && s.criticalCount > 0) ||
      (severityFilter === 'high' && s.highCount > 0) ||
      (severityFilter === 'medium' && s.mediumCount > 0) ||
      (severityFilter === 'low' && s.lowCount > 0);
    return matchesSearch && matchesSeverity;
  });

  useEffect(() => {
    apiClient.get('/scans')
      .then(res => {
        if (res.success && res.data) {
          setScans(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => setScans([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <LandingNavbar />

      <div className="bugs-sec">
        {/* LEFT SIDE */}
        <div className="bugs">
          <div className="bugs-icon">
            <img src={icon1} alt="security icon" width={28} height={28} />
          </div>

          <div className="bugs-text">
            <h2>Security Command Center</h2>
            <p>Real-time vulnerability monitoring and threat analysis</p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="bugs-actions">
          <div className="risk-box">
            <span className="risk-title">Risk Score</span>

            <div className="risk-row">
              <h3 className="risk-number">{totalVulns > 0 ? Math.min(100, totalCritical * 25 + totalHigh * 15 + totalMedium * 8 + totalLow * 3) : 0}</h3>

              <div className="row-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.6665 11.3334H14.6665V7.33337" stroke="#00D492" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.6668 11.3333L9.00016 5.66663L5.66683 8.99996L1.3335 4.66663" stroke="#00D492" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="risk-change">{totalVulns > 0 ? "12%" : "—"}</span>
              </div>
            </div>
          </div>

          <button className="export-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 10V2" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.6665 6.66663L7.99984 9.99996L11.3332 6.66663" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h4>Export Report</h4>
          </button>

          <button className="scan-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_191_1490)">
                <path d="M2.6665 9.33328C2.54034 9.33371 2.41665 9.29833 2.3098 9.23126C2.20295 9.1642 2.11732 9.06818 2.06287 8.95438C2.00841 8.84059 1.98736 8.71367 2.00217 8.58838C2.01697 8.4631 2.06702 8.34459 2.1465 8.24661L8.7465 1.44661C8.79601 1.38947 8.86347 1.35085 8.93782 1.3371C9.01217 1.32335 9.08898 1.33529 9.15565 1.37095C9.22232 1.40661 9.27489 1.46388 9.30472 1.53335C9.33456 1.60283 9.33988 1.68038 9.31983 1.75328L8.03983 5.76661C8.00209 5.86763 7.98941 5.97629 8.00289 6.08328C8.01637 6.19028 8.05561 6.2924 8.11723 6.3809C8.17885 6.46939 8.26101 6.54162 8.35668 6.59139C8.45235 6.64115 8.55866 6.66696 8.6665 6.66661H13.3332C13.4593 6.66618 13.583 6.70156 13.6899 6.76863C13.7967 6.8357 13.8823 6.93171 13.9368 7.04551C13.9913 7.15931 14.0123 7.28622 13.9975 7.41151C13.9827 7.53679 13.9326 7.65531 13.8532 7.75328L7.25317 14.5533C7.20366 14.6104 7.13619 14.649 7.06184 14.6628C6.9875 14.6765 6.91068 14.6646 6.84401 14.6289C6.77734 14.5933 6.72478 14.536 6.69494 14.4665C6.66511 14.3971 6.65978 14.3195 6.67983 14.2466L7.95983 10.2333C7.99758 10.1323 8.01025 10.0236 7.99677 9.91661C7.98329 9.80962 7.94406 9.70749 7.88244 9.619C7.82082 9.5305 7.73865 9.45827 7.64298 9.40851C7.54731 9.35874 7.441 9.33293 7.33317 9.33328H2.6665Z" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            <h4>Run Scan</h4>
          </button>
        </div>
      </div>

      {/* CARDS SECTION */}
      <div className="bugs-cards">
        <div className="card-High">
          <div className="high-info">
            <div className="high-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16H12.01" stroke="#FF6467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="#FF6467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.312 2C15.8424 2.00011 16.351 2.2109 16.726 2.586L21.414 7.274C21.7891 7.64899 21.9999 8.15761 22 8.688V15.312C21.9999 15.8424 21.7891 16.351 21.414 16.726L16.726 21.414C16.351 21.7891 15.8424 21.9999 15.312 22H8.688C8.15761 21.9999 7.64899 21.7891 7.274 21.414L2.586 16.726C2.2109 16.351 2.00011 15.8424 2 15.312V8.688C2.00011 8.15761 2.2109 7.64899 2.586 7.274L7.274 2.586C7.64899 2.2109 8.15761 2.00011 8.688 2H15.312Z" stroke="#FF6467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4>High Priority</h4>
          </div>
          <div className="num">
            <h1>{totalCritical}</h1>
          </div>
          <div className="info">
            <h4>Critical Threats</h4>
          </div>
          <div className="high-img">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_191_1512)">
                <path d="M8 3.5H11V6.5" stroke="#FF6467" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 3.5L6.75 7.75L4.25 5.25L1 8.5" stroke="#FF6467" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            <h4>{totalCritical > 0 ? "+2 this week" : "No data"}</h4>
          </div>
        </div>

        <div className="card-Urgent">
          <div className="urgent-info">
            <div className="urgent-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.7299 18L13.7299 3.99998C13.5555 3.69218 13.3025 3.43617 12.9969 3.25805C12.6912 3.07993 12.3437 2.98608 11.9899 2.98608C11.6361 2.98608 11.2887 3.07993 10.983 3.25805C10.6773 3.43617 10.4244 3.69218 10.2499 3.99998L2.24993 18C2.07361 18.3053 1.98116 18.6519 1.98194 19.0045C1.98272 19.3571 2.07671 19.7032 2.25438 20.0078C2.43204 20.3124 2.68708 20.5646 2.99362 20.7388C3.30017 20.9131 3.64734 21.0032 3.99993 21H19.9999C20.3508 20.9996 20.6955 20.9069 20.9992 20.7313C21.303 20.5556 21.5551 20.3031 21.7304 19.9991C21.9057 19.6951 21.998 19.3504 21.9979 18.9995C21.9978 18.6486 21.9054 18.3039 21.7299 18Z" stroke="#FF8904" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 9V13" stroke="#FF8904" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17H12.01" stroke="#FF8904" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4>Urgent</h4>
          </div>
          <div className="num">
            <h1>{totalHigh}</h1>
          </div>
          <div className="info">
            <h4>High Severity</h4>
          </div>
          <div className="urgent-img">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_191_1913)">
                <path d="M6 3V6L8 7" stroke="#FF8904" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#FF8904" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            <h4>{totalHigh > 0 ? "Avg. 3 days old" : "No data"}</h4>
          </div>
        </div>

        <div className="card-In-Progress">
          <div className="In-Progress-info">
            <div className="In-Progress-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#00D3F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="#00D3F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16H12.01" stroke="#00D3F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4>In Progress</h4>
          </div>
          <div className="num">
            <h1>{totalMedium}</h1>
          </div>
          <div className="info">
            <h4>Active Issues</h4>
          </div>
          <div className="In-Progress-img">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_191_1935)">
                <path d="M8 10.5V9.5C8 8.96957 7.78929 8.46086 7.41421 8.08579C7.03914 7.71071 6.53043 7.5 6 7.5H3C2.46957 7.5 1.96086 7.71071 1.58579 8.08579C1.21071 8.46086 1 8.96957 1 9.5V10.5" stroke="#00D3F2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 1.56396C8.42888 1.67515 8.8087 1.9256 9.07984 2.276C9.35098 2.6264 9.4981 3.05691 9.4981 3.49996C9.4981 3.94302 9.35098 4.37353 9.07984 4.72393C8.8087 5.07433 8.42888 5.32478 8 5.43596" stroke="#00D3F2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 10.4999V9.49994C10.9997 9.05681 10.8522 8.62633 10.5807 8.2761C10.3092 7.92587 9.92906 7.67573 9.5 7.56494" stroke="#00D3F2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.5 5.5C5.60457 5.5 6.5 4.60457 6.5 3.5C6.5 2.39543 5.60457 1.5 4.5 1.5C3.39543 1.5 2.5 2.39543 2.5 3.5C2.5 4.60457 3.39543 5.5 4.5 5.5Z" stroke="#00D3F2" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            <h4>{totalMedium > 0 ? "3 teams assigned" : "No data"}</h4>
          </div>
        </div>

        <div className="card-Completed">
          <div className="Completed-info">
            <div className="Completed-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.8011 9.99999C22.2578 12.2413 21.9323 14.5714 20.879 16.6018C19.8256 18.6322 18.108 20.24 16.0126 21.1573C13.9172 22.0746 11.5707 22.2458 9.3644 21.6424C7.15807 21.0389 5.22529 19.6974 3.88838 17.8414C2.55146 15.9854 1.89122 13.7272 2.01776 11.4434C2.14431 9.15952 3.04998 6.98808 4.58375 5.29116C6.11752 3.59424 8.18668 2.47442 10.4462 2.11844C12.7056 1.76247 15.0189 2.19185 17.0001 3.33499" stroke="#00D492" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11L12 14L22 4" stroke="#00D492" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4>Completed</h4>
          </div>
          <div className="num">
            <h1>{scans.filter(s => s.status === 'Completed').length}</h1>
          </div>
          <div className="info">
            <h4>Resolved This Week</h4>
          </div>
          <div className="Completed-img">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_191_1958)">
                <path d="M8 8.5H11V5.5" stroke="#00D492" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 8.5L6.75 4.25L4.25 6.75L1 3.5" stroke="#00D492" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            <h4>{scans.filter(s => s.status === 'Completed').length > 0 ? "-15% vs last week" : "No data"}</h4>
          </div>
        </div>
      </div>

      {/* TABS SECTION */}
      <section className="DashboardPageAlt">
        <div className="button">
          <div className={activeTab === 'overview' ? "Primitive-button" : "non-Primitive-button"}>
            <button onClick={() => setActiveTab('overview')}>
              <div className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H14" stroke={activeTab === 'overview' ? "white" : "#90A1B9"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11.3333V6" stroke={activeTab === 'overview' ? "white" : "#90A1B9"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.6665 11.3334V3.33337" stroke={activeTab === 'overview' ? "white" : "#90A1B9"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.3335 11.3334V9.33337" stroke={activeTab === 'overview' ? "white" : "#90A1B9"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              Overview
            </button>
          </div>

          <div className={activeTab === 'vulnerabilities' ? "Primitive-button" : "non-Primitive-button"}>
            <button onClick={() => setActiveTab('vulnerabilities')}>
              <div className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_191_1595)">
                    <path d="M14.4866 12L9.15329 2.66665C9.037 2.46146 8.86836 2.29078 8.66457 2.17203C8.46078 2.05329 8.22915 1.99072 7.99329 1.99072C7.75743 1.99072 7.52579 2.05329 7.322 2.17203C7.11822 2.29078 6.94958 2.46146 6.83329 2.66665L1.49995 12C1.38241 12.2036 1.32077 12.4346 1.32129 12.6697C1.32181 12.9047 1.38447 13.1355 1.50292 13.3385C1.62136 13.5416 1.79138 13.7097 1.99575 13.8259C2.20011 13.942 2.43156 14.0021 2.66662 14H13.3333C13.5672 13.9997 13.797 13.938 13.9995 13.8208C14.202 13.7037 14.3701 13.5354 14.487 13.3327C14.6038 13.1301 14.6653 12.9002 14.6653 12.6663C14.6652 12.4324 14.6036 12.2026 14.4866 12Z" stroke={activeTab === 'vulnerabilities' ? "white" : "#90A1B9"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6V8.66667" stroke={activeTab === 'vulnerabilities' ? "white" : "#90A1B9"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 11.3334H8.00667" stroke={activeTab === 'vulnerabilities' ? "white" : "#90A1B9"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </svg>
              </div>
              Vulnerabilities
            </button>
          </div>

          <div className={activeTab === 'analytics' ? "Primitive-button" : "non-Primitive-button"}>
            <button onClick={() => setActiveTab('analytics')}>
              <div className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_191_1601)">
                    <path d="M14.0002 8.00007C14.3682 8.00007 14.6702 7.70074 14.6335 7.33474C14.4798 5.80418 13.8016 4.37387 12.7137 3.28628C11.6259 2.1987 10.1954 1.52076 8.66485 1.3674C8.29818 1.33074 7.99951 1.63274 7.99951 2.00074V7.33407C7.99951 7.51088 8.06975 7.68045 8.19477 7.80547C8.3198 7.9305 8.48937 8.00074 8.66618 8.00074L14.0002 8.00007Z" stroke={activeTab === 'analytics' ? "white" : "#90A1B9"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.1399 10.5933C13.7158 11.5963 13.0525 12.4801 12.2079 13.1675C11.3633 13.8549 10.3631 14.3249 9.2949 14.5365C8.22668 14.748 7.12289 14.6947 6.08004 14.3811C5.03719 14.0676 4.08703 13.5033 3.31262 12.7377C2.53822 11.9721 1.96315 11.0284 1.6377 9.98923C1.31225 8.95003 1.24632 7.84692 1.44568 6.77635C1.64503 5.70578 2.10361 4.70035 2.78131 3.84795C3.45901 2.99555 4.3352 2.32214 5.33328 1.8866" stroke={activeTab === 'analytics' ? "white" : "#90A1B9"} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </svg>
              </div>
              Analytics
            </button>
          </div>
        </div>
      </section>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="Vulnerability">
          {scans.length === 0 && !loading && (
            <div style={{textAlign: 'center', padding: '40px', color: '#64748b', width: '100%'}}>
              No scans yet. Install the Baseera extension and scan your first website to see vulnerability data here.
            </div>
          )}
          {(scans.length > 0 || loading) && (
          <>
          <div className="Container-right">
            <div className="container-headline">
              <div className="heading">
                <div className="container-icon">
                  <img src={icon3} alt="security icon" width={20} height={20} />
                  <div className="container-text">
                    <h4>Threat Timeline</h4>
                  </div>
                </div>
              </div>
              <div className="container-last">
                <h4>Last 7 days</h4>
                <div className="arrow-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12L10 8L6 4" stroke="#90A1B9" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bug-table">
              {/* Bug 1 */}
              <div className="bug-1">
                <div className="bug-line">
                  <div className="head-line"></div>
                  <div className="line"></div>
                </div>
                <div className="bug-box">
                  <div className="bug-contact">
                    <div className="Badge">
                      <h4>Critical</h4>
                    </div>
                    <div className="date">
                      <h4>• 2024-12-20</h4>
                    </div>
                  </div>
                  <div className="bug-name">
                    <h4>SQL Injection in Login Form</h4>
                  </div>
                  <div className="bug-web">
                    <div className="web-icon">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_191_1637)">
                          <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 1C4.71612 2.34808 4 4.13837 4 6C4 7.86163 4.71612 9.65192 6 11C7.28388 9.65192 8 7.86163 8 6C8 4.13837 7.28388 2.34808 6 1Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1 6H11" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                      </svg>
                    </div>
                    <div className="web">
                      <h4>auth.example.com</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bug 2 */}
              <div className="bug-1">
                <div className="bug-line">
                  <div className="head-line-1"></div>
                  <div className="line"></div>
                </div>
                <div className="bug-box">
                  <div className="bug-contact">
                    <div className="Badge-1">
                      <h4>High</h4>
                    </div>
                    <div className="date">
                      <h4>• 2024-12-19</h4>
                    </div>
                  </div>
                  <div className="bug-name">
                    <h4>Cross-Site Scripting (XSS)</h4>
                  </div>
                  <div className="bug-web">
                    <div className="web-icon">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_191_1637)">
                          <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 1C4.71612 2.34808 4 4.13837 4 6C4 7.86163 4.71612 9.65192 6 11C7.28388 9.65192 8 7.86163 8 6C8 4.13837 7.28388 2.34808 6 1Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1 6H11" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                      </svg>
                    </div>
                    <div className="web">
                      <h4>app.example.com</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bug 3 */}
              <div className="bug-1">
                <div className="bug-line">
                  <div className="head-line-2"></div>
                  <div className="line"></div>
                </div>
                <div className="bug-box">
                  <div className="bug-contact">
                    <div className="Badge-2">
                      <h4>Medium</h4>
                    </div>
                    <div className="date">
                      <h4>• 2024-12-18</h4>
                    </div>
                  </div>
                  <div className="bug-name">
                    <h4>Outdated SSL Certificate</h4>
                  </div>
                  <div className="bug-web">
                    <div className="web-icon">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_191_1637)">
                          <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 1C4.71612 2.34808 4 4.13837 4 6C4 7.86163 4.71612 9.65192 6 11C7.28388 9.65192 8 7.86163 8 6C8 4.13837 7.28388 2.34808 6 1Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1 6H11" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                      </svg>
                    </div>
                    <div className="web">
                      <h4>api.example.com</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bug 4 */}
              <div className="bug-1">
                <div className="bug-line">
                  <div className="head-line-2"></div>
                  <div className="line"></div>
                </div>
                <div className="bug-box">
                  <div className="bug-contact">
                    <div className="Badge-2">
                      <h4>Low</h4>
                    </div>
                    <div className="date">
                      <h4>• 2024-12-17</h4>
                    </div>
                  </div>
                  <div className="bug-name">
                    <h4>Missing Security Headers</h4>
                  </div>
                  <div className="bug-web">
                    <div className="web-icon">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_191_1637)">
                          <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 1C4.71612 2.34808 4 4.13837 4 6C4 7.86163 4.71612 9.65192 6 11C7.28388 9.65192 8 7.86163 8 6C8 4.13837 7.28388 2.34808 6 1Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1 6H11" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                      </svg>
                    </div>
                    <div className="web">
                      <h4>cdn.example.com</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bug 5 */}
              <div className="bug-1">
                <div className="bug-line">
                  <div className="head-line-2"></div>
                  <div className="line"></div>
                </div>
                <div className="bug-box">
                  <div className="bug-contact">
                    <div className="Badge-2">
                      <h4>Medium</h4>
                    </div>
                    <div className="date">
                      <h4>• 2024-12-16</h4>
                    </div>
                  </div>
                  <div className="bug-name">
                    <h4>Weak Password Policy</h4>
                  </div>
                  <div className="bug-web">
                    <div className="web-icon">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_191_1637)">
                          <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 1C4.71612 2.34808 4 4.13837 4 6C4 7.86163 4.71612 9.65192 6 11C7.28388 9.65192 8 7.86163 8 6C8 4.13837 7.28388 2.34808 6 1Z" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1 6H11" stroke="#90A1B9" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                      </svg>
                    </div>
                    <div className="web">
                      <h4>auth.example.com</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="Container-left">
            <div className="score-box">
              <h4>Security Score</h4>
              <div className="circle-score">
                <img src={icon2} alt="circle-score" width={128} height={128}/>
                <div className="score-info">
                  <h4>74</h4>
                  <h5>/100</h5>
                </div>
              </div>
              <div className="score-footer">
                <h4>Good security posture</h4>
              </div>
            </div>

            <div className="top-vulnerability-box">
              <h4>Top Vulnerability Types</h4>
              
              <div className="vulnerability-list">
                <div className="vulnerability-item">
                  <div className="vulnerability-header">
                    <span className="vulnerability-name">Injection</span>
                    <span className="vulnerability-count">2</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill progress-red"></div>
                    <div className="progress-bar-bg"></div>
                  </div>
                </div>

                <div className="vulnerability-item">
                  <div className="vulnerability-header">
                    <span className="vulnerability-name">XSS</span>
                    <span className="vulnerability-count">2</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill progress-orange"></div>
                    <div className="progress-bar-bg"></div>
                  </div>
                </div>

                <div className="vulnerability-item">
                  <div className="vulnerability-header">
                    <span className="vulnerability-name">Configuration</span>
                    <span className="vulnerability-count">2</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill progress-yellow"></div>
                    <div className="progress-bar-bg"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions-box">
              <h4>Quick Actions</h4>
              
              <div className="actions-list">
                <button className="action-item">
                  <div className="action-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.99984 14.6666C3.64622 14.6666 3.30708 14.5261 3.05703 14.2761C2.80698 14.026 2.6665 13.6869 2.6665 13.3333V2.66659C2.6665 2.31297 2.80698 1.97383 3.05703 1.72378C3.30708 1.47373 3.64622 1.33325 3.99984 1.33325H9.33317C9.54421 1.33291 9.75323 1.37432 9.94819 1.4551C10.1432 1.53588 10.3202 1.65443 10.4692 1.80392L12.8612 4.19592C13.0111 4.34493 13.13 4.52215 13.211 4.71736C13.292 4.91257 13.3335 5.1219 13.3332 5.33325V13.3333C13.3332 13.6869 13.1927 14.026 12.9426 14.2761C12.6926 14.5261 12.3535 14.6666 11.9998 14.6666H3.99984Z" stroke="#00D492" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.3335 1.33325V4.66659C9.3335 4.8434 9.40373 5.01297 9.52876 5.13799C9.65378 5.26301 9.82335 5.33325 10.0002 5.33325H13.3335" stroke="#00D492" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6.66683 6H5.3335" stroke="#00D492" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.6668 8.66675H5.3335" stroke="#00D492" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.6668 11.3333H5.3335" stroke="#00D492" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Generate Report</span>
                </button>

                <button className="action-item">
                  <div className="action-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.44754 2.75735C6.48427 2.37091 6.66376 2.01205 6.95094 1.75087C7.23812 1.4897 7.61235 1.34497 8.00054 1.34497C8.38872 1.34497 8.76296 1.4897 9.05014 1.75087C9.33732 2.01205 9.5168 2.37091 9.55354 2.75735C9.57561 3.00699 9.65751 3.24763 9.79229 3.45891C9.92707 3.67019 10.1108 3.84589 10.3278 3.97114C10.5449 4.09638 10.789 4.16749 11.0393 4.17843C11.2897 4.18938 11.539 4.13984 11.7662 4.03402C12.1189 3.87387 12.5187 3.8507 12.8875 3.96901C13.2564 4.08732 13.5681 4.33865 13.7619 4.67409C13.9557 5.00953 14.0177 5.40507 13.936 5.78373C13.8542 6.1624 13.6345 6.4971 13.3195 6.72269C13.1145 6.86658 12.9471 7.05776 12.8315 7.28004C12.7159 7.50231 12.6556 7.74916 12.6556 7.99969C12.6556 8.25021 12.7159 8.49706 12.8315 8.71934C12.9471 8.94161 13.1145 9.13279 13.3195 9.27669C13.6345 9.50228 13.8542 9.83697 13.936 10.2156C14.0177 10.5943 13.9557 10.9898 13.7619 11.3253C13.5681 11.6607 13.2564 11.9121 12.8875 12.0304C12.5187 12.1487 12.1189 12.1255 11.7662 11.9654C11.539 11.8595 11.2897 11.81 11.0393 11.8209C10.789 11.8319 10.5449 11.903 10.3278 12.0282C10.1108 12.1535 9.92707 12.3292 9.79229 12.5405C9.65751 12.7517 9.57561 12.9924 9.55354 13.242C9.5168 13.6285 9.33732 13.9873 9.05014 14.2485C8.76296 14.5097 8.38872 14.6544 8.00054 14.6544C7.61235 14.6544 7.23812 14.5097 6.95094 14.2485C6.66376 13.9873 6.48427 13.6285 6.44754 13.242C6.4255 12.9923 6.3436 12.7516 6.20878 12.5402C6.07396 12.3288 5.89018 12.1531 5.67302 12.0278C5.45586 11.9026 5.21172 11.8315 4.96126 11.8206C4.7108 11.8097 4.4614 11.8594 4.2342 11.9654C3.88146 12.1255 3.48175 12.1487 3.11287 12.0304C2.74399 11.9121 2.43232 11.6607 2.23853 11.3253C2.04473 10.9898 1.98268 10.5943 2.06444 10.2156C2.14621 9.83697 2.36594 9.50228 2.68087 9.27669C2.88595 9.13279 3.05336 8.94161 3.16893 8.71934C3.2845 8.49706 3.34484 8.25021 3.34484 7.99969C3.34484 7.74916 3.2845 7.50231 3.16893 7.28004C3.05336 7.05776 2.88595 6.86658 2.68087 6.72269C2.36638 6.49698 2.14704 6.16242 2.06547 5.78401C1.9839 5.4056 2.04594 5.01038 2.23953 4.67516C2.43311 4.33994 2.74441 4.08867 3.11293 3.97018C3.48145 3.85169 3.88086 3.87444 4.23354 4.03402C4.46071 4.13984 4.71003 4.18938 4.9604 4.17843C5.21078 4.16749 5.45482 4.09638 5.67189 3.97114C5.88896 3.84589 6.07266 3.67019 6.20745 3.45891C6.34223 3.24763 6.42413 3.00699 6.4462 2.75735" stroke="#00D3F2" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#00D3F2" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Configure Alerts</span>
                </button>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* VULNERABILITIES TAB CONTENT */}
{activeTab === 'vulnerabilities' && (
  <section className="vulnerabilities-section">
    {/* Search Bar */}
    <div className="search-container">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="#90A1B9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.5 17.5L13.875 13.875" stroke="#90A1B9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <input 
        type="text" 
        placeholder="Search scans by URL..." 
        className="vulnerability-search"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <select
        value={severityFilter}
        onChange={e => setSeverityFilter(e.target.value)}
        style={{marginLeft: '12px', background: '#0d1b35', color: '#90A1B9', border: '1px solid #1e2d4e', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer'}}
      >
        <option value="all">All Severity</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>

    {/* Scans from API */}
    <div className="vulnerabilities-list">
      {loading && (
        <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>Loading scans...</div>
      )}
      {!loading && filteredScans.length === 0 && (
        <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
          {scans.length === 0 ? 'No scans found. Use the Chrome Extension to scan pages!' : 'No scans match your search.'}
        </div>
      )}
      {!loading && filteredScans.map((scan, idx) => (
        <div key={scan.id || idx} className="vulnerability-card">
          <div className="vulnerability-header-row">
            <div className="vulnerability-meta">
              <span className="vulnerability-id">SCAN-{scan.id}</span>
              {scan.criticalCount > 0 && <span className="severity-badge severity-critical">Critical: {scan.criticalCount}</span>}
              {scan.highCount > 0 && <span className="severity-badge severity-high">High: {scan.highCount}</span>}
              {scan.mediumCount > 0 && <span className="severity-badge" style={{background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px'}}>Medium: {scan.mediumCount}</span>}
              {scan.lowCount > 0 && <span className="severity-badge" style={{background: 'rgba(0,188,125,0.15)', color: '#00BC7D', border: '1px solid rgba(0,188,125,0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px'}}>Low: {scan.lowCount}</span>}
              <span className={`status-badge ${scan.status === 'Completed' ? 'status-in-progress' : 'status-open'}`}>{scan.status}</span>
            </div>
          </div>
          <h3 className="vulnerability-title" style={{wordBreak: 'break-all'}}>{scan.targetURL}</h3>
          <div className="vulnerability-footer">
            <div className="vulnerability-info-item">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z" stroke="#90A1B9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 7H13" stroke="#90A1B9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 1C8.5 2.5 9.5 4.5 9.5 7C9.5 9.5 8.5 11.5 7 13C5.5 11.5 4.5 9.5 4.5 7C4.5 4.5 5.5 2.5 7 1Z" stroke="#90A1B9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{scan.totalVulns} vulnerabilities</span>
            </div>
            <div className="vulnerability-info-item">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3.5" width="8" height="8" rx="1" stroke="#90A1B9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 2.5V4.5" stroke="#90A1B9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 2.5V4.5" stroke="#90A1B9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 7H11" stroke="#90A1B9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
    {/* ANALYTICS TAB CONTENT */}
{activeTab === 'analytics' && (
  <section className="analytics-section">
    <div className="analytics-container">
      {/* Left Section - Severity Distribution */}
      <div className="analytics-box">
        <h3 className="analytics-title">Severity Distribution</h3>
        
        <div className="analytics-severity-items">
          {/* Critical */}
          <div className="analytics-severity-row">
            <div className="analytics-severity-left">
              <div className="analytics-severity-badge analytics-severity-critical">1</div>
              <span className="analytics-severity-label">Critical</span>
            </div>
            <div className="analytics-severity-right">
              <div className="analytics-severity-bar-container">
                <div className="analytics-severity-bar analytics-bar-critical" style={{width: '17%'}}></div>
              </div>
              <div className="analytics-severity-stats">
                <span className="analytics-severity-number">17</span>
                <span className="analytics-severity-percent">%</span>
              </div>
            </div>
          </div>

          {/* High */}
          <div className="analytics-severity-row">
            <div className="analytics-severity-left">
              <div className="analytics-severity-badge analytics-severity-high">2</div>
              <span className="analytics-severity-label">High</span>
            </div>
            <div className="analytics-severity-right">
              <div className="analytics-severity-bar-container">
                <div className="analytics-severity-bar analytics-bar-high" style={{width: '33%'}}></div>
              </div>
              <div className="analytics-severity-stats">
                <span className="analytics-severity-number">33</span>
                <span className="analytics-severity-percent">%</span>
              </div>
            </div>
          </div>

          {/* Medium */}
          <div className="analytics-severity-row">
            <div className="analytics-severity-left">
              <div className="analytics-severity-badge analytics-severity-medium">2</div>
              <span className="analytics-severity-label">Medium</span>
            </div>
            <div className="analytics-severity-right">
              <div className="analytics-severity-bar-container">
                <div className="analytics-severity-bar analytics-bar-medium" style={{width: '33%'}}></div>
              </div>
              <div className="analytics-severity-stats">
                <span className="analytics-severity-number">33</span>
                <span className="analytics-severity-percent">%</span>
              </div>
            </div>
          </div>

          {/* Low */}
          <div className="analytics-severity-row">
            <div className="analytics-severity-left">
              <div className="analytics-severity-badge analytics-severity-low">1</div>
              <span className="analytics-severity-label">Low</span>
            </div>
            <div className="analytics-severity-right">
              <div className="analytics-severity-bar-container">
                <div className="analytics-severity-bar analytics-bar-low" style={{width: '17%'}}></div>
              </div>
              <div className="analytics-severity-stats">
                <span className="analytics-severity-number">17</span>
                <span className="analytics-severity-percent">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Status Breakdown */}
      <div className="analytics-box">
        <h3 className="analytics-title">Status Breakdown</h3>
        
        <div className="analytics-status-items">
          {/* Open */}
          <div className="analytics-status-row">
            <span className="analytics-status-label">Open</span>
            <div className="analytics-status-wrapper">
              <div className="analytics-status-bar-container">
                <div className="analytics-status-bar analytics-bar-critical" style={{width: '17%'}}></div>
                <div className="analytics-status-bar analytics-bar-high" style={{width: '33%'}}></div>
                <div className="analytics-status-bar analytics-bar-medium" style={{width: '17%'}}></div>
              </div>
              <span className="analytics-status-count">3</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="analytics-status-row">
            <span className="analytics-status-label">In Progress</span>
            <div className="analytics-status-wrapper">
              <div className="analytics-status-bar-container">
                <div className="analytics-status-bar analytics-bar-progress" style={{width: '17%'}}></div>
              </div>
              <span className="analytics-status-count">1</span>
            </div>
          </div>

          {/* Fixed */}
          <div className="analytics-status-row">
            <span className="analytics-status-label">Fixed</span>
            <div className="analytics-status-wrapper">
              <div className="analytics-status-bar-container">
                <div className="analytics-status-bar analytics-bar-fixed" style={{width: '17%'}}></div>
              </div>
              <span className="analytics-status-count">1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)}

    </>
  );
}

export default Bugs ;