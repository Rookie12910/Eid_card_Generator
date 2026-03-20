import React, { useState, useEffect } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [totalCards, setTotalCards] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setTotalCards(data.total_generated))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="landing-container">
      {/* Background decorations */}
      <div className="stars"></div>
      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>
      <div className="lanterns">
        <span className="lantern lantern-left">🏮</span>
        <span className="lantern lantern-right">🏮</span>
      </div>

      <div className="landing-content">
        <div className="crescent-icon">🌙</div>
        <h1 className="landing-title">ঈদ মোবারক</h1>
        <p className="landing-subtitle">
          আপনার প্রিয়জনদের জন্য একটি সুন্দর ঈদ কার্ড তৈরি করুন!<br />
          টেমপ্লেট বেছে নিন, নাম ও বার্তা লিখুন, আর মুহূর্তেই ডাউনলোড করুন।
        </p>
        <button className="landing-cta" onClick={onStart}>
          ✨ কার্ড তৈরি শুরু করুন ✨
        </button>
        {totalCards !== null && (
          <div className="live-stats">
            <span className="stats-number">{totalCards}</span> টি কার্ড এ পর্যন্ত তৈরি হয়েছে!
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
