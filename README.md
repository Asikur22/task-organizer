# Simple Task Organizer

A clean and simple web-based task organizer application with drag-and-drop functionality, built with Vanilla JavaScript.

## Features

- **Create Tasks**: Add tasks with optional due dates.
- **Drag & Drop Reordering**: Intuitive drag-and-drop interface to prioritize your tasks.
- **Date Picker**: Integrated [Flatpickr](https://flatpickr.js.org/) for a user-friendly date selection experience.
- **Persistence**: Tasks are saved to the browser's LocalStorage, so your data persists across page reloads.
- **Responsive Design**: Clean UI that adapts to different screen sizes.

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Libraries**: Flatpickr (Date picker)
- **Containerization**: Docker, Nginx (Alpine)

## Getting Started

### Using Docker (Recommended)

The project is containerized using Nginx on Alpine Linux for a minimal footprint. It is configured to sync your local code changes to the container in real-time.

1.  Ensure you have Docker and Docker Compose installed.
2.  Start the application:
    ```bash
    docker-compose up -d
    ```
3.  Open your web browser and visit:
    [http://localhost:8995](http://localhost:8995)

### Manual Setup

Since this is a static web application, you can simply open the `index.html` file directly in your web browser.

## Project Structure

- `index.html`: Main HTML structure.
- `styles.css`: Custom styles and layout.
- `script.js`: Core application logic (Task CRUD, Drag & Drop events).
- `Dockerfile`: Minimal image configuration using `nginx:alpine`.
- `docker-compose.yml`: Service definition with port mapping and volume syncing.
