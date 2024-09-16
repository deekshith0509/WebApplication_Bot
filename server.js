const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const moment = require("moment-timezone");
require("dotenv").config(); // Load environment variables
// URL of the fileforwardbot endpoint to keep alive

/*
const url = 'https://fileforwardbot.glitch.me';

// Function to make a request to the URL
const keepAlive = async () => {
  try {
    const response = await axios.get(url);
    console.log('Keep-alive request successful for fileforwardbot:', response.status);
  } catch (error) {
    console.error('Error making keep-alive request for fileforwardbot:', error.message);
  }
};
// Call the function every 4 minutes (240,000 milliseconds)
setInterval(keepAlive, 240000);

// Optionally, call the function once at startup
keepAlive();

*/
// Retrieve tokens from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const apiKey = process.env.WEATHER_API_KEY; // Use your OpenWeatherMap API key

// Create a bot that uses polling
const bot = new TelegramBot(token, { polling: true });

// Welcome message and instructions
const manualMessage = `
Welcome! I am your friendly bot. Here are the commands you can use:
- /start: Personalized greeting and commands
- /run: Initiate a CLI session
- /joke: Get a random joke from the list
- /weather [location]: Get the current weather info for the specified location or default to Hyderabad
- /forecast [location]: Get a 5-day weather forecast for the specified location or default to Hyderabad
- /userinfo: Get detailed user information
- /photo: Send a sample photo
- /menu: Show interactive command options
- /quiz: Start a quiz session
- /quit: Exit the quiz session
- /convert [amount] to [to_currency]: Convert currency from INR to the specified currency
- /exit: End the CLI session
- /todo [list or add "task" or remove "task"]: Manage your to-do list (list, add, or remove items)
`;

// Store user data
const userPreferences = {};
const quizSessions = {};
const todoLists = {};

// Send welcome message
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  const personalizedGreeting = getTimeBasedGreeting(firstName);
  bot.sendMessage(chatId, `${personalizedGreeting}\n\n${manualMessage}`);
});

// Define weather descriptions
const weatherDescriptions = {
  Clear: "Clear sky with no clouds. It is sunny and bright.",
  Clouds: "Cloudy weather with various amounts of clouds in the sky.",
  Rain: "Rainy weather with varying intensities of precipitation.",
  Drizzle: "Light rain with very fine droplets.",
  Thunderstorm: "Thunderstorms with possible lightning and heavy rain.",
  Snow: "Snowfall with varying intensities and accumulation.",
  Mist: "Low visibility due to mist, often with reduced visibility.",
  Fog: "Dense fog reducing visibility significantly.",
  Haze: "Reduced visibility due to haze or dust in the air.",
  // Add more descriptions as needed
};

// Fetch and respond with weather information
bot.onText(/\/weather(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const location = match[1] ? match[1] : "Hyderabad"; // Default location to Hyderabad
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    location
  )}&units=metric&appid=${apiKey}`;

  try {
    const response = await axios.get(weatherUrl);
    const data = response.data;

    // Convert timestamps to Kolkata time
    const sunriseTime = moment
      .unix(data.sys.sunrise)
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");
    const sunsetTime = moment
      .unix(data.sys.sunset)
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    // Get weather condition and description
    const condition = data.weather[0].main;
    const description =
      weatherDescriptions[condition] ||
      "No detailed description available for this weather condition.";

    let weatherMessage = `Weather details for ${data.name}, ${data.sys.country}:\n\n`;
    weatherMessage += `**Temperature**: ${data.main.temp}°C\n`;
    weatherMessage += `**Feels Like**: ${data.main.feels_like}°C\n`;
    weatherMessage += `**Minimum Temperature**: ${data.main.temp_min}°C\n`;
    weatherMessage += `**Maximum Temperature**: ${data.main.temp_max}°C\n`;
    weatherMessage += `**Pressure**: ${data.main.pressure} hPa\n`;
    weatherMessage += `**Humidity**: ${data.main.humidity}%\n`;
    weatherMessage += `**Weather Condition**: ${condition}\n`;
    weatherMessage += `**Weather Description**: ${description}\n`;
    weatherMessage += `**Visibility**: ${data.visibility} meters\n`;
    weatherMessage += `**Wind Speed**: ${data.wind.speed} m/s\n`;
    weatherMessage += `**Wind Direction**: ${data.wind.deg}°\n`;
    weatherMessage += `**Cloudiness**: ${data.clouds.all}%\n`;
    weatherMessage += `**Sunrise**: ${sunriseTime}\n`;
    weatherMessage += `**Sunset**: ${sunsetTime}\n`;

    bot.sendMessage(chatId, weatherMessage, { parse_mode: "Markdown" });
  } catch (error) {
    bot.sendMessage(
      chatId,
      "Sorry, I could not fetch the weather information."
    );
  }
});

// Fetch and respond with weather forecast
bot.onText(/\/forecast(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const location = match[1] ? match[1] : "Hyderabad"; // Default location to Hyderabad
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    location
  )}&units=metric&appid=${apiKey}`;

  try {
    const response = await axios.get(forecastUrl);
    const data = response.data;
    let forecastMessage = `Weather forecast for ${data.city.name}, ${data.city.country}:\n\n`;

    data.list.forEach((entry) => {
      forecastMessage += `**Date**: ${entry.dt_txt}\n`;
      forecastMessage += `**Temperature**: ${entry.main.temp}°C\n`;
      forecastMessage += `**Weather**: ${entry.weather[0].description}\n\n`;
    });

    bot.sendMessage(chatId, forecastMessage, { parse_mode: "Markdown" });
  } catch (error) {
    bot.sendMessage(chatId, "Sorry, I could not fetch the weather forecast.");
  }
});


