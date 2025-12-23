# Fair Whistle Shield 🛡️

[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-e6e6e6?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.21.0-yellow?logo=hardhat)](https://hardhat.org/)

**A decentralized, privacy-preserving whistleblower platform powered by Fully Homomorphic Encryption (FHE)**

🔗 **[Live Demo](https://fair-whistle-shield.vercel.app/)** | 📹 **[Watch Demo Video](./demo.mp4)**

---

## 🌟 Overview

Fair Whistle Shield is an innovative blockchain-based whistleblower system that leverages **Fully Homomorphic Encryption (FHE)** technology from [Zama's FHEVM](https://www.zama.ai/fhevm) to enable truly anonymous and secure report submissions. Unlike traditional whistleblower platforms, all sensitive data remains encrypted on-chain, ensuring complete privacy and protection for whistleblowers.

### 🎯 Key Features

- **🔐 End-to-End Encryption**: Report content and severity levels are encrypted using FHE and never exposed on-chain
- **👤 Anonymous Submissions**: Submit reports without revealing your identity
- **🔒 Controlled Access**: Only authorized administrators can decrypt and review reports
- **📊 Status Tracking**: Real-time monitoring of report status (Pending, Under Review, Resolved, Rejected)
- **⚡ Decentralized**: Built on Ethereum with smart contracts for trustless operation
- **🎨 Modern UI**: Beautiful, responsive interface built with Next.js 15 and TailwindCSS

---

## 🎥 Demo

https://github.com/user-attachments/assets/demo-video

Watch the full demonstration of Fair Whistle Shield in action: [demo.mp4](./demo.mp4)

**Try it live**: [https://fair-whistle-shield.vercel.app/](https://fair-whistle-shield.vercel.app/)

---

## 🏗️ Architecture

### Smart Contract

The `WhistleBlower.sol` contract implements:

- **Encrypted Data Storage**: Uses `euint64` for report content and `euint32` for severity levels
- **Access Control**: Admin-only functions for status updates and decryption permissions
- **Event Emission**: Transparent logging of report submissions and status changes
- **Metadata Management**: Public metadata (reporter address, timestamp, status) with encrypted sensitive data

### Frontend Application

Built with modern web technologies:

- **Next.js 15**: React framework with App Router
- **RainbowKit**: Seamless wallet connection
- **Wagmi & Viem**: Ethereum interaction libraries
- **TailwindCSS + DaisyUI**: Responsive, beautiful UI components
- **Zama Relayer SDK**: FHE encryption/decryption handling

---

## 📁 Project Structure

```
fair-whistle-shield/
├── contracts/
│   ├── WhistleBlower.sol      # Main FHE-enabled whistleblower contract
│   └── FHECounter.sol          # Example FHE counter contract
├── frontend/
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   │   ├── WhistleBlowerDemo.tsx
│   │   ├── ReportSubmissionPanel.tsx
│   │   ├── ActivityLogPanel.tsx
│   │   └── ConnectWalletTopRight.tsx
│   ├── fhevm/                  # FHEVM utilities
│   │   ├── FhevmDecryptionSignature.ts
│   │   └── GenericStringStorage.ts
│   └── abi/                    # Contract ABIs
├── deploy/                     # Deployment scripts
├── test/                       # Contract tests
├── tasks/                      # Hardhat tasks
└── hardhat.config.ts           # Hardhat configuration
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **pnpm**: Package manager (or npm/yarn)
- **MetaMask**: Browser wallet extension

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MiriamAldridge/fair-whistle-shield.git
   cd fair-whistle-shield
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   pnpm install

   # Install frontend dependencies
   cd frontend
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   # Root directory
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY  # Optional
   ```

4. **Compile contracts**

   ```bash
   pnpm run compile
   ```

5. **Run tests**

   ```bash
   pnpm run test
   ```

---

## 🔧 Development

### Smart Contract Development

```bash
# Compile contracts
pnpm run compile

# Run tests
pnpm run test

# Run tests on Sepolia
pnpm run test:sepolia

# Deploy to local network
pnpm run node  # In one terminal
npx hardhat deploy --network localhost  # In another terminal

# Deploy to Sepolia
npx hardhat deploy --network sepolia
```

### Frontend Development

```bash
cd frontend

# Generate ABI files
pnpm run genabi

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start
```

The frontend will be available at `http://localhost:3000`

---

## 📜 Smart Contract API

### Main Functions

#### `submitReport()`
Submit an encrypted report with content and severity level.

```solidity
function submitReport(
    externalEuint64 inputContent,
    bytes calldata contentProof,
    externalEuint32 inputSeverity,
    bytes calldata severityProof
) external returns (uint256 reportId)
```

#### `updateReportStatus()`
Update the status of a report (admin only).

```solidity
function updateReportStatus(
    uint256 reportId,
    ReportStatus newStatus
) external onlyAdmin
```

#### `getReportMetadata()`
Retrieve public metadata of a report.

```solidity
function getReportMetadata(uint256 reportId)
    external view returns (
        address reporter,
        ReportStatus status,
        uint256 timestamp
    )
```

#### `grantDecryptionPermission()`
Grant decryption permission to a specific address (admin only).

```solidity
function grantDecryptionPermission(
    uint256 reportId,
    address user
) external onlyAdmin
```

---

## 🧪 Testing

The project includes comprehensive test suites:

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run coverage

# Run tests on Sepolia testnet
pnpm run test:sepolia
```

Test files:
- `test/WhistleBlower.ts` - Local network tests
- `test/WhistleBlowerSepolia.ts` - Sepolia testnet tests

---

## 🌐 Deployment

### Sepolia Testnet

The contract is deployed on Sepolia testnet. To deploy your own instance:

```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Frontend Deployment

The frontend is deployed on Vercel:

```bash
cd frontend
vercel deploy --prod
```

---

## 🛠️ Technology Stack

### Blockchain
- **Solidity 0.8.24**: Smart contract language
- **FHEVM**: Fully Homomorphic Encryption for Ethereum
- **Hardhat**: Development environment
- **Ethers.js**: Ethereum library

### Frontend
- **Next.js 15**: React framework
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS
- **DaisyUI**: Component library
- **RainbowKit**: Wallet connection
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum library

### Encryption
- **Zama FHEVM**: Fully Homomorphic Encryption
- **Zama Relayer SDK**: FHE operations

---

## 📊 Use Cases

1. **Corporate Whistleblowing**: Employees can report misconduct anonymously
2. **Government Transparency**: Citizens can report corruption securely
3. **Academic Integrity**: Students can report violations confidentially
4. **Healthcare Compliance**: Medical professionals can report issues safely
5. **Financial Fraud**: Anonymous reporting of financial irregularities

---

## 🔒 Security Features

- **On-Chain Encryption**: All sensitive data encrypted with FHE
- **Access Control**: Role-based permissions for administrators
- **Immutable Records**: Blockchain ensures tamper-proof storage
- **Anonymous Submissions**: No personal information required
- **Controlled Decryption**: Only authorized parties can decrypt

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Zama](https://www.zama.ai/)**: For the groundbreaking FHEVM technology
- **[Ethereum](https://ethereum.org/)**: For the decentralized platform
- **[Hardhat](https://hardhat.org/)**: For the excellent development tools
- **[Next.js](https://nextjs.org/)**: For the powerful React framework

---

## 📞 Contact & Links

- **Live Demo**: [https://fair-whistle-shield.vercel.app/](https://fair-whistle-shield.vercel.app/)
- **GitHub**: [https://github.com/MiriamAldridge/fair-whistle-shield](https://github.com/MiriamAldridge/fair-whistle-shield)
- **Documentation**: [Zama FHEVM Docs](https://docs.zama.ai/fhevm)

---

**Built with ❤️ using Zama's FHEVM technology**
