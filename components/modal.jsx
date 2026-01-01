import React, { useState } from "react";
import { AiOutlineClose, AiOutlineUser } from "react-icons/ai";

function Modal({ show, onClose }) {
  const [isSignup, setIsSignup] = useState(false);

  if (!show) return null;

  const toggleMode = () => {
    setIsSignup(!isSignup);
  };

  const handleClose = () => {
    setIsSignup(false);
    onClose();
  };

  return (
    <div className="modal__overlay" onClick={handleClose}>
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            {isSignup ? "Sign up to Summarist" : "Login to Summarist"}
          </h2>
          <button className="modal__close" onClick={handleClose}>
            <AiOutlineClose />
          </button>
        </div>
        <button className="modal__guest-btn">
          <AiOutlineUser className="modal__guest-icon" />
          Login as a Guest
        </button>
        <div className="modal__separator">or</div>
        <input
          type="email"
          placeholder="Email Address"
          className="modal__input"
        />
        <input
          type="password"
          placeholder="Password"
          className="modal__input"
        />
        <button className="modal__login-btn">
          {isSignup ? "Sign up" : "Login"}
        </button>
        <div className="modal__footer" onClick={toggleMode}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}
        </div>
      </div>
    </div>
  );
}

export default Modal;
