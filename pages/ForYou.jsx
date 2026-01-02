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
import { FiSettings, FiLogIn, FiLogOut, FiPlay, FiStar, FiClock } from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
import { clearUser } from "../redux/userSlice";
import Modal from "../components/modal";
import { getAudioDuration, formatDuration } from "../utils/audioUtils";

function ForYou() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [suggestedBooks, setSuggestedBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [audioDurations, setAudioDurations] = useState({});

  useEffect(() => {
    const fetchSelectedBook = async () => {
      try {
        const response = await axios.get(
          "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=selected"
        );
        if (response.data && response.data[0]) {
          setSelectedBook(response.data[0]);
          setAllBooks((prevBooks) => {
            const bookExists = prevBooks.some(
              (b) => b.id === response.data[0].id
            );
            return bookExists ? prevBooks : [...prevBooks, response.data[0]];
          });
        }
      } catch (error) {
        console.error("Error fetching selected book:", error);
      }
    };

    const fetchRecommendedBooks = async () => {
      try {
        const response = await axios.get(
          "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=recommended"
        );
        if (response.data) {
          setRecommendedBooks(response.data.slice(0, 8));
          setAllBooks((prevBooks) => {
            const existingIds = new Set(prevBooks.map((b) => b.id));
            const newBooks = response.data.filter(
              (book) => !existingIds.has(book.id)
            );
            return [...prevBooks, ...newBooks];
          });
        }
      } catch (error) {
        console.error("Error fetching recommended books:", error);
      }
    };

    const fetchSuggestedBooks = async () => {
      try {
        const response = await axios.get(
          "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=suggested"
        );
        if (response.data) {
          setSuggestedBooks(response.data.slice(0, 8));
          setAllBooks((prevBooks) => {
            const existingIds = new Set(prevBooks.map((b) => b.id));
            const newBooks = response.data.filter(
              (book) => !existingIds.has(book.id)
            );
            return [...prevBooks, ...newBooks];
          });
        }
      } catch (error) {
        console.error("Error fetching suggested books:", error);
      }
    };

    fetchSelectedBook();
    fetchRecommendedBooks();
    fetchSuggestedBooks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allBooks.filter((book) => {
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    });

    // Remove any duplicate results based on book ID
    const uniqueFiltered = filtered.filter(
      (book, index, self) => index === self.findIndex((b) => b.id === book.id)
    );

    setSearchResults(uniqueFiltered);
  }, [searchQuery, allBooks]);

  useEffect(() => {
    const loadAudioDurations = async () => {
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

    if (allBooks.length > 0) {
      loadAudioDurations();
    }
  }, [allBooks]);

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
        <div className="search-bar-container">
          <div className="search-bar">
            <input
              type="text"
              className="search-bar__input"
              placeholder="Search for books"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="search-bar__divider"></div>
            <AiOutlineSearch className="search-bar__icon" />
          </div>
          {searchQuery.trim() !== "" && searchResults.length === 0 && (
            <div className="search-results">
              <div className="search-no-results">No books found</div>
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((book) => (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="search-result"
                  onClick={() => setSearchQuery("")}
                >
                  <img
                    src={book.imageLink}
                    alt={book.title}
                    className="search-result__image"
                  />
                  <div className="search-result__info">
                    <h4 className="search-result__title">{book.title}</h4>
                    <p className="search-result__author">{book.author}</p>
                    <div className="search-result__duration">
                      <FiPlay className="search-result__play-icon" />
                      <span>
                        {book.audioLink
                          ? formatDuration(audioDurations[book.id])
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="selected-section">
          <h2 className="selected-section__title">Selected just for you</h2>
          {selectedBook ? (
            <Link to={`/book/${selectedBook.id}`} className="selected-book">
              <div className="selected-book__content">
                <p className="selected-book__subtitle">
                  {selectedBook.subTitle}
                </p>
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
                    <FiClock className="selected-book__play-icon" />
                    <span className="selected-book__duration">
                      {selectedBook.audioLink
                        ? formatDuration(audioDurations[selectedBook.id])
                        : "N/A"}
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

        <div className="recommended-section">
          <h2 className="recommended-section__title">Recommended For You</h2>
          <p className="recommended-section__subtitle">
            We think you'll like these
          </p>
          <div className="recommended-books">
            <div className="recommended-books__slider">
              {recommendedBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="recommended-book"
                >
                  {book.subscriptionRequired && (
                    <span className="recommended-book__premium-badge">
                      Premium
                    </span>
                  )}
                  <div className="recommended-book__image-wrapper">
                    <img
                      src={book.imageLink}
                      alt={book.title}
                      className="recommended-book__image"
                    />
                    {book.audioLink && (
                      <span className="recommended-book__duration-overlay">
                        {formatDuration(audioDurations[book.id])}
                      </span>
                    )}
                  </div>
                  <h4 className="recommended-book__title">{book.title}</h4>
                  <p className="recommended-book__author">{book.author}</p>
                  <p className="recommended-book__subtitle">{book.subTitle}</p>
                  <div className="recommended-book__footer">
                    <div className="recommended-book__audio">
                      <FiClock className="recommended-book__play-icon" />
                      <span className="recommended-book__duration">
                        {book.audioLink
                          ? formatDuration(audioDurations[book.id])
                          : "N/A"}
                      </span>
                    </div>
                    <div className="recommended-book__rating">
                      <FiStar className="recommended-book__star-icon" />
                      <span>{book.averageRating || "N/A"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="suggested-section">
          <h2 className="suggested-section__title">Suggested Books</h2>
          <p className="suggested-section__subtitle">Browse those books</p>
          <div className="suggested-books">
            <div className="suggested-books__slider">
              {suggestedBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="suggested-book"
                >
                  {book.subscriptionRequired && (
                    <span className="suggested-book__premium-badge">
                      Premium
                    </span>
                  )}
                  <div className="suggested-book__image-wrapper">
                    <img
                      src={book.imageLink}
                      alt={book.title}
                      className="suggested-book__image"
                    />
                    {book.audioLink && (
                      <span className="suggested-book__duration-overlay">
                        {formatDuration(audioDurations[book.id])}
                      </span>
                    )}
                  </div>
                  <h4 className="suggested-book__title">{book.title}</h4>
                  <p className="suggested-book__author">{book.author}</p>
                  <p className="suggested-book__subtitle">{book.subTitle}</p>
                  <div className="suggested-book__footer">
                    <div className="suggested-book__audio">
                      <FiClock className="suggested-book__play-icon" />
                      <span className="suggested-book__duration">
                        {book.audioLink
                          ? formatDuration(audioDurations[book.id])
                          : "N/A"}
                      </span>
                    </div>
                    <div className="suggested-book__rating">
                      <FiStar className="suggested-book__star-icon" />
                      <span>{book.averageRating || "N/A"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default ForYou;
