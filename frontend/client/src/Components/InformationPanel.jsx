import React, { useRef, useEffect, useState } from 'react';

const InformationPanel = () => {
  const basicBoxRef = useRef(null);
  const staggerContainerRef = useRef(null);
  const scrollSectionRef = useRef(null);
  const scrollHeadingRef = useRef(null);
  const scrollTextRef = useRef(null);

  const [llmInfo, setLlmInfo] = useState("Click the button to get information about modern web development.");
  const [isLoadingLlm, setIsLoadingLlm] = useState(false);

  const fetchLlmInfo = async () => {
    setIsLoadingLlm(true);
    setLlmInfo("Fetching information... please wait.");

    let chatHistory = [];
    const prompt = "Provide a concise overview of modern web development, focusing on key technologies and trends (e.g., React, AI integration, serverless, progressive web apps). Keep it under 150 words.";
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setLlmInfo(text);
      } else {
        setLlmInfo("Could not retrieve information from LLM. Unexpected response format.");
      }
    } catch (error) {
      setLlmInfo(`Failed to fetch information: ${error.message}. Please try again.`);
    } finally {
      setIsLoadingLlm(false);
    }
  };

  useEffect(() => {
    if (window.gsap && basicBoxRef.current) {
      const ctx = window.gsap.context(() => {
        window.gsap.to(basicBoxRef.current, {
          x: 200,
          rotation: 360,
          duration: 1.5,
          ease: 'power1.out',
          repeat: -1,
          yoyo: true,
        });
      }, basicBoxRef);
      return () => ctx.revert();
    }
  }, []);

  useEffect(() => {
    if (window.gsap && staggerContainerRef.current) {
      const ctx = window.gsap.context(() => {
        window.gsap.from('.stagger-item', {
          opacity: 0,
          y: 50,
          stagger: 0.2,
          duration: 0.8,
          ease: 'back.out(1.7)',
        });
      }, staggerContainerRef);
      return () => ctx.revert();
    }
  }, []);

  useEffect(() => {
    if (window.gsap && window.ScrollTrigger && scrollSectionRef.current) {
      if (!window.gsap.plugins.includes(window.ScrollTrigger)) {
        window.gsap.registerPlugin(window.ScrollTrigger);
      }

      const ctx = window.gsap.context(() => {
        window.gsap.to(scrollHeadingRef.current, {
          y: -100,
          opacity: 0,
          scrollTrigger: {
            trigger: scrollSectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
            pin: true,
          },
        });

        window.gsap.from(scrollTextRef.current, {
          x: -200,
          opacity: 0,
          scrollTrigger: {
            trigger: scrollSectionRef.current,
            start: 'top center',
            end: 'center center',
            scrub: true,
          },
        });
      }, scrollSectionRef);
      return () => ctx.revert();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-inter">
      <header className="py-8 text-center bg-gradient-to-r from-purple-600 to-indigo-600 rounded-b-3xl shadow-xl">
        <h1 className="text-4xl font-bold mb-2">GSAP Animations in React</h1>
        <p className="text-lg opacity-80">Showcasing various animation techniques</p>
      </header>

      <section className="py-16 flex flex-col items-center justify-center min-h-[60vh] bg-gray-800 my-8 rounded-2xl mx-auto max-w-6xl shadow-lg p-6">
        <h2 className="text-3xl font-semibold mb-8 text-indigo-400">Basic Tween Animation</h2>
        <div
          ref={basicBoxRef}
          className="w-32 h-32 bg-blue-500 rounded-xl flex items-center justify-center text-lg font-bold shadow-md transform"
        >
          Animate Me!
        </div>
      </section>

      <section className="py-16 flex flex-col items-center justify-center min-h-[60vh] bg-gray-700 my-8 rounded-2xl mx-auto max-w-6xl shadow-lg p-6">
        <h2 className="text-3xl font-semibold mb-8 text-purple-400">Staggered Entry Animation</h2>
        <div
          ref={staggerContainerRef}
          className="flex flex-wrap justify-center items-center gap-4 p-4 bg-gray-600 rounded-lg shadow-inner"
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="stagger-item w-24 h-24 bg-green-500 rounded-lg flex items-center justify-center text-base font-semibold shadow-md"
            >
              Box {i + 1}
            </div>
          ))}
        </div>
      </section>

      <div className="h-[70vh] flex items-center justify-center text-2xl text-gray-400">
        <p>Scroll down for a ScrollTrigger animation!</p>
      </div>

      <section
        ref={scrollSectionRef}
        className="relative flex flex-col items-center justify-center min-h-[100vh] bg-gradient-to-br from-teal-500 to-blue-600 rounded-t-2xl shadow-xl"
      >
        <h1 ref={scrollHeadingRef} className="text-6xl font-extrabold text-white mb-6 p-4 text-center">
          ScrollTrigger in Action
        </h1>
        <p ref={scrollTextRef} className="text-2xl text-white opacity-90 max-w-2xl text-center leading-relaxed p-4">
          Watch this text animate and the section pin as you scroll through. This powerful GSAP plugin links animations directly to your scroll position, creating captivating visual experiences.
        </p>
      </section>

      <section className="py-16 flex flex-col items-center justify-center min-h-[50vh] bg-gray-800 my-8 rounded-2xl mx-auto max-w-6xl shadow-lg p-6">
        <h2 className="text-3xl font-semibold mb-8 text-yellow-400">LLM Information Panel</h2>
        <button
          onClick={fetchLlmInfo}
          disabled={isLoadingLlm}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 mb-6
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingLlm ? 'Loading...' : 'Get Web Dev Info from LLM'}
        </button>
        <div className="bg-gray-700 p-6 rounded-lg shadow-inner w-full max-w-2xl text-gray-200 text-lg leading-relaxed">
          {llmInfo}
        </div>
      </section>

      <div className="h-[20vh] flex items-center justify-center text-2xl text-gray-400 bg-gray-900">
        <p>Explore more!</p>
      </div>

      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            overflow-x: hidden;
          }
        `}
      </style>
    </div>
  );
};

export default InformationPanel;
