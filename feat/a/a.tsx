"use client";

import { useSpeechRecognizer } from "@/shared/lib/use-speech-recognizer";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [fileContent, setFileContent] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const {
    text,
    isListening,
    startListening,
    hasRecognitionSupport,
    stopListening,
  } = useSpeechRecognizer();

  useEffect(() => {
    if (text) {
      fetch(`/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })
        .then((response) => response.json())
        .then((data) => {
          const searchResult = data.files[0]; // Assuming the result is in data.result
          return fetch(`/api/${searchResult}`);
        })
        .then((response) => response.text())
        .then((data) => setFileContent(data))
        .catch((error) =>
          console.error("Error during search or fetching file:", error)
        );
    }
  }, [text]);

  const synth = window.speechSynthesis;

  const loadVoices = useCallback(() => {
    let voices = [];
    voices = synth.getVoices();
    if (voices.length === 0) {
      setTimeout(loadVoices, 100);
    }
  }, [synth]);

  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  const startSpeaking = () => {
    if (!synth) {
      console.error("Ваш браузер не поддерживает синтез речи.");
      return;
    }

    if (synth.speaking) {
      console.error("Синтез речи уже выполняется.");
      return;
    }

    if (fileContent !== "") {
      const chunkLength = 200; // Длина куска текста для чтения
      const textChunks: (string | undefined)[] = [];

      for (let i = 0; i < fileContent.length; i += chunkLength) {
        textChunks.push(fileContent.substring(i, i + chunkLength));
      }

      let currentChunk = 0;

      const speakChunk = () => {
        if (currentChunk < textChunks.length) {
          const utterThis = new SpeechSynthesisUtterance(
            textChunks[currentChunk]
          );
          utterThis.rate = 1.3; // Установка скорости
          utterThis.onend = () => {
            currentChunk++;
            speakChunk();
          };
          utterThis.onerror = (event) => {
            console.error("Ошибка синтеза речи:", event);
            setIsSpeaking(false);
          };
          synth.speak(utterThis);
        } else {
          console.log("Синтез речи завершен.");
          setIsSpeaking(false);
        }
      };

      speakChunk();
      setIsSpeaking(true);
    } else {
      console.error("Нет контента для синтеза речи.");
    }
  };

  const stopSpeaking = () => {
    if (synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="">
      {hasRecognitionSupport ? (
        <>
          {isListening ? (
            <button onClick={stopListening}>Стоп</button>
          ) : (
            <button onClick={startListening}>Старт</button>
          )}
          <div>{text}</div>
        </>
      ) : (
        <div>Ваш браузер не поддерживает распознавание речи</div>
      )}
      <div className="mt-4">
        <h2>File Content:</h2>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ node, ...props }) => (
              <img src={props.src ?? ""} style={{ maxWidth: "100%" }} alt="" />
            ),
          }}
        >
          {fileContent}
        </ReactMarkdown>
      </div>
      <div className="mt-4">
        <button onClick={isSpeaking ? stopSpeaking : startSpeaking}>
          {isSpeaking ? "Остановить чтение" : "Читать текст"}
        </button>
      </div>
    </div>
  );
}
