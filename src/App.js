import React, { useState, useEffect, useCallback } from "react";
import { getStartOfWeek, getWeekDates } from "./utils";
import TimesheetList from "./TimesheetList";
import EmployeeManagement from "./EmployeeManagement"; // Import EmployeeManagement component
import "./App.css"; // Import custom CSS for styling (optional)

const App = () => {
  const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
  const [weekDates, setWeekDates] = useState(getWeekDates(currentWeek));
  const [view, setView] = useState("timesheet"); // State to manage which view to show: "timesheet", or "employeeManagement"
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track if user is logged in
  const [username, setUsername] = useState(""); // Track username input
  const [password, setPassword] = useState(""); // Track password input

  // Function to handle changing weeks
  const changeWeek = useCallback((direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + direction * 7);
    setCurrentWeek(newWeek);
    setWeekDates(getWeekDates(newWeek));
  }, [currentWeek]);

  // Function to switch between views
  const handleViewChange = (view) => {
    setView(view);
  };

  // Handle login submission
  const handleLogin = () => {
    // Check if the username and password are correct
    if (username === "admin" && password === "ot123") {
      setIsLoggedIn(true);
    } else {
      alert("Invalid username or password");
    }
  };

  // Handle enter key press for login
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  // Render login form if not logged in, otherwise render the app
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            onKeyDown={handleKeyPress} // Handle Enter key press on username input
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            onKeyDown={handleKeyPress} // Handle Enter key press on password input
          />
          <button onClick={handleLogin} className="login-button">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navigation Bar with Split Layout */}
      <div className="navbar">
        <div 
          className={`nav-item ${view === "timesheet" ? "selected" : ""}`} 
          onClick={() => handleViewChange("timesheet")}
        >
          Timesheet
        </div>
        <div 
          className={`nav-item ${view === "employeeManagement" ? "selected" : ""}`} 
          onClick={() => handleViewChange("employeeManagement")}
        >
          Employees
        </div>
      </div>

      {/* Main content area */}
      <div className="main-content">
        {/* Conditional rendering based on the selected view */}
        {view === "timesheet" && <TimesheetList weekDates={weekDates} />}
        {view === "employeeManagement" && <EmployeeManagement />}
      </div>
    </div>
  );
};

export default App;
