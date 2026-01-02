import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AiOutlineHome,
  AiOutlineSearch,
  AiOutlineQuestionCircle,
  AiOutlineMenu,
  AiOutlineClose,
} from "react-icons/ai";
import { BsBookmark } from "react-icons/bs";
import { FiSettings, FiLogIn, FiLogOut, FiEdit } from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
import { clearUser } from "../redux/userSlice";
import Modal from "./modal";

function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(clearUser());
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    // Close sidebar on mobile after clicking a link
    if (window.innerWidth <= 768 && toggleSidebar) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="sidebar__overlay" onClick={toggleSidebar}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__top">
          <div className="sidebar__logo">
            <img src="../assets/logo.png" alt="logo" />
          </div>
          <nav className="sidebar__nav">
            <Link
              to="/for-you"
              className={`sidebar__link ${
                isActive("/for-you") ? "sidebar__link--active" : ""
              }`}
              onClick={handleLinkClick}
            >
              <AiOutlineHome className="sidebar__icon" />
              <span>For You</span>
            </Link>
            <Link
              to="/library"
              className={`sidebar__link ${
                isActive("/library") ? "sidebar__link--active" : ""
              }`}
              onClick={handleLinkClick}
            >
              <BsBookmark className="sidebar__icon" />
              <span>My Library</span>
            </Link>
            <div className="sidebar__link sidebar__link--disabled">
              <FiEdit className="sidebar__icon" />
              <span>Highlights</span>
            </div>
            <div className="sidebar__link sidebar__link--disabled">
              <AiOutlineSearch className="sidebar__icon" />
              <span>Search</span>
            </div>
          </nav>
        </div>
        <div className="sidebar__bottom">
          <Link
            to="/settings"
            className={`sidebar__link ${
              isActive("/settings") ? "sidebar__link--active" : ""
            }`}
            onClick={handleLinkClick}
          >
            <FiSettings className="sidebar__icon" />
            <span>Settings</span>
          </Link>
          <div className="sidebar__link sidebar__link--disabled">
            <AiOutlineQuestionCircle className="sidebar__icon" />
            <span>Help & Support</span>
          </div>
          {isAuthenticated ? (
            <div
              className="sidebar__link"
              onClick={() => {
                handleSignOut();
                handleLinkClick();
              }}
            >
              <FiLogOut className="sidebar__icon" />
              <span>Logout</span>
            </div>
          ) : (
            <div
              className="sidebar__link"
              onClick={() => {
                setShowLoginModal(true);
                handleLinkClick();
              }}
            >
              <FiLogIn className="sidebar__icon" />
              <span>Login</span>
            </div>
          )}
        </div>
      </aside>

      <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}

export default Sidebar;