/*
// This section of code adds a functionality of serving the direct filelinks uploaded to the bot.
This exposes the API key of the bot.So, It was commented. 
bot.on("document", (msg) => {
    const chatId = msg.chat.id;
    const document = msg.document;

    // Check if the file is a PDF and size is under 20MB
    if (document.mime_type === "application/pdf" && document.file_size <= 20 * 1024 * 1024) {
        bot.getFile(document.file_id).then(file => {
            const filePath = file.file_path;
            const fileLink = `https://api.telegram.org/file/bot${token}/${filePath}`;
            
            // Send the download link to the user
            bot.sendMessage(chatId, `Here is your PDF file link: ${fileLink}`);
        }).catch(err => {
            bot.sendMessage(chatId, `Failed to retrieve the file: ${err.message}`);
        });
    } else {
        bot.sendMessage(chatId, "Please upload a PDF file under 20MB.");
    }
});

*/




// Show help message
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, manualMessage);
});

// Respond to messages with static AI-like replies and personalized greetings
const greetings = [
  "Hello {firstName}! How can I assist you today?",
  "Hi {firstName}! What’s up?",
  "Hey {firstName}! How’s it going?",
  "Greetings {firstName}! How can I help you?",
];
const smallTalk = [
  "I love chatting with you!",
  "Did you know I can tell you jokes? Just type /joke!",
  "How about we play a game? Just ask!",
  "What’s your favorite thing to do?",
];
const compliments = [
  "You're awesome!",
  "I appreciate you!",
  "You're fantastic!",
  "Thanks for chatting with me!",
];
const jokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "What do you get when you cross a snowman and a vampire? Frostbite!",
];
const fallbackResponses = [
  "I'm not sure how to respond to that. Can you ask me something else?",
  "That’s interesting! Could you tell me more?",
  "I didn't quite get that. Can you rephrase your question?",
  "I’m still learning. Can you try asking something else?",
];

// Function to get a random item from an array
function getRandomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Function to get a time-based personalized greeting
function getTimeBasedGreeting(firstName) {
  const now = moment().tz("Asia/Kolkata");
  const hours = now.hours();
  let greeting;

  if (hours < 12) {
    greeting = `Good morning ${firstName}!`;
  } else if (hours < 18) {
    greeting = `Good afternoon ${firstName}!`;
  } else {
    greeting = `Good evening ${firstName}!`;
  }

  return greeting;
}

// Function to get a random personalized greeting
function getPersonalizedGreeting(firstName) {
  const greeting = getRandomResponse(greetings);
  return greeting.replace("{firstName}", firstName);
}


const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');



// Store user sessions
const userSessions = new Map();

// Function to create a new session directory
function createSessionDir(userId) {
    const sessionDir = path.join(os.tmpdir(), `bot-session-${userId}`);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir);
    }
    return sessionDir;
}

// Function to remove a session directory
function removeSessionDir(userId) {
    const sessionDir = path.join(os.tmpdir(), `bot-session-${userId}`);
    if (fs.existsSync(sessionDir)) {
        fs.rmdirSync(sessionDir, { recursive: true });
    }
}

// Function to execute a command and handle the output
function executeCommand(query, sessionDir, callback) {
    let output = '';
    const command = exec(query, { cwd: sessionDir });

    command.stdout.on('data', (data) => {
        output += data.toString(); // Accumulate stdout data
    });

    command.stderr.on('data', (data) => {
        output += data.toString(); // Accumulate stderr data
    });

    command.on('close', (code) => {
        if (code !== 0) {
            output += `\nProcess exited with code ${code}`;
        }
        callback(output);
    });
}

// Function to handle large outputs
function handleLargeOutput(chatId, output) {
    if (output.length > 4096) {
        // Create a temporary file
        const filePath = path.join(os.tmpdir(), `output-${chatId}.txt`);
        fs.writeFileSync(filePath, output);

        // Send the file
        bot.sendDocument(chatId, filePath).then(() => {
            // Remove the file after sending
            fs.unlinkSync(filePath);
        }).catch(err => {
            bot.sendMessage(chatId, `Error sending file: ${err.message}`);
        });
    } else {
        bot.sendMessage(chatId, `Output: ${output}`);
    }
}

// Function to handle messages
bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    // Check if a session is active for this user
    if (userSessions.has(chatId)) {
        // Handle session-related commands
        const session = userSessions.get(chatId);

        if (msg.text === "/exit") {
            // End session
            removeSessionDir(chatId);
            userSessions.delete(chatId);
            bot.sendMessage(chatId, "Session ended.");
        } else {
            // Execute the command in the session's directory
            const query = msg.text;
            //bot.sendMessage(chatId, "Executing command, please wait...");

            executeCommand(query, session.dir, (output) => {
                handleLargeOutput(chatId, output);
            });
        }
    } else if (msg.text && !msg.text.startsWith("/")) {
        // Handle casual chat if no session is active
        const user = msg.from;
        const firstName = user.first_name;
        let response;
        const text = msg.text.toLowerCase();

        if (text.includes("hi") || text.includes("hello")) {
            response = getPersonalizedGreeting(firstName);
        } else if (text.includes("how are you")) {
            response = getRandomResponse(smallTalk);
        } else if (text.includes("thanks") || text.includes("thank you")) {
            response = getRandomResponse(compliments);
        } else if (text.includes("joke")) {
            response = getRandomResponse(jokes);
        } else if (text.includes("game")) {
            response =
                "I can tell you a joke or ask a trivia question. What would you prefer?";
        } else if (text.includes("trivia")) {
            response = "Here’s a trivia question: What is the capital of France?";
        } else if (text.includes("capital of france")) {
            response = "The capital of France is Paris.";
        } else {
            response = getRandomResponse(fallbackResponses);
        }

        bot.sendMessage(chatId, response);
    }
});

