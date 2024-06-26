# Live Event Airdrop Experience with QR Code Scanning and Reward Management 

Welcome to the **Live Event Airdrop Experience with QR Code Scanning and Reward Management** repository! This project enables partners to add their contract details, which are then used to generate a QR code. Users can scan this QR code to claim their rewards.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

This project is designed to streamline the process of managing partner contract details and generating QR codes for users. Partners can easily input their contract details into a form, and a QR code will be generated. Users can then scan this QR code to claim their rewards seamlessly.

## Features

- **Contract Details Form**: Partners can add their contract details through a user-friendly form.
- **QR Code Generation**: Automatically generate a QR code based on the provided contract details.
- **Reward Claim**: Users can scan the QR code to claim rewards associated with the contract.

## Technologies Used

- **Next.js**: A React framework for server-side rendering and generating static websites.
- **React**: A JavaScript library for building user interfaces.
- **QRCode.react**: A library to generate QR codes in React.
- **Tailwind CSS**: A utility-first CSS framework for styling.

## Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:

- [Node.js](https://nodejs.org/en/download/) (v14.x or later)
- [yarn](https://yarnpkg.com/getting-started/install)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tevaera-labs/edcon-poc.git
   cd edcon-poc 
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Run the development server**:
   ```bash
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:3000` to see the application in action.

## Usage

1. **Add Contract Details**:
   **ERC 20**
      - Navigate to the contract details form.
      - Fill in the required fields with the partner's contract information.
      - You will find two functions ,
            1. Transfer (Transfers directly from owner's wallet)
            2. Transferfrom (Transfers from spenders wallet on behalf of owner)
      - Fill in the required fields with the partner's contract information.
      - Submit the form to generate a QR code.
   **ERC 721**
      - Here you will have only function , that is TransferFrom.
      - TokenIds needs to be stored in DB (You can store tokenIds range from the partner or starting tokenId and then increment as you keep sending NFTs)
   **ERC 1155**
      - Here we have the two methods 
         1. Multi token functionality where partners can add multi token transfer.
         2. Mint functionality where each tokenId can be minted with an appropriate value.
      - Each field will have respective tokenId and amount, to allow spender/operator to send/mint.

2. **ChainId**
      - Before QR code generation select the chainId , your contract is in.

3. **Generate QR Code**:
   - After submitting the contract details, a QR code will be displayed.
   - Partners can share this QR code with users.

4. **Claim Rewards**:
   - Users scan the QR code using any QR code reader.
   - They will be redirected to the rewards claim page.


## Chains we support currently
   - Zksync
   - Base

   If you want to add more chains, follow these steps:
      1. Go to src/utils/constants, inside of chainRpcMap you can add your **chainId** as key, and **rpcUrl** as value.
      2. Then go to the respective {Token}.tsx (Eg: ERC20.tsx,ERC721.tsx etc ), inside <select></select> tag for chainId , you need to add your new <options></options> tag and pass the chainId to the value of the options tag.  

## Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

Please ensure your code adheres to our coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

Thank you for using the **Next.js Partner Contract Details & QR Code Generator**. We hope this project helps streamline your contract management and reward claim processes. If you have any questions or need further assistance, please don't hesitate to reach out. 


This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
