import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { AiOutlineSearch, AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { FiPlay, FiStar } from "react-icons/fi";
import { db } from "../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import { getAudioDuration, formatDuration } from "../utils/audioUtils";
import Sidebar from "../components/Sidebar";
import { BookRowSkeleton } from "../components/BookSkeleton";

function Library() {
  const { user } = useSelector((state) => state.user);
  const uid = user?.uid;
  const [savedBooks, setSavedBooks] = useState([]);
  const [finishedBooks, setFinishedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [audioDurations, setAudioDurations] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  return (
    <div className="library-page">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="library-content">
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
        <div className="library-section">
          <h2 className="library-section__title">Saved Books</h2>
          <p className="library-section__count">
            {savedBooks.length} {savedBooks.length === 1 ? "item" : "items"}
          </p>
          {loading ? (
            <div className="library-books">
              <BookRowSkeleton />
            </div>
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
    </div>
  );
}

export default Library;