// Command to start a session
bot.onText(/\/run/, (msg) => {
    const chatId = msg.chat.id;

    // Initialize session for the user
    userSessions.set(chatId, { 
        active: true,
        dir: createSessionDir(chatId) 
    });

    bot.sendMessage(chatId, "Session created. You can now interact with the Linux shell. Type your commands, and type /exit to end the session.");
});



// Respond with a joke
bot.onText(/\/joke/, (msg) => {
  const chatId = msg.chat.id;
  const joke = getRandomResponse(jokes);
  bot.sendMessage(chatId, joke);
});

// Respond with user info
bot.onText(/\/userinfo/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  // Fetch the channel or chat information if applicable
  const currentChannelId = msg.chat.type === 'channel' ? chatId : "Not applicable";

  const userInfo = `
User Information:
- **First Name**: ${user.first_name}
- **Last Name**: ${user.last_name || "Not provided"}
- **Username**: ${user.username || "Not provided"}
- **Language**: ${user.language_code}
- **User ID**: ${user.id}
- **Chat ID**: ${chatId}
- **Current Channel ID**: ${currentChannelId}
`;

  bot.sendMessage(chatId, userInfo, { parse_mode: "Markdown" });
});


// Respond with a photo
bot.onText(/\/photo/, (msg) => {
  const chatId = msg.chat.id;

  // Generate a unique URL by appending a timestamp
  const uniqueImageUrl = `https://picsum.photos/900?${Date.now()}`;

  bot.sendPhoto(chatId, uniqueImageUrl);
});

// Respond with a menu of options (inline keyboard)
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Get Weather", callback_data: "weather" }],
        [{ text: "Tell a Joke", callback_data: "joke" }],
        [{ text: "Show User Info", callback_data: "userinfo" }],
      ],
    },
  };

  bot.sendMessage(chatId, "Choose an option:", options);
});

// Handle menu option selection
bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;

  if (callbackQuery.data === "weather") {
    bot.sendMessage(
      chatId,
      "Please use the /weather command to get weather information."
    );
  } else if (callbackQuery.data === "joke") {
    const joke = getRandomResponse(jokes);
    bot.sendMessage(chatId, joke);
  } else if (callbackQuery.data === "userinfo") {
    const user = message.from;

    const userInfo = `
User Information:
- **First Name**: ${user.first_name}
- **Last Name**: ${user.last_name || "Not provided"}
- **Username**: ${user.username || "Not provided"}
- **Language**: ${user.language_code}
- **User ID**: ${user.id}
`;

    bot.sendMessage(chatId, userInfo, { parse_mode: "Markdown" });
  }
});

const shuffle = require("lodash.shuffle");

