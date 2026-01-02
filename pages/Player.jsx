import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import {
  AiOutlineHome,
  AiOutlineSearch,
  AiOutlineQuestionCircle,
} from "react-icons/ai";
import { BsBookmark, BsHighlights } from "react-icons/bs";
import { FiSettings, FiLogIn, FiLogOut, FiPlay, FiPause } from "react-icons/fi";
import { MdReplay10, MdForward10 } from "react-icons/md";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase-config";
import { doc, setDoc } from "firebase/firestore";
import { clearUser } from "../redux/userSlice";
import Modal from "../components/modal";

function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const uid = user?.uid;
  const isSubscribed = user?.isSubscribed || false;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(clearUser());
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <div className="player-page">
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

      <main className="player-content">
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

      <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default Player;
