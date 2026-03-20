import React, { useState, useEffect } from 'react';
import './CardEditor.css';

interface Template {
  id: number;
  image_url: string;
}

// Separate rectangles for message and name, defined as % of 1080x1080.
// Measured from the user's black-marker annotations.
interface TextZone {
  msg: { left: number; top: number; width: number; height: number };
  name: { left: number; top: number; width: number; height: number };
  msgSize: number;
  nameSize: number;
  msgMaxChars: number;
  nameMaxChars: number;
}

const TEXT_ZONES: Record<number, TextZone> = {
  // Template 1 (Light blue moon/mosque)
  1: {
    msg: { left: 13, top: 71, width: 74, height: 14 },
    name: { left: 37, top: 85, width: 26, height: 5 },
    msgSize: 38, nameSize: 28, msgMaxChars: 120, nameMaxChars: 22,
  },
  // Template 2 (Cityscape)
  2: {
    msg: { left: 28, top: 42, width: 44, height: 17 },
    name: { left: 42, top: 59, width: 16, height: 5 },
    msgSize: 38, nameSize: 28, msgMaxChars: 70, nameMaxChars: 15,
  },
  // Template 3 (Blush pink floral - previously Template 5)
  3: {
    msg: { left: 12, top: 21, width: 45, height: 27 },
    name: { left: 38, top: 49, width: 18, height: 6 },
    msgSize: 38, nameSize: 28, msgMaxChars: 110, nameMaxChars: 18,
  },
  // Template 4 (Emerald green background)
  4: {
    msg: { left: 27, top: 32, width: 46, height: 32 },
    name: { left: 39, top: 64, width: 22, height: 5 },
    msgSize: 40, nameSize: 28, msgMaxChars: 140, nameMaxChars: 20,
  },
  // Template 5 (New Dark Royal Blue & Gold)
  5: {
    msg: { left: 15, top: 65, width: 70, height: 20 },
    name: { left: 40, top: 86, width: 20, height: 6 },
    msgSize: 38, nameSize: 28, msgMaxChars: 140, nameMaxChars: 20,
  },
  // Template 6 (New Rose Gold & Cream)
  6: {
    msg: { left: 20, top: 40, width: 60, height: 25 },
    name: { left: 40, top: 68, width: 20, height: 6 },
    msgSize: 40, nameSize: 28, msgMaxChars: 140, nameMaxChars: 20,
  },
};

const DEFAULT_ZONE: TextZone = {
  msg: { left: 15, top: 65, width: 70, height: 15 },
  name: { left: 35, top: 85, width: 20, height: 6 },
  msgSize: 38, nameSize: 28, msgMaxChars: 100, nameMaxChars: 20,
};

const COLOR_PRESETS = [
  { name: 'সোনালি', value: '#fbbf24' },
  { name: 'সাদা', value: '#ffffff' },
  { name: 'কালো', value: '#1a1a1a' },
  { name: 'লাল', value: '#ef4444' },
  { name: 'সবুজ', value: '#22c55e' },
  { name: 'নীল', value: '#3b82f6' },
  { name: 'গোলাপি', value: '#ec4899' },
  { name: 'বেগুনি', value: '#a855f7' },
];

interface CardEditorProps {
  onBack: () => void;
}

const CardEditor: React.FC<CardEditorProps> = ({ onBack }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userMessage, setUserMessage] = useState<string>('');
  const [msgColor, setMsgColor] = useState<string>('#fbbf24');
  const [nameColor, setNameColor] = useState<string>('#ffffff');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