// List of 50 questions
const allQuestions = [
  {
    question: "What is the capital of France?",
    options: ["Paris", "Berlin", "Madrid"],
    answer: "Paris",
  },
  {
    question: "What is the largest planet in our solar system?",
    options: ["Earth", "Jupiter", "Mars"],
    answer: "Jupiter",
  },
  {
    question: "Who wrote 'To Kill a Mockingbird'?",
    options: ["Harper Lee", "Mark Twain", "Ernest Hemingway"],
    answer: "Harper Lee",
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Au", "Ag", "Pb"],
    answer: "Au",
  },
  {
    question: "What is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino"],
    answer: "Vatican City",
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Leonardo da Vinci", "Claude Monet"],
    answer: "Leonardo da Vinci",
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond"],
    answer: "Diamond",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Mercury"],
    answer: "Mars",
  },
  {
    question: "Who developed the theory of relativity?",
    options: ["Isaac Newton", "Albert Einstein", "Niels Bohr"],
    answer: "Albert Einstein",
  },
  {
    question: "In which year did the Titanic sink?",
    options: ["1912", "1905", "1898"],
    answer: "1912",
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean"],
    answer: "Pacific Ocean",
  },
  {
    question: "Who is known as the Father of Computers?",
    options: ["Charles Babbage", "Alan Turing", "Ada Lovelace"],
    answer: "Charles Babbage",
  },
  {
    question: "Which element has the atomic number 1?",
    options: ["Hydrogen", "Helium", "Oxygen"],
    answer: "Hydrogen",
  },
  {
    question: "What is the capital of Japan?",
    options: ["Tokyo", "Seoul", "Beijing"],
    answer: "Tokyo",
  },
  {
    question: "Who wrote 'Pride and Prejudice'?",
    options: ["Jane Austen", "Charlotte Brontë", "Emily Dickinson"],
    answer: "Jane Austen",
  },
  {
    question: "What is the longest river in the world?",
    options: ["Amazon River", "Nile River", "Yangtze River"],
    answer: "Nile River",
  },
  {
    question: "Which country is known as the Land of the Rising Sun?",
    options: ["Japan", "China", "South Korea"],
    answer: "Japan",
  },
  {
    question: "What is the chemical symbol for silver?",
    options: ["Si", "Au", "Ag"],
    answer: "Ag",
  },
  {
    question: "Who was the first person to walk on the moon?",
    options: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin"],
    answer: "Neil Armstrong",
  },
  {
    question: "Which famous scientist formulated the laws of motion?",
    options: ["Isaac Newton", "Galileo Galilei", "Nicolaus Copernicus"],
    answer: "Isaac Newton",
  },
  {
    question: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Canberra"],
    answer: "Canberra",
  },
  {
    question: "Who is known for the theory of evolution?",
    options: ["Charles Darwin", "Gregor Mendel", "Louis Pasteur"],
    answer: "Charles Darwin",
  },
  {
    question: "Which country is the largest by land area?",
    options: ["Russia", "Canada", "China"],
    answer: "Russia",
  },
  {
    question: "What is the main ingredient in guacamole?",
    options: ["Tomato", "Avocado", "Pepper"],
    answer: "Avocado",
  },
  {
    question: "Who painted 'Starry Night'?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Salvador Dalí"],
    answer: "Vincent van Gogh",
  },
  {
    question: "Which is the largest desert in the world?",
    options: ["Sahara", "Gobi", "Antarctic Desert"],
    answer: "Antarctic Desert",
  },
  {
    question: "What is the tallest mountain in the world?",
    options: ["K2", "Everest", "Kangchenjunga"],
    answer: "Everest",
  },
  {
    question: "Who is the author of the Harry Potter series?",
    options: ["J.K. Rowling", "J.R.R. Tolkien", "C.S. Lewis"],
    answer: "J.K. Rowling",
  },
  {
    question: "Which planet is known for its rings?",
    options: ["Saturn", "Uranus", "Neptune"],
    answer: "Saturn",
  },
  {
    question: "What is the largest mammal in the ocean?",
    options: ["Shark", "Whale", "Dolphin"],
    answer: "Whale",
  },
  {
    question: "In what year did World War I begin?",
    options: ["1914", "1912", "1918"],
    answer: "1914",
  },
  {
    question: "What is the capital of Canada?",
    options: ["Toronto", "Ottawa", "Vancouver"],
    answer: "Ottawa",
  },
  {
    question: "Who is known as the Queen of Pop?",
    options: ["Madonna", "Lady Gaga", "Beyoncé"],
    answer: "Madonna",
  },
  {
    question: "What is the currency of Japan?",
    options: ["Yuan", "Won", "Yen"],
    answer: "Yen",
  },
  {
    question: "Who was the first President of the United States?",
    options: ["George Washington", "Thomas Jefferson", "Abraham Lincoln"],
    answer: "George Washington",
  },
  {
    question: "Which element is represented by the symbol 'O'?",
    options: ["Oxygen", "Osmium", "Oganesson"],
    answer: "Oxygen",
  },
  {
    question: "What is the name of the largest volcano in the solar system?",
    options: ["Mount Everest", "Olympus Mons", "Kilauea"],
    answer: "Olympus Mons",
  },
  {
    question: "Who is the founder of Microsoft?",
    options: ["Bill Gates", "Steve Jobs", "Mark Zuckerberg"],
    answer: "Bill Gates",
  },
  {
    question: "Which is the smallest bone in the human body?",
    options: ["Stapes", "Incus", "Malleus"],
    answer: "Stapes",
  },
  {
    question: "What is the chemical formula for water?",
    options: ["H2O", "CO2", "O2"],
    answer: "H2O",
  },
  {
    question: "Who is known as the father of modern physics?",
    options: ["Albert Einstein", "Niels Bohr", "James Clerk Maxwell"],
    answer: "Albert Einstein",
  },
  {
    question: "Which ocean is the second largest in the world?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"],
    answer: "Atlantic Ocean",
  },
  {
    question: "Who was the 16th President of the United States?",
    options: ["Abraham Lincoln", "Andrew Johnson", "Ulysses S. Grant"],
    answer: "Abraham Lincoln",
  },
  {
    question: "What is the capital of Italy?",
    options: ["Rome", "Milan", "Naples"],
    answer: "Rome",
  },
  {
    question: "Which country is known as the Land of the Long White Cloud?",
    options: ["Australia", "New Zealand", "Fiji"],
    answer: "New Zealand",
  },
  {
    question: "Who was the first woman to win a Nobel Prize?",
    options: ["Marie Curie", "Rosalind Franklin", "Ada Lovelace"],
    answer: "Marie Curie",
  },
  {
    question:
      "What is the primary ingredient in traditional Japanese miso soup?",
    options: ["Soybean", "Rice", "Seaweed"],
    answer: "Soybean",
  },
  {
    question:
      "Which famous scientist is known for his laws of planetary motion?",
    options: ["Johannes Kepler", "Galileo Galilei", "Isaac Newton"],
    answer: "Johannes Kepler",
  },
  {
    question: "What is the largest land animal?",
    options: ["Elephant", "Hippopotamus", "Rhinoceros"],
    answer: "Elephant",
  },
  {
    question: "Who is considered the father of modern chemistry?",
    options: ["Antoine Lavoisier", "Dmitri Mendeleev", "Robert Boyle"],
    answer: "Antoine Lavoisier",
  },
  {
    question: "What is the most spoken language in the world?",
    options: ["English", "Mandarin", "Spanish"],
    answer: "Mandarin",
  },
  {
    question: "Who wrote 'The Catcher in the Rye'?",
    options: ["J.D. Salinger", "F. Scott Fitzgerald", "John Steinbeck"],
    answer: "J.D. Salinger",
  },
  {
    question: "Which country is known as the Land of Fire and Ice?",
    options: ["Iceland", "Norway", "Greenland"],
    answer: "Iceland",
  },
  {
    question: "What is the capital city of Brazil?",
    options: ["Rio de Janeiro", "São Paulo", "Brasília"],
    answer: "Brasília",
  },
  {
    question: "Who is famous for his theory of gravity?",
    options: ["Isaac Newton", "Galileo Galilei", "Albert Einstein"],
    answer: "Isaac Newton",
  },
  {
    question: "What is the name of the galaxy that contains our solar system?",
    options: ["Andromeda", "Milky Way", "Triangulum"],
    answer: "Milky Way",
  },
];

