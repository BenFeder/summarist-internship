import React from "react";
import { AiOutlineClose, AiOutlineUser } from "react-icons/ai";

function Modal({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Login to Summarist</h2>
          <button className="modal__close" onClick={onClose}>
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
        <button className="modal__login-btn">Login</button>
        <div className="modal__footer">Don't have an account?</div>
      </div>
    </div>
  );
}

export default Modal;
