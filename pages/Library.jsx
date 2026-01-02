import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AiOutlineHome,
  AiOutlineSearch,
  AiOutlineQuestionCircle,
} from "react-icons/ai";
import { BsBookmark, BsHighlights } from "react-icons/bs";
import { FiSettings, FiLogIn, FiLogOut, FiPlay, FiStar } from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import { clearUser } from "../redux/userSlice";
import Modal from "../components/modal";
import { getAudioDuration, formatDuration } from "../utils/audioUtils";

function Library() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const uid = user?.uid;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [savedBooks, setSavedBooks] = useState([]);
  const [finishedBooks, setFinishedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [audioDurations, setAudioDurations] = useState({});

  // Expose a way to manually trigger refetch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setRefetchTrigger((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const fetchLibraryBooks = async () => {
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const libraryRef = collection(db, "users", uid, "library");
        const librarySnap = await getDocs(libraryRef);
        const books = librarySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSavedBooks(books);

        const finishedRef = collection(db, "users", uid, "finished");
        const finishedSnap = await getDocs(finishedRef);
        const finished = finishedSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFinishedBooks(finished);
      } catch (error) {
        console.error("Error fetching library books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryBooks();
  }, [uid, refetchTrigger]);

  useEffect(() => {
    const loadAudioDurations = async () => {
      const allBooks = [...savedBooks, ...finishedBooks];
      const durations = {};

      await Promise.all(
        allBooks.map(async (book) => {
          if (book.audioLink) {
            try {
              const duration = await getAudioDuration(book.audioLink);
              durations[book.id] = duration;
            } catch (error) {
              console.error(`Error loading duration for ${book.id}:`, error);
              durations[book.id] = null;
            }
          }
        })
      );

      setAudioDurations(durations);
    };

    if (savedBooks.length > 0 || finishedBooks.length > 0) {
      loadAudioDurations();
    }
  }, [savedBooks, finishedBooks]);

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
    <div className="library-page">
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
            <Link to="/library" className="sidebar__link sidebar__link--active">
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

      <main className="library-content">
        <div className="library-section">
          <h2 className="library-section__title">Saved Books</h2>
          <p className="library-section__count">
            {savedBooks.length} {savedBooks.length === 1 ? "item" : "items"}
          </p>
          {loading ? (
            <div className="library-loading">Loading...</div>
          ) : savedBooks.length === 0 ? (
            <div className="library-empty">
              <h3 className="library-empty__title">
                Save your favorite books!
              </h3>
              <p className="library-empty__text">
                When you save a book, it will appear here.
              </p>
            </div>
          ) : (
            <div className="library-books">
              {savedBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="library-book"
                >
                  {book.subscriptionRequired && (
                    <span className="library-book__premium-badge">Premium</span>
                  )}
                  <div className="library-book__image-wrapper">
                    <img
                      src={book.imageLink}
                      alt={book.title}
                      className="library-book__image"
                    />
                    {book.audioLink && (
                      <span className="library-book__duration-overlay">
                        {formatDuration(audioDurations[book.id])}
                      </span>
                    )}
                  </div>
                  <h4 className="library-book__title">{book.title}</h4>
                  <p className="library-book__author">{book.author}</p>
                  <p className="library-book__subtitle">{book.subTitle}</p>
                  <div className="library-book__footer">
                    <div className="library-book__audio">
                      <FiPlay className="library-book__play-icon" />
                      <span className="library-book__duration">
                        {book.audioLink
                          ? formatDuration(audioDurations[book.id])
                          : "N/A"}
                      </span>
                    </div>
                    <div className="library-book__rating">
                      <FiStar className="library-book__star-icon" />
                      <span>{book.averageRating || "N/A"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="library-section">
          <h2 className="library-section__title">Finished</h2>
          <p className="library-section__count">
            {finishedBooks.length}{" "}
            {finishedBooks.length === 1 ? "item" : "items"}
          </p>
          {finishedBooks.length === 0 ? (
            <div className="library-empty">
              <h3 className="library-empty__title">Done and dusted!</h3>
              <p className="library-empty__text">
                When you finish a book, you can find it here later.
              </p>
            </div>
          ) : (
            <div className="library-books">
              {finishedBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="library-book"
                >
                  {book.subscriptionRequired && (
                    <span className="library-book__premium-badge">Premium</span>
                  )}
                  <div className="library-book__image-wrapper">
                    <img
                      src={book.imageLink}
                      alt={book.title}
                      className="library-book__image"
                    />
                    {book.audioLink && (
                      <span className="library-book__duration-overlay">
                        {formatDuration(audioDurations[book.id])}
                      </span>
                    )}
                  </div>
                  <h4 className="library-book__title">{book.title}</h4>
                  <p className="library-book__author">{book.author}</p>
                  <p className="library-book__subtitle">{book.subTitle}</p>
                  <div className="library-book__footer">
                    <div className="library-book__audio">
                      <FiPlay className="library-book__play-icon" />
                      <span className="library-book__duration">
                        {book.audioLink
                          ? formatDuration(audioDurations[book.id])
                          : "N/A"}
                      </span>
                    </div>
                    <div className="library-book__rating">
                      {" "}
                      <FiStar className="library-book__star-icon" />{" "}
                      <span>{book.averageRating || "N/A"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default Library;
