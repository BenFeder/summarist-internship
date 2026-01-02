import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import {
  AiOutlineHome,
  AiOutlineSearch,
  AiOutlineQuestionCircle,
} from "react-icons/ai";
import { BsBookmark, BsHighlights } from "react-icons/bs";
import { FiSettings, FiLogIn, FiLogOut, FiPlay } from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
import { clearUser } from "../redux/userSlice";
import Modal from "../components/modal";

function ForYou() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    const fetchSelectedBook = async () => {
      try {
        const response = await axios.get(
          "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=selected"
        );
        if (response.data && response.data[0]) {
          setSelectedBook(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching selected book:", error);
      }
    };

    fetchSelectedBook();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(clearUser());
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <div className="for-you-page">
      <aside className="sidebar">
        <div className="sidebar__top">
          <div className="sidebar__logo">
            <img src="./assets/logo.png" alt="logo" />
          </div>
          <nav className="sidebar__nav">
            <Link to="/for-you" className="sidebar__link sidebar__link--active">
              <AiOutlineHome className="sidebar__icon" />
              <span>For You</span>
            </Link>
            <Link to="/library" className="sidebar__link">
              <BsBookmark className="sidebar__icon" />
              <span>My Library</span>
            </Link>
            <div className="sidebar__link sidebar__link--disabled">
              <BsHighlights className="sidebar__icon" />
              <span>Highlights</span>
            </div>
            <div className="sidebar__link sidebar__link--disabled">
              <AiOutlineSearch className="sidebar__icon" />
              <span>Search</span>
            </div>
          </nav>
        </div>
        <div className="sidebar__bottom">
          <Link to="/settings" className="sidebar__link">
            <FiSettings className="sidebar__icon" />
            <span>Settings</span>
          </Link>
          <div className="sidebar__link sidebar__link--disabled">
            <AiOutlineQuestionCircle className="sidebar__icon" />
            <span>Help & Support</span>
          </div>
          {isAuthenticated ? (
            <div className="sidebar__link" onClick={handleSignOut}>
              <FiLogOut className="sidebar__icon" />
              <span>Logout</span>
            </div>
          ) : (
            <div
              className="sidebar__link"
              onClick={() => setShowLoginModal(true)}
            >
              <FiLogIn className="sidebar__icon" />
              <span>Login</span>
            </div>
          )}
        </div>
      </aside>
      <main className="for-you-content">
        <div className="selected-section">
          <h2 className="selected-section__title">Selected just for you</h2>
          {selectedBook ? (
            <Link to={`/book/${selectedBook.id}`} className="selected-book">
              <div className="selected-book__content">
                <p className="selected-book__subtitle">{selectedBook.subTitle}</p>
              </div>
              <div className="selected-book__divider"></div>
              <div className="selected-book__details">
                <img
                  src={selectedBook.imageLink}
                  alt={selectedBook.title}
                  className="selected-book__image"
                />
                <div className="selected-book__info">
                  <h3 className="selected-book__title">{selectedBook.title}</h3>
                  <p className="selected-book__author">{selectedBook.author}</p>
                  <div className="selected-book__audio">
                    <FiPlay className="selected-book__play-icon" />
                    <span className="selected-book__duration">
                      {selectedBook.audioLink ? `${Math.floor(selectedBook.totalRating)} min` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="selected-book selected-book--loading">
              <p>Loading...</p>
            </div>
          )}
        </div>
      </main>

      <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default ForYou;
