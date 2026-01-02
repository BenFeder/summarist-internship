import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { setUser, clearUser } from "./redux/userSlice";
import Home from "./pages/Home";
import ForYou from "./pages/ForYou";
import BookDetail from "./pages/BookDetail";
import Library from "./pages/Library";
import Player from "./pages/Player";
import Settings from "./pages/Settings";
import ChoosePlan from "./pages/ChoosePlan";
import "./style.css";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user data from Firestore
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          dispatch(
            setUser({
              uid: user.uid,
              email: user.email,
              isSubscribed: userDoc.exists()
                ? userDoc.data()?.isSubscribed || false
                : false,
              subscriptionType: userDoc.exists()
                ? userDoc.data()?.subscriptionType || null
                : null,
            })
          );
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Set user without subscription data if there's an error
          dispatch(
            setUser({
              uid: user.uid,
              email: user.email,
              isSubscribed: false,
              subscriptionType: null,
            })
          );
        }
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
      <Route path="/library" element={<Library />} />
      <Route path="/player/:id" element={<Player />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/choose-plan" element={<ChoosePlan />} />
    </Routes>
  );
}

export default App;