// Start a quiz game
bot.onText(/\/quiz/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Shuffle questions to ensure random order
  const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);

  quizSessions[userId] = {
    score: 0,
    questionsAsked: 0,
    questions: shuffledQuestions,
  };

  bot.sendMessage(chatId, "Quiz started! Type /quit to end the quiz.");
  sendQuizQuestion(chatId, userId);
});

function sendQuizQuestion(chatId, userId) {
  const session = quizSessions[userId];
  if (session && session.questionsAsked < session.questions.length) {
    const questionData = session.questions[session.questionsAsked];
    const options = questionData.options.map((option, index) => ({
      text: option,
      callback_data: `${index}`,
    }));
    const questionMessage = `${questionData.question}\n\nChoose an option:`;
    bot.sendMessage(chatId, questionMessage, {
      reply_markup: {
        inline_keyboard: [options],
      },
    });
  } else {
    bot.sendMessage(
      chatId,
      `Quiz finished! Your score is: ${session.score}/${session.questionsAsked}`
    );
    delete quizSessions[userId]; // End the quiz session
  }
}

// Handle quiz answer selection
bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const userId = callbackQuery.from.id;

  if (quizSessions[userId]) {
    const session = quizSessions[userId];
    const questionData = session.questions[session.questionsAsked];
    const selectedOption = callbackQuery.data;
    const correctAnswer = questionData.answer;

    if (questionData.options[selectedOption] === correctAnswer) {
      session.score++;
      bot.sendMessage(chatId, "Correct!");
    } else {
      bot.sendMessage(
        chatId,
        `Wrong! The correct answer was: ${correctAnswer}`
      );
    }

    session.questionsAsked++;
    sendQuizQuestion(chatId, userId);
  }
});

// End the quiz session
bot.onText(/\/quit/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (quizSessions[userId]) {
    const session = quizSessions[userId];
    bot.sendMessage(
      chatId,
      `Quiz ended. Your final score: ${session.score}/${session.questions.length}`
    );
    delete quizSessions[userId];
  } else {
    bot.sendMessage(chatId, "You are not currently in a quiz session.");
  }
});

// To-do list management
bot.onText(/\/todo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const command = match[1];

  if (!todoLists[userId]) {
    todoLists[userId] = [];
  }

  if (command.startsWith("add ")) {
    const item = command.replace("add ", "");
    todoLists[userId].push({ item, completed: false });
    bot.sendMessage(chatId, `Item added to your to-do list: ${item}`);
  } else if (command.startsWith("remove ")) {
    const index = parseInt(command.replace("remove ", ""));
    if (index >= 0 && index < todoLists[userId].length) {
      const removedItem = todoLists[userId].splice(index, 1);
      bot.sendMessage(
        chatId,
        `Item removed from your to-do list: ${removedItem[0].item}`
      );
    } else {
      bot.sendMessage(
        chatId,
        `Invalid index. Please provide a valid item number.`
      );
    }
  } else if (command.startsWith("complete ")) {
    const itemName = command.replace("complete ", "").trim();
    const itemIndex = todoLists[userId].findIndex(
      (item) => item.item === itemName
    );
    if (itemIndex !== -1) {
      todoLists[userId][itemIndex].completed = true;
      bot.sendMessage(chatId, `Item marked as completed: ${itemName}`);
    } else {
      bot.sendMessage(chatId, `Item not found in your to-do list.`);
    }
  } else if (command === "list") {
    const todoList = todoLists[userId];
    if (todoList.length === 0) {
      bot.sendMessage(chatId, "Your to-do list is empty.");
    } else {
      let todoMessage = "Your to-do list:\n\n";
      todoList.forEach((item, index) => {
        todoMessage += `${index + 1}. ${item.item} ${
          item.completed ? "(Completed)" : ""
        }\n`;
      });
      bot.sendMessage(chatId, todoMessage);
    }
  } else {
    bot.sendMessage(
      chatId,
      "Invalid to-do command. Use 'add', 'remove', 'complete', or 'list'."
    );
  }
});

