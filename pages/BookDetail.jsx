import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  AiOutlineSearch,
  AiOutlineStar,
  AiOutlineBulb,
  AiOutlineMenu,
  AiOutlineClose,
} from "react-icons/ai";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { FiMic, FiPlay } from "react-icons/fi";
import { BiTime } from "react-icons/bi";
import { db } from "../firebase-config";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getAudioDuration, formatDuration } from "../utils/audioUtils";
import Sidebar from "../components/Sidebar";
import { BookDetailSkeleton } from "../components/BookSkeleton";

function BookDetail() {
  const { id } = useParams();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const uid = user?.uid;
  const isSubscribed = user?.isSubscribed || false;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [audioDurations, setAudioDurations] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        const [selectedRes, recommendedRes, suggestedRes] = await Promise.all([
          axios.get(
            "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=selected"
          ),
          axios.get(
            "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=recommended"
          ),
          axios.get(
            "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=suggested"
          ),
        ]);
        const books = [
          ...(selectedRes.data || []),
          ...(recommendedRes.data || []),
          ...(suggestedRes.data || []),
        ];
        const uniqueBooks = books.filter(
          (book, index, self) =>
            index === self.findIndex((b) => b.id === book.id)
        );
        setAllBooks(uniqueBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };
    fetchAllBooks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      try {
        const response = await axios.get(
          `https://us-central1-summaristt.cloudfunctions.net/getBooksByAuthorOrTitle?search=${encodeURIComponent(
            searchQuery
          )}`
        );
        if (response.data) {
          setSearchResults(response.data);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

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

  const handleToggleSave = async () => {
    if (!isAuthenticated || !uid) {
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

  return (
    <div className="book-detail-page">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="book-detail-content">
        <div className="fixed-header">
          <div className="mobile-header-wrapper">
            <button className="hamburger-menu" onClick={toggleSidebar}>
              {isSidebarOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
            </button>
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
            </div>
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
        {loading ? (
          <BookDetailSkeleton />
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

                {book.tags && book.tags.length > 0 && (
                  <div className="book-detail-tags">
                    <h3 className="book-detail-tags__heading">
                      What's it about?
                    </h3>
                    <div className="book-detail-tags__list">
                      {book.tags.map((tag, index) => (
                        <div key={index} className="book-detail-tag">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {book.bookDescription && (
                  <p className="book-detail-description">
                    {book.bookDescription}
                  </p>
                )}

                {book.authorDescription && (
                  <div className="book-detail-author">
                    <h3 className="book-detail-author__heading">
                      About the Author
                    </h3>
                    <p className="book-detail-author__description">
                      {book.authorDescription}
                    </p>
                  </div>
                )}
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
    </div>
  );
}

export default BookDetail;
