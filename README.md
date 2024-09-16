# Telegram Bot and Express API Project

## Overview

This project consists of two main components:

1. **Express API** - A Node.js server providing a RESTful API for managing movies and quotes.
2. **Telegram Bot** - A Telegram bot implemented in Node.js that offers various functionalities such as weather information, quizzes, to-do list management, currency conversion, and more.

## Express API

### Endpoints

#### `GET /`

- **Description**: Returns a JSON object with personal information.

#### `GET /movies`

- **Description**: Returns a list of all movies.

#### `GET /movies/search`

- **Query Parameters**: `q` - Search query for filtering movies.
- **Description**: Returns a list of movies matching the search criteria.

#### `GET /movies/:id`

- **Description**: Returns a single movie by ID.

#### `POST /movies`

- **Body Parameters**: `title`, `director`, `year` - Movie details to be added.
- **Description**: Adds a new movie to the list.

#### `PUT /movies/:id`

- **Body Parameters**: `title`, `director`, `year` - Updated movie details.
- **Description**: Updates an existing movie by ID.

#### `DELETE /movies/:id`

- **Description**: Deletes a movie by ID.

#### `GET /quotes`

- **Description**: Returns a list of all quotes.

#### `GET /quotes/:id`

- **Description**: Returns a single quote by ID.

#### `POST /quotes`

- **Body Parameters**: `content`, `author` - Quote details to be added.
- **Description**: Adds a new quote to the list.

#### `PUT /quotes/:id`

- **Body Parameters**: `content`, `author` - Updated quote details.
- **Description**: Updates an existing quote by ID.

#### `DELETE /quotes/:id`

- **Description**: Deletes a quote by ID.

#### `GET /quote/random`

- **Description**: Returns a random quote.

## Telegram Bot

### Commands

#### `/start`

- **Description**: Sends a welcome message with available commands.

#### `/run`

- **Description**: Starts a CLI session where you can execute commands.

#### `/joke`

- **Description**: Sends a random joke.

#### `/weather [location]`

- **Description**: Provides the current weather for the specified location (defaults to Hyderabad).

#### `/forecast [location]`

- **Description**: Provides a 5-day weather forecast for the specified location (defaults to Hyderabad).

#### `/userinfo`

- **Description**: Provides detailed information about the user.

#### `/photo`

- **Description**: Sends a sample photo.

#### `/menu`

- **Description**: Shows a menu of options for quick access to various functionalities.

#### `/quiz`

- **Description**: Starts a quiz session. Type `/quit` to end the quiz.

#### `/convert [amount] to [currency]`

- **Description**: Converts currency from INR to the specified currency.

#### `/todo [list or add "task" or remove "task"]`

- **Description**: Manages your to-do list (list, add, or remove items).

### Features

- **Weather Information**: Fetches current weather and 5-day forecast using OpenWeatherMap API.
- **Quiz Game**: Starts a quiz with randomized questions and options.
- **To-Do List**: Allows users to add, remove, and mark items as completed.
- **Currency Conversion**: Converts amounts from INR to other currencies using an external API.

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/deekshith0509/WebApplication_Bot.git
   ```

2. **Install Dependencies**

   Navigate to the project directory and install the required Node.js packages:

   ```bash
   cd your-repository
   npm install
   ```

3. **Set Up Environment Variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   WEATHER_API_KEY=your-openweathermap-api-key
   ```

4. **Start the Server**

   ```bash
   node server.js
   ```

## Usage

- **Express API**: Access the API endpoints at [http://localhost:3000](http://localhost:3000).
- **Telegram Bot**: Interact with the bot via Telegram using the bot's token.

## Contributing

Feel free to open issues or submit pull requests if you have any suggestions or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