// Hardcoded templates so the app works even without the backend
const STATIC_TEMPLATES: Template[] = [
  { id: 1, image_url: '/templates/template_1.png' },
  { id: 2, image_url: '/templates/template_2.png' },
  { id: 3, image_url: '/templates/template_3.png' },
  { id: 4, image_url: '/templates/template_4.png' },
  { id: 5, image_url: '/templates/template_5.png' },
  { id: 6, image_url: '/templates/template_6.png' },
];

  useEffect(() => {
    // Use hardcoded templates immediately
    setTemplates(STATIC_TEMPLATES);
    setSelectedTemplate(STATIC_TEMPLATES[0]);
  }, []);

  const getZone = (): TextZone => {
    if (!selectedTemplate) return DEFAULT_ZONE;
    return TEXT_ZONES[selectedTemplate.id] || DEFAULT_ZONE;
  };

  // Draw rounded rect helper
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Wrap text to fit within a given max pixel width, honoring newlines
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const paragraphs = text.split('\n');
    const lines: string[] = [];

    for (const p of paragraphs) {
      if (p === '') {
        lines.push('');
        continue;
      }
      const words = p.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines;
  };

  const generateCanvasImage = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!selectedTemplate) return reject("No template");
      document.fonts.ready.then(() => {
        const S = 1080;
        const canvas = document.createElement("canvas");
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas not supported");

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = selectedTemplate.image_url;
        img.onload = () => {
          const zone = getZone();
          ctx.drawImage(img, 0, 0, S, S);

          // --- Message Box ---
          const mX = S * zone.msg.left / 100;
          const mY = S * zone.msg.top / 100;
          const mW = S * zone.msg.width / 100;
          const mH = S * zone.msg.height / 100;

          // Clip to bounds without drawing background
          ctx.save();
          roundRect(ctx, mX, mY, mW, mH, 8);
          ctx.clip();

          // Draw message text (centered, wrapped within box)
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = msgColor;
          ctx.font = `${zone.msgSize}px 'Kalpurush', sans-serif`;
          const msgText = userMessage || "আপনার বার্তা";
          const msgLines = wrapText(ctx, msgText, mW - 20);
          const msgLineH = zone.msgSize * 1.35;
          const totalMsgH = msgLines.length * msgLineH;
          const msgStartY = mY + (mH - totalMsgH) / 2 + msgLineH / 2;
          msgLines.forEach((line, i) => {
            ctx.fillText(line, mX + mW / 2, msgStartY + i * msgLineH);
          });
          ctx.restore();

          // --- Name Box ---
          if (userName.trim() !== "") {
            const nX = S * zone.name.left / 100;
            let nY = S * zone.name.top / 100;
            const nW = S * zone.name.width / 100;
            const nH = S * zone.name.height / 100;

            // Shift name up if message wasn't fully filled
            if (userMessage.trim() !== "") {
              const emptySpace = (mH - totalMsgH) / 2;
              if (emptySpace > 0) {
                nY -= emptySpace;
              }
            }

            // Clip to bounds
            ctx.save();
            roundRect(ctx, nX, nY, nW, nH, 8);
            ctx.clip();

            // Draw name text (centered within box)
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = nameColor;
            ctx.font = `${zone.nameSize}px 'Kalpurush', sans-serif`;
            ctx.fillText(userName, nX + nW / 2, nY + nH / 2);
            ctx.restore();
          }

          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => reject("Failed to load image for canvas");
      });
    });
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    try {
      const base64Image = await generateCanvasImage();
      
      // Fire-and-forget stats ping to backend (NO PII SENT!)
      fetch('/api/record-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: selectedTemplate.id })
      }).catch(err => console.error("Stats tracking failed", err));

      // Download directly from local browser memory
      const link = document.createElement("a");
      link.href = base64Image;
      link.download = `Eid_Card_${userName || 'Generated'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setGeneratedUrl(base64Image);
      setShowThankYou(true);
    } catch (err) {
      console.error(err);
      alert("কার্ড তৈরি করতে সমস্যা হয়েছে।");
    } finally {
      setIsGenerating(false);
    }
  };

  const zone = getZone();

  const getDynamicNameTopPct = () => {
    const defaultTop = zone.name.top;
    if (!userMessage || userMessage.trim() === '') return defaultTop;

    const paragraphs = userMessage.split('\n');
    let estimatedLines = 0;
    const cpl = (1080 * zone.msg.width / 100 - 20) / (zone.msgSize * 0.45);

    paragraphs.forEach(p => {
      if (p === '') {
        estimatedLines += 1;
      } else {
        estimatedLines += Math.ceil(p.length / cpl) || 1;
      }
    });

    const maxLines = Math.floor((1080 * zone.msg.height / 100) / (zone.msgSize * 1.35));
    if (estimatedLines >= maxLines) return defaultTop;

    const lineHeightPct = (zone.msgSize * 1.35 / 1080) * 100;
    const totalTextHeightPct = estimatedLines * lineHeightPct;
    const emptySpacePercent = (zone.msg.height - totalTextHeightPct) / 2;

    return defaultTop - emptySpacePercent;
  };

  return (
    <div className="editor-container">
      <div className="editor-sidebar">
        <button className="back-btn" onClick={onBack}>← ফিরে যান</button>
        <h2>🌙 ঈদ কার্ড তৈরি করুন</h2>

        <div className="form-group">
          <label>টেমপ্লেট বেছে নিন</label>
          <div className="template-grid">
            {templates.map(t => (
              <img
                key={t.id}
                src={t.image_url}
                className={`template-thumbnail ${selectedTemplate?.id === t.id ? 'active' : ''}`}
                onClick={() => { setSelectedTemplate(t); setGeneratedUrl(null); }}
                alt={`Template ${t.id}`}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <div className="label-with-count">
            <label>আপনার নাম (ঐচ্ছিক)</label>
            <span className="char-count">{userName.length}/{zone.nameMaxChars}</span>
          </div>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="যেমন: রাকেশ দেবনাথ"
            maxLength={zone.nameMaxChars}
          />
        </div>

        <div className="form-group">
          <div className="label-with-count">
            <label>আপনার বার্তা (বাংলায়)</label>
            <span className="char-count">{userMessage.length}/{zone.msgMaxChars}</span>
          </div>
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="যেমন: সবাইকে ঈদের শুভেচ্ছা ও অভিনন্দন"
            rows={2}
            maxLength={zone.msgMaxChars}
          />
        </div>

        <div className="form-group">
          <label>বার্তার রঙ</label>
          <div className="color-picker-row">
            {COLOR_PRESETS.map(c => (
              <button
                key={c.value}
                className={`color-swatch ${msgColor === c.value ? 'active' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setMsgColor(c.value)}
                title={c.name}
              />
            ))}
            <input type="color" value={msgColor} onChange={(e) => setMsgColor(e.target.value)} className="color-input" title="নিজের রঙ" />
          </div>
        </div>

        <div className="form-group">
          <label>নামের রঙ</label>
          <div className="color-picker-row">
            {COLOR_PRESETS.map(c => (
              <button
                key={c.value}
                className={`color-swatch ${nameColor === c.value ? 'active' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setNameColor(c.value)}
                title={c.name}
              />
            ))}
            <input type="color" value={nameColor} onChange={(e) => setNameColor(e.target.value)} className="color-input" title="নিজের রঙ" />
          </div>
        </div>

        <button className="generate-btn" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "তৈরি হচ্ছে..." : "✨ কার্ড তৈরি ও ডাউনলোড করুন"}
        </button>

        {generatedUrl && (
          <div className="result-area">
            <p>🎉 কার্ড স্বয়ংক্রিয়ভাবে ডাউনলোড হয়েছে!</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              ডাউনলোড না হলে <a href={generatedUrl} download={`Eid_Card.png`} style={{ color: '#fbbf24' }}>এখানে ক্লিক করুন</a>
            </p>
          </div>
        )}
      </div>

      <div className="editor-preview-container">
        <h3>লাইভ প্রিভিউ</h3>
        {selectedTemplate ? (
          <div className="preview-canvas">
            <img src={selectedTemplate.image_url} alt="Preview Background" className="preview-bg" />
            <div className="preview-text-layer">
              {/* Message box */}
              <div
                className="preview-text-box"
                style={{
                  left: `${zone.msg.left}%`,
                  top: `${zone.msg.top}%`,
                  width: `${zone.msg.width}%`,
                  height: `${zone.msg.height}%`,
                }}
              >
                <span className="preview-message" style={{ color: msgColor }}>
                  {userMessage || 'আপনার বার্তা'}
                </span>
              </div>
              {/* Name box */}
              {userName.trim() !== "" && (
                <div
                  className="preview-text-box"
                  style={{
                    left: `${zone.name.left}%`,
                    top: `${getDynamicNameTopPct()}%`,
                    width: `${zone.name.width}%`,
                    height: `${zone.name.height}%`,
                  }}
                >
                  <span className="preview-name" style={{ color: nameColor }}>
                    {userName}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="preview-placeholder">টেমপ্লেট লোড হচ্ছে...</div>
        )}
      </div>

      {showThankYou && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3> আপনাকে ধন্যবাদ!</h3>
            <p>আপনার ঈদ কার্ডটি সফলভাবে তৈরি এবং ডাউনলোড হয়েছে।</p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '1rem' }}>আপনার প্রিয়জনদের সাথে শেয়ার করুন এবং ঈদের আনন্দ উপভোগ করুন!</p>
            <button onClick={() => setShowThankYou(false)} className="close-btn">বন্ধ করুন</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardEditor;
