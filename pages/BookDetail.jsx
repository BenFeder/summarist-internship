import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import {
  AiOutlineHome,
  AiOutlineSearch,
  AiOutlineQuestionCircle,
  AiOutlineStar,
  AiOutlineBulb,
} from "react-icons/ai";
import { BsBookmark, BsHighlights } from "react-icons/bs";
import { FiSettings, FiLogIn, FiLogOut, FiMic } from "react-icons/fi";
import { BiTime } from "react-icons/bi";
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
import { clearUser } from "../redux/userSlice";
import Modal from "../components/modal";

function BookDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://us-central1-summaristt.cloudfunctions.net/getBook?id=${id}`
        );
        if (response.data) {
          setBook(response.data);
        }
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

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
    <div className="book-detail-page">
      <aside className="sidebar">
        <div className="sidebar__top">
          <div className="sidebar__logo">
            <img src="/assets/logo.png" alt="logo" />
          </div>
          <nav className="sidebar__nav">
            <Link to="/for-you" className="sidebar__link">
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

      <main className="book-detail-content">
        {loading ? (
          <div className="book-detail-loading">Loading...</div>
        ) : book ? (
          <>
            <div className="book-detail-header">
              <div className="book-detail-header__info">
                <h1 className="book-detail-header__title">{book.title}</h1>
                <p className="book-detail-header__author">{book.author}</p>
                <p className="book-detail-header__subtitle">{book.subTitle}</p>

                <div className="book-detail-header__divider"></div>

                <div className="book-detail-header__stats">
                  <div className="book-detail-header__stats-left">
                    <div className="book-detail-stat">
                      <AiOutlineStar className="book-detail-stat__icon" />
                      <span className="book-detail-stat__text">
                        {book.averageRating || "N/A"} ({book.totalRating || 0})
                      </span>
                    </div>
                    <div className="book-detail-stat">
                      <FiMic className="book-detail-stat__icon" />
                      <span className="book-detail-stat__text">Audio & Text</span>
                    </div>
                  </div>

                  <div className="book-detail-header__stats-right">
                    <div className="book-detail-stat">
                      <BiTime className="book-detail-stat__icon" />
                      <span className="book-detail-stat__text">
                        {book.audioLink
                          ? `${Math.floor(book.totalRating)} min`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="book-detail-stat">
                      <AiOutlineBulb className="book-detail-stat__icon" />
                      <span className="book-detail-stat__text">
                        {book.keyIdeas || 0} Key Ideas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="book-detail-header__divider"></div>
              </div>

              <div className="book-detail-header__image-wrapper">
                <img
                  src={book.imageLink}
                  alt={book.title}
                  className="book-detail-header__image"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="book-detail-error">Book not found</div>
        )}
      </main>

      <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default BookDetail;
