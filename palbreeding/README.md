# Palworld Breeding Path Finder

A web-based tool to find the optimal breeding paths for Pals in Palworld. This application helps you discover breeding trees to obtain a desired Pal, starting from a set of Pals you already own.

This project is almost entired programed by Gemini 2.5 Pro. Data in this project is copied from https://github.com/LouisMazin/Palworld_Breeding_Tree.

## Features

-   **Breeding Path Discovery**: Instead of just calculating a single offspring, it generates entire breeding trees to guide you through multiple breeding steps.
-   **Custom Constraints**: Specify a target Pal, a list of available parent Pals, and set a budget for the maximum number of breeding steps.
-   **Advanced UI**: A responsive and modern interface with features like searching, filtering, and dynamic updates as you make selections.
-   **Theme Support**: Includes both light and dark modes for user comfort.
-   **Multi-language**: Supports both English and Chinese, with an easy-to-use language switcher.

## How It Works

The calculator is built upon the breeding mechanics of Palworld. Each Pal is assigned a "breeding power" value. The offspring of two Pals is typically the Pal with the breeding power closest to the average of its parents.

This tool leverages that logic to perform a recursive search. Given a desired Pal, a set of available parents, and a formula budget, it constructs possible breeding trees that satisfy these constraints. The search also accounts for the numerous special breeding combinations and exceptions present in the game.

## Project Structure

-   `index.html`: The main HTML file for the application interface.
-   `css/style.css`: Contains all styling, including animations, responsive design, and theme variables.
-   `js/pals.ts`: Contains the dataset for all Pals, including their breeding power and special breeding exceptions.
-   `js/calculator.ts`: Implements the core pathfinding algorithm to discover breeding trees.
-   `js/main.ts`: Manages the user interface, handles user input, and orchestrates the calls to the calculator and UI updates.
-   `js/language.ts`: Provides internationalization support for UI text.
-   `tsconfig.json`: TypeScript configuration file for the project.

## How to Use

1.  Compile the TypeScript files. The project is configured to output to the `/dist` directory.
    ```sh
    tsc
    ```
2.  Run a local web server in the project's root directory.
3.  Open `index.html` in your browser.
4.  Use the UI to select your desired Pal.
5.  Select the Pals you have available from the "Required Parents" list.
6.  Adjust the formula budget if needed.
7.  The breeding trees will be calculated and displayed automatically.
