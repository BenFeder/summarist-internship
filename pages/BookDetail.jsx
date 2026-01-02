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
import { BsBookmark, BsBookmarkFill, BsHighlights } from "react-icons/bs";
import { FiSettings, FiLogIn, FiLogOut, FiMic } from "react-icons/fi";
import { BiTime } from "react-icons/bi";
import { IoBookOutline } from "react-icons/io5";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase-config";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { clearUser } from "../redux/userSlice";
import Modal from "../components/modal";
import { getAudioDuration, formatDuration } from "../utils/audioUtils";

function BookDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const uid = user?.uid;
  const isSubscribed = user?.isSubscribed || false;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(null); // Start as null instead of false
  const [audioDuration, setAudioDuration] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

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

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!uid || !id) {
        setIsSaved(false);
        return;
      }

      try {
        const bookRef = doc(db, "users", uid, "library", id);
        const bookSnap = await getDoc(bookRef);
        const isBookSaved = bookSnap.exists();
        setIsSaved(isBookSaved);
      } catch (error) {
        console.error("Error checking if book is saved:", error);
        setIsSaved(false);
      }
    };

    checkIfSaved();
  }, [uid, id]);

  useEffect(() => {
    const loadAudioDuration = async () => {
      if (book?.audioLink) {
        try {
          const duration = await getAudioDuration(book.audioLink);
          setAudioDuration(duration);
        } catch (error) {
          console.error("Error loading audio duration:", error);
          setAudioDuration(null);
        }
      }
    };

    loadAudioDuration();
  }, [book]);

  const handleToggleSave = async () => {
    if (!isAuthenticated || !uid) {
      setShowLoginModal(true);
      return;
    }

    if (!book) return;

    const wasAlreadySaved = isSaved;
    setIsSaved(!wasAlreadySaved);

    try {
      const bookRef = doc(db, "users", uid, "library", id);

      if (wasAlreadySaved) {
        await deleteDoc(bookRef);
      } else {
        await setDoc(bookRef, {
          ...book,
          savedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      setIsSaved(wasAlreadySaved);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(clearUser());
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
                      <span className="book-detail-stat__text">
                        Audio & Text
                      </span>
                    </div>
                  </div>

                  <div className="book-detail-header__stats-right">
                    <div className="book-detail-stat">
                      <BiTime className="book-detail-stat__icon" />
                      <span className="book-detail-stat__text">
                        {book.audioLink ? formatDuration(audioDuration) : "N/A"}
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

                <div className="book-detail-header__buttons">
                  <Link
                    to={
                      book.subscriptionRequired && !isSubscribed
                        ? "/choose-plan"
                        : `/player/${id}`
                    }
                    className="book-detail-header__btn book-detail-header__btn--primary"
                  >
                    Read
                  </Link>
                  <Link
                    to={
                      book.subscriptionRequired && !isSubscribed
                        ? "/choose-plan"
                        : `/player/${id}`
                    }
                    className="book-detail-header__btn book-detail-header__btn--secondary"
                  >
                    Listen
                  </Link>
                </div>

                <div
                  className={`book-detail-header__save ${
                    isSaved ? "book-detail-header__save--active" : ""
                  }`}
                  onClick={handleToggleSave}
                >
                  {isSaved ? (
                    <BsBookmarkFill className="book-detail-header__save-icon" />
                  ) : (
                    <BsBookmark className="book-detail-header__save-icon" />
                  )}
                  <span className="book-detail-header__save-text">
                    {isSaved
                      ? "Saved in My Library"
                      : "Add title to My Library"}
                  </span>
                </div>
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
