import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { AiOutlineSearch } from "react-icons/ai";
import { FiPlay } from "react-icons/fi";
import { getAudioDuration, formatDuration } from "../utils/audioUtils";
import Sidebar from "../components/Sidebar";

function Settings() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [audioDurations, setAudioDurations] = useState({});

  const isSubscribed = user?.isSubscribed || false;
  const userEmail = user?.email || "";

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
    const query = searchQuery.toLowerCase();
    const filtered = allBooks.filter((book) => {
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    });
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

  const handleSubscriptionAction = () => {
    if (isSubscribed) {
      // Cancel plan logic - to be implemented later
      console.log("Cancel plan");
    } else {
      // Navigate to upgrade page
      navigate("/choose-plan");
    }
  };

  return (
    <div className="settings-page">
      <Sidebar />

      <main className="settings-content">
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
        <div className="settings-container">
          <h1 className="settings-title">Settings</h1>
          <div className="settings-divider"></div>

          <div className="settings-section">
            <h2 className="settings-section__title">Your subscription plan</h2>
            <p className="settings-section__status">
              {isSubscribed ? "Premium" : "Basic"}
            </p>
            <button
              className="settings-section__btn"
              onClick={handleSubscriptionAction}
            >
              {isSubscribed ? "Cancel plan" : "Upgrade to Premium"}
            </button>
          </div>

          <div className="settings-divider"></div>

          <div className="settings-section">
            <h2 className="settings-section__title">Email</h2>
            <p className="settings-section__email">{userEmail}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
