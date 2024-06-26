# Backend Service README

## Getting Started

This README provides the instructions to set up and run the backend service for our application.

### Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [Yarn](https://yarnpkg.com/) (version 1.22.0 or higher)

### Installation

1. **Clone the repository**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   Use Yarn to install the required dependencies:

   ```bash
   yarn
   ```

### Environment Setup

1. **Generate RSA Public and Private Keys**
   Visit this website - https://travistidwell.com/jsencrypt/demo/
   Click on generate new keys.
   Copy the keys and paste it in your .env like this
      - RSA_ENCRYPTION_PRIVATE_KEY="your copied private key"
      - RSA_ENCRYPTION_PUBLIC_KEY="your copied public key"

2. **Configure environment variables**

   Create a `.env` file in the root directory of the project. You can refer to the `env.template` file provided in the repository for the required environment variables.

   ```bash
   cp env.template .env
   ```

3. **Update the `.env` file**

   Open the `.env` file and update the values according to your environment setup.
   Make sure you generate Public and Private key (RSA)

### Running the Program

Start the backend service using Yarn:

```bash
yarn start
```

This command will start the server, and you should see output indicating that the server is running, typically on a specific port (e.g., `http://localhost:3000`).

### Additional Scripts

Here are some additional scripts you might find useful:

- **Build the project**

  ```bash
  yarn build
  ```
## Chains we support currently
   - Zksync
   - Base

   If you want to add more chains, follow these steps:
      1. Go to src/utils/constants, inside of chainRpcMap you can add your **chainId** as key, and **rpcUrl** as value.
      2. Then go to the respective {Token}.tsx (Eg: ERC20.tsx,ERC721.tsx etc ), inside <select></select> tag for chainId , you need to add your new <options></options> tag and pass the chainId to the value of the options tag.  


### Contributing

If you wish to contribute to the project, please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b edcon-poc/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin edcon-poc/your-feature`)
5. Open a pull request

### License

This project is licensed under the [MIT License](LICENSE).

### Contact

If you have any questions or need further assistance, please contact [your contact email].

---

By following the above steps, you should be able to set up and run the backend service for your application successfully. Happy coding!