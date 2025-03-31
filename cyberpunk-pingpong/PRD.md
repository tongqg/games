# Product Requirements Document: Cyberpunk Ping Pong

## 1. Overview

Cyberpunk Ping Pong is a web-based, two-player Pong game with a cyberpunk visual theme featuring a Matrix-style raining code background.

## 2. Goals

*   Provide a simple, classic Pong gameplay experience.
*   Offer a visually distinct cyberpunk aesthetic.
*   Allow players to control the game's speed.

## 3. Functional Requirements

### 3.1. Gameplay

*   **Paddle Control:**
    *   Player 1 (Left Paddle): Controlled by 'W' (up) and 'S' (down) keys.
    *   Player 2 (Right Paddle): Controlled by 'ArrowUp' (up) and 'ArrowDown' (down) keys.
    *   Paddles should be constrained within the vertical bounds of the play area.
*   **Ball Movement:**
    *   The ball moves diagonally across the screen.
    *   The ball bounces realistically off the top and bottom walls.
    *   The ball bounces realistically off both paddles.
*   **Scoring:**
    *   If the ball goes past the left paddle, Player 2 scores a point.
    *   If the ball goes past the right paddle, Player 1 scores a point.
    *   The score for each player is displayed on screen.
    *   After a point is scored, the ball resets to the center of the play area with a random initial direction.
*   **Speed Control:**
    *   A slider control allows players to adjust the ball's speed multiplier.
    *   The speed multiplier ranges from a minimum (e.g., 0.5x) up to a maximum of **10x** the base speed.
    *   The current speed multiplier is displayed next to the slider.
    *   The adjusted speed affects both the ongoing ball movement and the initial speed after a reset.

### 3.2. Visuals

*   **Game Elements:** Display two paddles, a ball, and the scores for Player 1 and Player 2.
*   **Background:** Feature a dynamic Matrix-style raining code effect covering the entire background.
*   **Layout:** The game elements (paddles, ball, scores, speed control) should be clearly visible against the background.

## 4. Non-Functional Requirements

*   **Performance:** The game and background effect should run smoothly in modern web browsers.
*   **Responsiveness:** The game layout should adapt reasonably to different screen sizes, although the primary play area might have fixed aspect ratios (using `vmin`).

## 5. Future Considerations (Optional)

*   Sound effects for ball bounces and scoring.
*   AI opponent option.
*   Different visual themes.
*   Winning score limit.