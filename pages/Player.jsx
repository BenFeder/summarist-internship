import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { AiOutlineSearch } from "react-icons/ai";
import { FiPlay, FiPause } from "react-icons/fi";
import { MdReplay10, MdForward10 } from "react-icons/md";
import { db } from "../firebase-config";
import { doc, setDoc } from "firebase/firestore";
import { getAudioDuration, formatDuration } from "../utils/audioUtils";
import Sidebar from "../components/Sidebar";

function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const uid = user?.uid;
  const isSubscribed = user?.isSubscribed || false;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [audioDurations, setAudioDurations] = useState({});

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
    if (book && book.subscriptionRequired && !isSubscribed) {
      navigate("/choose-plan");
    }
  }, [book, isSubscribed, navigate]);

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

  useEffect(() => {
    const handleAudioEnded = async () => {
      if (!uid || !book) return;

      try {
        const finishedRef = doc(db, "users", uid, "finished", id);
        await setDoc(finishedRef, {
          ...book,
          finishedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error saving finished book:", error);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handleAudioEnded);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleAudioEnded);
      }
    };
  }, [uid, id, book]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime - 10
      );
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + 10
      );
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (audioRef.current) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * audioRef.current.duration;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="player-page">
      <Sidebar />

      <main className="player-content">
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
        {loading ? (
          <div className="player-loading">Loading...</div>
        ) : book ? (
          <>
            <div className="player-header">
              <h1 className="player-header__title">{book.title}</h1>
            </div>
            <div className="player-summary">
              <p className="player-summary__text">{book.summary}</p>
            </div>
          </>
        ) : (
          <div className="player-error">Book not found</div>
        )}
      </main>

      {book && book.audioLink && (
        <div className="player-audio-footer">
          <audio
            ref={audioRef}
            src={book.audioLink}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />
          <div className="player-audio-footer__left">
            <img
              src={book.imageLink}
              alt={book.title}
              className="player-audio-footer__image"
            />
            <div className="player-audio-footer__info">
              <h3 className="player-audio-footer__title">{book.title}</h3>
              <p className="player-audio-footer__author">{book.author}</p>
            </div>
          </div>
          <div className="player-audio-footer__controls">
            <button
              className="player-audio-footer__btn"
              onClick={skipBackward}
              aria-label="Skip backward 10 seconds"
            >
              <MdReplay10 />
            </button>
            <button
              className="player-audio-footer__btn player-audio-footer__btn--play"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FiPause /> : <FiPlay />}
            </button>
            <button
              className="player-audio-footer__btn"
              onClick={skipForward}
              aria-label="Skip forward 10 seconds"
            >
              <MdForward10 />
            </button>
          </div>
          <div className="player-audio-footer__right">
            <span className="player-audio-footer__time">
              {formatTime(currentTime)}
            </span>
            <div
              className="player-audio-footer__progress"
              onClick={handleProgressClick}
            >
              <div
                className="player-audio-footer__progress-bar"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            <span className="player-audio-footer__time">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Player;