// Currency conversion (INR to other currencies)
bot.onText(/\/convert (\d+(\.\d{1,2})?) to (\w{3})/, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = parseFloat(match[1]);
  const currency = match[3].toUpperCase();
  const apiUrl = `https://api.exchangerate-api.com/v4/latest/INR`;

  try {
    const response = await axios.get(apiUrl);
    const rates = response.data.rates;

    if (rates[currency]) {
      const convertedAmount = (amount * rates[currency]).toFixed(2);
      bot.sendMessage(
        chatId,
        `${amount} INR is equal to ${convertedAmount} ${currency}.`
      );
    } else {
      bot.sendMessage(chatId, `Currency not supported: ${currency}`);
    }
  } catch (error) {
    bot.sendMessage(chatId, "Sorry, I could not fetch the conversion rate.");
  }
});














const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

// In-memory databases
let quotes = [
  {
    id: 1,
    content: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
  },
  {
    id: 2,
    content: "Get busy living or get busy dying.",
    author: "Stephen King",
  },
  {
    id: 3,
    content: "The purpose of our lives is to be happy.",
    author: "Dalai Lama",
  },
  {
    id: 4,
    content: "You only live once, but if you do it right, once is enough.",
    author: "Mae West",
  },
  {
    id: 5,
    content:
      "In three words I can sum up everything I've learned about life: it goes on.",
    author: "Robert Frost",
  },
  {
    id: 6,
    content:
      "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    author: "Ralph Waldo Emerson",
  },
  {
    id: 7,
    content: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
  },
  {
    id: 8,
    content: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
  },
  {
    id: 9,
    content:
      "To live is the rarest thing in the world. Most people exist, that is all.",
    author: "Oscar Wilde",
  },
  {
    id: 10,
    content:
      "Life isn't about finding yourself. Life is about creating yourself.",
    author: "George Bernard Shaw",
  },
  {
    id: 11,
    content: "The best way to predict the future is to invent it.",
    author: "Alan Kay",
  },
  {
    id: 12,
    content:
      "Be not afraid of life. Believe that life is worth living, and your belief will help create the fact.",
    author: "William James",
  },
  {
    id: 13,
    content: "Everything you’ve ever wanted is on the other side of fear.",
    author: "George Addair",
  },
  {
    id: 14,
    content: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    id: 15,
    content:
      "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    id: 16,
    content: "Act as if what you do makes a difference. It does.",
    author: "William James",
  },
  {
    id: 17,
    content:
      "Happiness is not something ready-made. It comes from your own actions.",
    author: "Dalai Lama",
  },
  {
    id: 18,
    content:
      "Do not wait to strike till the iron is hot, but make it hot by striking.",
    author: "William Butler Yeats",
  },
  {
    id: 19,
    content:
      "The only limit to our realization of tomorrow is our doubts of today.",
    author: "Franklin D. Roosevelt",
  },
  {
    id: 20,
    content:
      "You have within you right now, everything you need to deal with whatever the world can throw at you.",
    author: "Brian Tracy",
  },
  {
    id: 21,
    content:
      "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela",
  },
  {
    id: 22,
    content:
      "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  {
    id: 23,
    content:
      "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
  {
    id: 24,
    content: "Life is either a daring adventure or nothing at all.",
    author: "Helen Keller",
  },
  {
    id: 25,
    content: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
  },
  {
    id: 26,
    content:
      "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
  },
  {
    id: 27,
    content:
      "You don’t have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
  },
  {
    id: 28,
    content: "Don’t watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    id: 29,
    content: "Everything has beauty, but not everyone can see.",
    author: "Confucius",
  },
  {
    id: 30,
    content: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    id: 31,
    content: "Life is really simple, but we insist on making it complicated.",
    author: "Confucius",
  },
  {
    id: 32,
    content: "The only thing we have to fear is fear itself.",
    author: "Franklin D. Roosevelt",
  },
  {
    id: 33,
    content:
      "Success usually comes to those who are too busy to be looking for it.",
    author: "Henry David Thoreau",
  },
  {
    id: 34,
    content:
      "Don’t be pushed around by the fears in your mind. Be led by the dreams in your heart.",
    author: "Roy T. Bennett",
  },
  {
    id: 35,
    content: "You do not find the happy life. You make it.",
    author: "Camilla E. Kimball",
  },
  {
    id: 36,
    content: "It is not the length of life, but the depth of life.",
    author: "Ralph Waldo Emerson",
  },
];

let movies = [
  { id: 1, title: "inception", director: "Christopher Nolan", year: 2010 },
  {
    id: 2,
    title: "The matrix",
    director: "Lana Wachowski, Lilly Wachowski",
    year: 1999,
  },
];



// Middleware to handle JSON
app.use(express.json());
// Route to handle /





app.get('/', (req, res) => {
  const jsonData = {
    name: "Deekshith",
    role: "Developer",
    description: "I am an enthusiastic developer with a passion for exploring new technologies. I love experimenting and am always ready to take on new challenges to build innovative solutions.",
    contact: {
      email: "ANAYMOUS@mail.com",
      website: "https://your-website.com"
    }
  };

  res.send(`

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telegram Bot Overview</title>
  <style>
    /* Basic reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #333;
      background-color: #f5f5f5;
      transition: background-color 0.5s, color 0.5s;
    }

    header {
      background-color: #333;
      color: #fff;
      padding: 20px;
      text-align: center;
      position: relative;
    }

    .gradient-text {
      background: linear-gradient(90deg, #FFD700  ,  	#a95a1c );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 2.5rem;
    }




    section {
      padding: 17px;
      margin: 10px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      animation: fadeIn 1s ease-out;
    }

    h2 {
      margin-bottom: 10px;
      font-size: 1.3rem;
      color: #a96232;
    }

    .command, .detail, .scenario {
      margin-bottom: 20px;
    }

    .command h3, .detail h3, .scenario h3 {
      color:#ECAA4D ;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Dark mode */
    body.dark-mode {
      background-color: #333;
      color: #f5f5f5;
    }

    body.dark-mode section {
      background-color: #444;
      color: #f5f5f5;
    }

    body.dark-mode .gradient-text {
      background: linear-gradient(90deg, #000000, #ff0000);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      header {
        padding: 15px;
      }

      .gradient-text {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1 class="gradient-text">Telegram Bot Overview</h1>
    </div>
  </header>

  <section id="overview">
    <h2>Telegram Bot Overview</h2>
    <p>This Telegram bot provides a variety of functionalities ranging from weather updates to interacting with a command-line interface. Users can fetch weather details, manage to-do lists, convert currencies, and even run shell commands directly through the bot.</p>
  </section>

  <section id="commands">
    <h2>Bot Commands and Functionalities</h2>

    <div class="command">
      <h3>/start</h3>
      <p>The <code>/start</code> command welcomes the user with a personalized greeting and provides a list of available commands. This is the starting point for users to understand what the bot can do.</p>
    </div>

    <div class="command">
      <h3>/weather [location]</h3>
      <p>The <code>/weather</code> command fetches the current weather information for a specified location. If no location is provided, it defaults to Hyderabad. This command uses the OpenWeatherMap API to retrieve data and provides a detailed weather report including temperature, humidity, wind speed, and more.</p>
    </div>

    <div class="command">
      <h3>/forecast [location]</h3>
      <p>The <code>/forecast</code> command retrieves a 5-day weather forecast for a specified location, or defaults to Hyderabad if no location is specified. The forecast includes temperature, weather conditions, and other relevant details.</p>
    </div>

    <div class="command">
      <h3>/run</h3>
      <p>The <code>/run</code> command initiates a CLI session within the bot, allowing users to execute Linux shell commands. This feature is useful for users who need to run commands or scripts directly through Telegram. Users can type <code>/exit</code> to end the session.</p>
    </div>

    <div class="command">
      <h3>/userinfo</h3>
      <p>The <code>/userinfo</code> command displays detailed information about the user, including their first name, last name, username, language code, and user ID. This is particularly useful for bot administrators or for personalized interactions.</p>
    </div>

    <div class="command">
      <h3>/joke</h3>
      <p>The <code>/joke</code> command provides a random joke from a pre-defined list. This command adds a fun element to the bot and can be used to entertain users.</p>
    </div>

    <div class="command">
      <h3>/menu</h3>
      <p>The <code>/menu</code> command shows an interactive menu with inline buttons. Users can select options like getting weather information, telling a joke, or showing user info, making the bot more interactive.</p>
    </div>

    <div class="command">
      <h3>/quiz</h3>
      <p>The <code>/quiz</code> command starts a trivia quiz session. Users are asked questions, and they can select answers from multiple-choice options. The quiz is a fun way to engage users and test their knowledge.</p>
    </div>

    <div class="command">
      <h3>/convert [amount] to [currency]</h3>
      <p>The <code>/convert</code> command allows users to convert a specified amount of currency from INR to another currency. This command is useful for users who need quick currency conversions.</p>
    </div>

    <div class="command">
      <h3>/todo [list/add/remove]</h3>
      <p>The <code>/todo</code> command manages a to-do list for the user. Users can list all tasks, add new tasks, or remove tasks, making it a handy tool for personal organization.</p>
    </div>
  </section>

  <section id="implementation">
    <h2>Implementation Details</h2>

    <div class="detail">
      <h3>Weather and Forecast Commands</h3>
      <p>These commands use the OpenWeatherMap API to fetch current weather data and forecasts. The bot formats the data in a user-friendly way and responds with detailed weather information. The weather descriptions are customized for clarity.</p>
    </div>

    <div class="detail">
      <h3>Command-Line Interface (CLI) Session</h3>
      <p>The bot creates a temporary directory for each user session and executes commands within that directory. This allows users to interact with a Linux shell environment securely through Telegram. The bot handles large outputs by sending them as files if necessary.</p>
    </div>

    <div class="detail">
      <h3>User Interaction and Session Management</h3>
      <p>The bot manages user sessions with a <code>Map</code> object to store active sessions and their respective directories. This ensures that each user can have a unique session and execute commands without interfering with others.</p>
    </div>
  </section>

  <section id="usage">
    <h2>Usage Scenarios</h2>

    <div class="scenario">
      <h3>Weather Updates for Travelers</h3>
      <p>A user traveling to a new city can quickly check the current weather and the 5-day forecast using the <code>/weather</code> and <code>/forecast</code> commands. This helps in planning outdoor activities or packing appropriately.</p>
    </div>

    <div class="scenario">
      <h3>Remote Command Execution</h3>
      <p>A system administrator needing to run quick commands on a remote server can use the <code>/run</code> command to open a CLI session, execute the necessary commands, and receive the output directly in Telegram.</p>
    </div>

    <div class="scenario">
      <h3>Fun and Engagement</h3>
      <p>The bot can be used for casual interaction by sharing jokes, trivia, and running quizzes. This keeps users engaged and makes the bot a fun companion in group chats or personal conversations.</p>
    </div>
  </section>

  <section id="enhancements">
    <h2>Future Enhancements</h2>

    <div class="enhancement">
      <h3>Integration with External APIs</h3>
      <p>Adding integration with additional APIs for news, sports scores, or currency exchange rates could expand the bot's capabilities and provide users with more diverse information.</p>
    </div>

    <div class="enhancement">
      <h3>Advanced Command Options</h3>
      <p>Introducing advanced command options like scheduling tasks, sending reminders, or customizing bot responses based on user preferences could enhance the bot's functionality.</p>
    </div>

    <div class="enhancement">
      <h3>Improved User Interface</h3>
      <p>Enhancing the bot’s user interface with rich media elements like images, buttons, or inline keyboards could make interactions more engaging and intuitive.</p>
    </div>
  </section>

  <section id="modifications">
    <h2>Bot Usages and Modifications</h2>

    <div class="modification">
      <h3>Custom Commands</h3>
      <p>Users can customize the bot to include their own commands and responses. For example, adding a command to fetch specific data from a personal database or triggering custom scripts.</p>
    </div>

    <div class="modification">
      <h3>Personalized Greetings</h3>
      <p>The bot can be modified to send personalized greetings or messages based on user information or specific events, adding a personal touch to interactions.</p>
    </div>

    <div class="modification">
      <h3>Extended CLI Features</h3>
      <p>Adding more features to the CLI session, such as support for different shell environments or additional command options, could provide more flexibility for users.</p>
    </div>
  </section>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const modeToggle = document.getElementById('mode-toggle');
      const isDarkMode = localStorage.getItem('darkMode') === 'true';

      if (isDarkMode) {
        document.body.classList.add('dark-mode');
        modeToggle.checked = true;
      }

      modeToggle.addEventListener('change', () => {
        if (modeToggle.checked) {
          document.body.classList.add('dark-mode');
          localStorage.setItem('darkMode', 'true');
        } else {
          document.body.classList.remove('dark-mode');
          localStorage.setItem('darkMode', 'false');
        }
      });
    });
  </script>
</body>
</html>






  `);
});















// Get all movies
app.get('/movies', (req, res) => {
  res.json(movies);
});

// Search movies by title, director, or year
app.get('/movies/search', (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  console.log(`Search query: ${query}`); // Debugging line
  const filteredMovies = movies.filter((m) => 
    m.title.toLowerCase().includes(query) ||
    m.director.toLowerCase().includes(query) ||
    m.year.toString().includes(query)
  );
  console.log(`Filtered movies: ${JSON.stringify(filteredMovies)}`); // Debugging line
  if (filteredMovies.length === 0) {
    return res.status(404).json({ error: "Movie not found" });
  }
  res.json(filteredMovies);
});

// Get a single movie by ID
app.get('/movies/:id', (req, res) => {
  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).json({ error: "Movie not found" });
  res.json(movie);
});

