import express from "express";
import { createReadStream } from "fs";
import fs from "fs/promises"; // используем fs.promises для асинхронных операций
import path from "path";
import readline from "readline";

const app = express();
const PORT = 3001;
const DIRECTORY_PATH = "./files"; // Укажите путь к директории с файлами

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Добавляем middleware для статической раздачи файлов
app.use("/files", express.static(DIRECTORY_PATH));

// Функция для поиска текста в файлах и их именах
const searchFiles = async (searchText) => {
  const resultFiles = [];

  try {
    const files = await fs.readdir(DIRECTORY_PATH);

    const fileSearchPromises = files.map(async (file) => {
      const filePath = path.join(DIRECTORY_PATH, file);

      // Ищем текст в имени файла
      if (file.includes(searchText)) {
        resultFiles.push(file);
        return;
      }

      // Ищем текст в содержимом файла
      const fileStream = createReadStream(filePath, "utf8");
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (line.includes(searchText)) {
          resultFiles.push(file);
          rl.close();
          break;
        }
      }
    });

    // Ждем завершения всех асинхронных операций
    await Promise.all(fileSearchPromises);
  } catch (err) {
    throw new Error("Error reading files");
  }

  return resultFiles;
};
// Маршрут для поиска файлов
app.post("/search", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const matchingFiles = await searchFiles(text);
    // Возвращаем ссылки на найденные файлы
    const fileUrls = matchingFiles.map((file) => `/files/${file}`);
    res.status(200).json({ files: fileUrls });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while searching files" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
