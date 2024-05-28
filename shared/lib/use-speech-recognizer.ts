"use client";
import { useEffect, useState } from "react";

let recognition: any = null;
if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
}

export const useSpeechRecognizer = () => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      setText(e.results[0][0].transcript);
      recognition.stop();
      setIsListening(false);
    };
  }, []);

  const startListening = () => {
    setText("");
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };

  return {
    text,
    isListening,
    startListening,
    hasRecognitionSupport: !!recognition,
    stopListening,
  };
};
