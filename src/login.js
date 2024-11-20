import React, { useState, useEffect, useRef } from "react";
import "./login.css"; // Import custom CSS for Login

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cursorClass, setCursorClass] = useState("");

  // Reference for the shadow circle
  const shadowCircleRef = useRef(null);

  // Track mouse position to move shadow circle
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [shadowPosition, setShadowPosition] = useState({ x: 0, y: 0 });

  // Update cursor when either field is filled or focused
  useEffect(() => {
    if (username || password) {
      setCursorClass("input-filled");  // Add class if either field is filled
    } else {
      setCursorClass("");  // Reset class if both fields are empty
    }
  }, [username, password]);

  // Handle mouse movement and update shadow circle position with delay
  useEffect(() => {
    const delay = 100; // Delay in milliseconds (adjust as needed)

    const handleMouseMove = (e) => {
      // Update cursor position immediately
      setCursorPosition({ x: e.clientX, y: e.clientY });

      // Set shadow circle position with delay
      setTimeout(() => {
        setShadowPosition({ x: e.clientX + 10, y: e.clientY + 10 });
      }, delay); // Delay the shadow circle's position update
    };

    // Add event listener for mouse move
    window.addEventListener("mousemove", handleMouseMove);

    // Clean up event listener
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className={`login-container ${cursorClass}`}>
      {/* Transparent circle element that follows the cursor */}
      <div
        ref={shadowCircleRef}
        className="shadow-circle"
        style={{
          left: `${shadowPosition.x}px`,
          top: `${shadowPosition.y}px`,
        }}
      ></div>

      <div className="login-box">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
