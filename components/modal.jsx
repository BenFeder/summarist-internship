import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AiOutlineClose, AiOutlineUser } from "react-icons/ai";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase-config";
import { setUser } from "../redux/userSlice";

function Modal({ show, onClose }) {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!show) return null;

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError("");
    setSuccessMessage("");
  };

  const handleClose = () => {
    setIsSignup(false);
    setIsForgotPassword(false);
    setEmail("");
    setPassword("");
    setError("");
    setSuccessMessage("");
    onClose();
  };

  const showForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignup(false);
    setError("");
    setSuccessMessage("");
    setPassword("");
  };

  const backToLogin = () => {
    setIsForgotPassword(false);
    setIsSignup(false);
    setError("");
    setSuccessMessage("");
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed up:", userCredential.user);
      dispatch(
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        })
      );
      handleClose();
      navigate("/for-you");
    } catch (error) {
      console.error("Error signing up:", error.message);
      setError(error.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed in:", userCredential.user);
      dispatch(
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        })
      );
      handleClose();
      navigate("/for-you");
    } catch (error) {
      console.error("Error signing in:", error.message);
      setError(error.message);
    }
  };

  const handleSubmit = (e) => {
    if (isSignup) {
      handleSignUp(e);
    } else {
      handleSignIn(e);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset link sent! Check your email.");
      console.log("Password reset email sent");
    } catch (error) {
      console.error("Error sending password reset:", error.message);
      setError(error.message);
    }
  };

  const handleGuestLogin = async () => {
    setError("");
    const guestEmail = "guest@gmail.com";
    const guestPassword = "abc123";

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        guestEmail,
        guestPassword
      );
      console.log("Guest signed in:", userCredential.user);
      dispatch(
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        })
      );
      handleClose();
      navigate("/for-you");
    } catch (error) {
      console.error("Error signing in as guest:", error.message);
      setError(error.message);
    }
  };

  // Forgot Password Modal
  if (isForgotPassword) {
    return (
      <div className="modal__overlay" onClick={handleClose}>
        <div className="modal__content" onClick={(e) => e.stopPropagation()}>
          <div className="modal__header">
            <h2 className="modal__title">Reset your password</h2>
            <button className="modal__close" onClick={handleClose}>
              <AiOutlineClose />
            </button>
          </div>
          {error && <div className="modal__error">{error}</div>}
          {successMessage && (
            <div className="modal__success">{successMessage}</div>
          )}
          <form onSubmit={handlePasswordReset}>
            <input
              type="email"
              placeholder="Email Address"
              className="modal__input modal__input--reset"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="modal__login-btn">
              Send reset password link
            </button>
          </form>
          <div className="modal__footer" onClick={backToLogin}>
            Go to login
          </div>
        </div>
      </div>
    );
  }

  // Login/Signup Modal
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
        <button className="modal__guest-btn" onClick={handleGuestLogin}>
          <AiOutlineUser className="modal__guest-icon" />
          Login as a Guest
        </button>
        <div className="modal__separator">or</div>
        {error && <div className="modal__error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            className="modal__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="modal__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="modal__login-btn">
            {isSignup ? "Sign up" : "Login"}
          </button>
        </form>
        {!isSignup && (
          <div className="modal__forgot-password" onClick={showForgotPassword}>
            Forgot your password?
          </div>
        )}
        <div className="modal__footer" onClick={toggleMode}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}
        </div>
      </div>
    </div>
  );
}

export default Modal;