// Create a new movie
app.post('/movies', (req, res) => {
  const { title, director, year } = req.body;
  if (!title || !director || !year) return res.status(400).json({ error: "Missing required fields" });

  const newMovie = {
    id: movies.length ? Math.max(movies.map(m => m.id)) + 1 : 1,
    title,
    director,
    year
  };
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

// Update a movie by ID
app.put('/movies/:id', (req, res) => {
  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).json({ error: "Movie not found" });

  const { title, director, year } = req.body;
  if (title) movie.title = title;
  if (director) movie.director = director;
  if (year) movie.year = year;

  res.json(movie);
});

// Delete a movie by ID
app.delete('/movies/:id', (req, res) => {
  const movieIndex = movies.findIndex(m => m.id === parseInt(req.params.id));
  if (movieIndex === -1) return res.status(404).json({ error: "Movie not found" });

  movies.splice(movieIndex, 1);
  res.status(204).send();
});

// Get all quotes
app.get('/quotes', (req, res) => {
  res.json(quotes);
});

// Get a single quote by ID
app.get('/quotes/:id', (req, res) => {
  const quote = quotes.find(q => q.id === parseInt(req.params.id));
  if (!quote) return res.status(404).json({ error: "Quote not found" });
  res.json(quote);
});

// Create a new quote
app.post('/quotes', (req, res) => {
  const { content, author } = req.body;
  if (!content || !author) return res.status(400).json({ error: "Missing required fields" });

  const newQuote = {
    id: quotes.length ? Math.max(quotes.map(q => q.id)) + 1 : 1,
    content,
    author
  };
  quotes.push(newQuote);
  res.status(201).json(newQuote);
});

// Update a quote by ID
app.put('/quotes/:id', (req, res) => {
  const quote = quotes.find(q => q.id === parseInt(req.params.id));
  if (!quote) return res.status(404).json({ error: "Quote not found" });

  const { content, author } = req.body;
  if (content) quote.content = content;
  if (author) quote.author = author;

  res.json(quote);
});

// Delete a quote by ID
app.delete('/quotes/:id', (req, res) => {
  const quoteIndex = quotes.findIndex(q => q.id === parseInt(req.params.id));
  if (quoteIndex === -1) return res.status(404).json({ error: "Quote not found" });

  quotes.splice(quoteIndex, 1);
  res.status(204).send();
});

// Get a random quote
app.get('/quote/random', (req, res) => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  res.json(randomQuote);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});



