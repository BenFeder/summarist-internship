import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import { AiOutlineFileText } from "react-icons/ai";
import { GiFlowerPot } from "react-icons/gi";
import { FaHandshake } from "react-icons/fa";
import { BiChevronDown } from "react-icons/bi";

function ChoosePlan() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const handleStartSubscription = async () => {
    console.log("User object:", user);

    if (!user?.uid) {
      alert("Please log in to subscribe");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const subscriptionType =
        selectedPlan === "yearly" ? "Premium Plus" : "Premium";

      console.log("Attempting to update Firestore...");
      console.log("User ID:", user.uid);
      console.log("Subscription type:", subscriptionType);

      await setDoc(
        userRef,
        {
          isSubscribed: true,
          subscriptionType: subscriptionType,
          subscriptionDate: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log("Subscription updated successfully!");

      // Redirect to for-you page after subscription
      navigate("/for-you");
      window.location.reload(); // Reload to update Redux state
    } catch (error) {
      console.error("Error updating subscription:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      alert(`Failed to process subscription: ${error.message}`);
    }
  };

  const accordionData = [
    {
      question: "How does the free 7-day trial work?",
      answer:
        "Begin your complimentary 7-day trial with a Summarist annual membership. You are under no obligation to continue your subscription, and you will only be billed when the trial period expires. With Premium access, you can learn at your own pace and as frequently as you desire, and you may terminate your subscription prior to the conclusion of the 7-day free trial.",
    },
    {
      question:
        "Can I switch subscriptions from monthly to yearly, or yearly to monthly?",
      answer:
        "While an annual plan is active, it is not feasible to switch to a monthly plan. However, once the current month ends, transitioning from a monthly plan to an annual plan is an option.",
    },
    {
      question: "What's included in the Premium plan?",
      answer:
        "Premium membership provides you with the ultimate Summarist experience, including unrestricted entry to many best-selling books high-quality audio, the ability to download titles for offline reading, and the option to send your reads to your Kindle.",
    },
    {
      question: "Can I cancel during my trial or subscription?",
      answer:
        "You will not be charged if you cancel your trial before its conclusion. While you will not have complete access to the entire Summarist library, you can still expand your knowledge with one curated book per day.",
    },
  ];

  return (
    <div className="choose-plan-page">
      <div className="choose-plan-hero">
        <h1 className="choose-plan-hero__title">
          Get unlimited access to many amazing books to read
        </h1>
        <p className="choose-plan-hero__subtitle">
          Turn ordinary moments into amazing learning opportunities
        </p>
      </div>

      <div className="choose-plan-features">
        <div className="choose-plan-feature">
          <AiOutlineFileText className="choose-plan-feature__icon" />
          <p className="choose-plan-feature__text">
            <strong>Key ideas in few min</strong> with many books to read
          </p>
        </div>
        <div className="choose-plan-feature">
          <GiFlowerPot className="choose-plan-feature__icon" />
          <p className="choose-plan-feature__text">
            <strong>3 million</strong> people growing with Summarist everyday
          </p>
        </div>
        <div className="choose-plan-feature">
          <FaHandshake className="choose-plan-feature__icon" />
          <p className="choose-plan-feature__text">
            <strong>Precise recommendations</strong> collections curated by
            experts
          </p>
        </div>
      </div>

      <h2 className="choose-plan-heading">Choose the plan that fits you</h2>

      <div className="choose-plan-options">
        <div
          className={`choose-plan-option ${
            selectedPlan === "yearly" ? "choose-plan-option--selected" : ""
          }`}
          onClick={() => setSelectedPlan("yearly")}
        >
          <input
            type="radio"
            name="plan"
            value="yearly"
            checked={selectedPlan === "yearly"}
            onChange={() => setSelectedPlan("yearly")}
            className="choose-plan-option__radio"
          />
          <div className="choose-plan-option__details">
            <h3 className="choose-plan-option__title">Premium Plus Yearly</h3>
            <p className="choose-plan-option__price">$99.99/year</p>
            <p className="choose-plan-option__trial">
              7-day free trial included
            </p>
          </div>
        </div>

        <div className="choose-plan-divider">
          <span className="choose-plan-divider__text">or</span>
        </div>

        <div
          className={`choose-plan-option ${
            selectedPlan === "monthly" ? "choose-plan-option--selected" : ""
          }`}
          onClick={() => setSelectedPlan("monthly")}
        >
          <input
            type="radio"
            name="plan"
            value="monthly"
            checked={selectedPlan === "monthly"}
            onChange={() => setSelectedPlan("monthly")}
            className="choose-plan-option__radio"
          />
          <div className="choose-plan-option__details">
            <h3 className="choose-plan-option__title">Premium Monthly</h3>
            <p className="choose-plan-option__price">$9.99/month</p>
            <p className="choose-plan-option__trial">No trial included</p>
          </div>
        </div>
      </div>

      <button className="choose-plan-button" onClick={handleStartSubscription}>
        {selectedPlan === "yearly"
          ? "Start your free 7-day trial"
          : "Start your first month"}
      </button>

      <p className="choose-plan-guarantee">
        30-day money back guarantee, no questions asked.
      </p>

      <div className="choose-plan-accordion">
        {accordionData.map((item, index) => (
          <div key={index} className="accordion-item">
            <div
              className="accordion-item__header"
              onClick={() => toggleAccordion(index)}
            >
              <h3 className="accordion-item__question">{item.question}</h3>
              <BiChevronDown
                className={`accordion-item__icon ${
                  openAccordion === index ? "accordion-item__icon--open" : ""
                }`}
              />
            </div>
            {openAccordion === index && (
              <p className="accordion-item__answer">{item.answer}</p>
            )}
          </div>
        ))}
      </div>

      <footer className="choose-plan-footer">
        <div className="choose-plan-footer__content">
          <div className="choose-plan-footer__columns">
            <div className="footer-column">
              <h4 className="footer-column__heading">Actions</h4>
              <ul className="footer-column__list">
                <li>
                  <a href="#">Summarist Magazine</a>
                </li>
                <li>
                  <a href="#">Cancel Subscription</a>
                </li>
                <li>
                  <a href="#">Help</a>
                </li>
                <li>
                  <a href="#">Contact Us</a>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-column__heading">Useful Links</h4>
              <ul className="footer-column__list">
                <li>
                  <a href="#">Pricing</a>
                </li>
                <li>
                  <a href="#">Summarist Business</a>
                </li>
                <li>
                  <a href="#">Gift Cards</a>
                </li>
                <li>
                  <a href="#">Authors & Publishers</a>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-column__heading">Company</h4>
              <ul className="footer-column__list">
                <li>
                  <a href="#">About</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Partners</a>
                </li>
                <li>
                  <a href="#">Code of Conduct</a>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-column__heading">Other</h4>
              <ul className="footer-column__list">
                <li>
                  <a href="#">Sitemap</a>
                </li>
                <li>
                  <a href="#">Legal Notice</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="choose-plan-footer__copyright">
            <p>
              <strong>Copyright © 2025 Summarist.</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ChoosePlan;
