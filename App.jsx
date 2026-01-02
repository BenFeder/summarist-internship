import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase-config";
import { setUser, clearUser } from "./redux/userSlice";
import Home from "./pages/Home";
import ForYou from "./pages/ForYou";
import BookDetail from "./pages/BookDetail";
<<<<<<< HEAD
import Library from "./pages/Library";
=======
>>>>>>> ee142e072c9153bd33d680d9921639875bae32c4
import Player from "./pages/Player";
import "./style.css";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(
          setUser({
            uid: user.uid,
            email: user.email,
          })
        );
      } else {
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/for-you" element={<ForYou />} />
      <Route path="/book/:id" element={<BookDetail />} />
<<<<<<< HEAD
      <Route path="/library" element={<Library />} />
=======
>>>>>>> ee142e072c9153bd33d680d9921639875bae32c4
      <Route path="/player/:id" element={<Player />} />
    </Routes>
  );
}

export default App;
