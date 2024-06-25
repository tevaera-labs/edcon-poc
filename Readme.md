# Live Event Airdrop Experience with QR Code Scanning and Reward Management

Welcome to the **Live Event Airdrop Experience with QR Code Scanning and Reward Management**! This project comprises both a frontend and backend service to streamline the management of partner contract details and the claiming of rewards through QR code scanning.

## Table of Contents

- [Overview](#overview)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [License](#license)

## Overview

This project is designed to enhance live event experiences by allowing partners to easily manage contract details and generate QR codes for rewards. Users can scan these QR codes to claim their rewards in a seamless and efficient manner. The project is divided into two main components:

- **Frontend**: A Next.js application that provides a user-friendly interface for partners to input contract details and generate QR codes. It also enables users to scan these QR codes to claim their rewards.
- **Backend**: A Node.js service that handles the contract interactions, manages the data, and processes the reward claims.

## Frontend Setup

### Prerequisites

Ensure you have the following installed on your local machine:

- [Node.js](https://nodejs.org/en/download/) (v14.x or later)
- [Yarn](https://yarnpkg.com/getting-started/install)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tevaera-labs/edcon-poc.git
   cd edcon-poc/frontend
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Run the development server**:
   ```bash
   yarn dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000` to see the application.

## Backend Setup

### Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [Yarn](https://yarnpkg.com/) (version 1.22.0 or higher)

### Installation

1. **Navigate to the backend directory**:
   ```bash
   cd edcon-poc/backend
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

### Environment Setup

1. **Create and configure `.env` file**:
   ```bash
   cp env.template .env
   ```
   Update the `.env` file with your environment settings.

2. **Run the backend service**:
   ```bash
   yarn start
   ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

By following these steps, you can set up and run both the frontend and backend services for the application successfully. This project aims to make the process of managing contract details and claiming rewards straightforward and user-friendly. If you have any questions, please reach out for further assistance. Happy coding!

**For more details**
Check the README.md files in frontend and backend directories.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

By following these steps, you can set up and run both the frontend and backend services for the application successfully. If you have any questions, please reach out for further assistance. Happy coding!