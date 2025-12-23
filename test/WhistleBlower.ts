import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { WhistleBlower, WhistleBlower__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("WhistleBlower")) as WhistleBlower__factory;
  const whistleBlowerContract = (await factory.deploy()) as WhistleBlower;
  const whistleBlowerContractAddress = await whistleBlowerContract.getAddress();

  return { whistleBlowerContract, whistleBlowerContractAddress };
}

describe("WhistleBlower", function () {
  let signers: Signers;
  let whistleBlowerContract: WhistleBlower;
  let whistleBlowerContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    // Skip tests if running on real network (Sepolia) as encryption requires actual FHE
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    // Deploy a fresh contract for each test
    ({ whistleBlowerContract, whistleBlowerContractAddress } = await deployFixture());
  });

  it("should deploy with correct admin", async function () {
    const admin = await whistleBlowerContract.admin();
    expect(admin).to.eq(signers.deployer.address);
  });

  it("should start with zero reports", async function () {
    const totalReports = await whistleBlowerContract.getTotalReports();
    expect(totalReports).to.eq(0);
  });

  it("should submit an encrypted report successfully", async function () {
    // Encrypt content as euint64
    const clearContent = 123456789n;
    const encryptedContent = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add64(clearContent)
      .encrypt();

    // Encrypt severity as euint32
    const clearSeverity = 5;
    const encryptedSeverity = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add32(clearSeverity)
      .encrypt();

    const tx = await whistleBlowerContract
      .connect(signers.alice)
      .submitReport(
        encryptedContent.handles[0],
        encryptedContent.inputProof,
        encryptedSeverity.handles[0],
        encryptedSeverity.inputProof
      );

    const receipt = await tx.wait();
    expect(receipt).to.not.be.null;

    const totalReports = await whistleBlowerContract.getTotalReports();
    expect(totalReports).to.eq(1);
  });

  it("should decrypt report content correctly", async function () {
    // Submit a report
    const clearContent = 987654321n;
    const encryptedContent = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add64(clearContent)
      .encrypt();

    const clearSeverity = 3;
    const encryptedSeverity = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add32(clearSeverity)
      .encrypt();

    await whistleBlowerContract
      .connect(signers.alice)
      .submitReport(
        encryptedContent.handles[0],
        encryptedContent.inputProof,
        encryptedSeverity.handles[0],
        encryptedSeverity.inputProof
      );

    const reportId = 0;

    // Get encrypted content
    const encryptedReportContent = await whistleBlowerContract.getReportContent(reportId);

    // Decrypt content
    const decryptedContent = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedReportContent,
      whistleBlowerContractAddress,
      signers.alice
    );

    expect(decryptedContent).to.eq(clearContent);
  });

  it("should decrypt report severity correctly", async function () {
    // Submit a report
    const clearContent = 111222333n;
    const encryptedContent = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add64(clearContent)
      .encrypt();

    const clearSeverity = 4;
    const encryptedSeverity = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add32(clearSeverity)
      .encrypt();

    await whistleBlowerContract
      .connect(signers.alice)
      .submitReport(
        encryptedContent.handles[0],
        encryptedContent.inputProof,
        encryptedSeverity.handles[0],
        encryptedSeverity.inputProof
      );

    const reportId = 0;

    // Get encrypted severity
    const encryptedReportSeverity = await whistleBlowerContract.getReportSeverity(reportId);

    // Decrypt severity
    const decryptedSeverity = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedReportSeverity,
      whistleBlowerContractAddress,
      signers.alice
    );

    expect(decryptedSeverity).to.eq(clearSeverity);
  });

  it("should update report status by admin", async function () {
    // Submit a report
    const clearContent = 555666777n;
    const encryptedContent = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add64(clearContent)
      .encrypt();

    const clearSeverity = 2;
    const encryptedSeverity = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add32(clearSeverity)
      .encrypt();

    await whistleBlowerContract
      .connect(signers.alice)
      .submitReport(
        encryptedContent.handles[0],
        encryptedContent.inputProof,
        encryptedSeverity.handles[0],
        encryptedSeverity.inputProof
      );

    const reportId = 0;

    // Update status to UnderReview (status = 1)
    await whistleBlowerContract.connect(signers.deployer).updateReportStatus(reportId, 1);

    const metadata = await whistleBlowerContract.getReportMetadata(reportId);
    expect(metadata.status).to.eq(1); // UnderReview
  });

  it("should not allow non-admin to update report status", async function () {
    // Submit a report
    const clearContent = 888999000n;
    const encryptedContent = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add64(clearContent)
      .encrypt();

    const clearSeverity = 1;
    const encryptedSeverity = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add32(clearSeverity)
      .encrypt();

    await whistleBlowerContract
      .connect(signers.alice)
      .submitReport(
        encryptedContent.handles[0],
        encryptedContent.inputProof,
        encryptedSeverity.handles[0],
        encryptedSeverity.inputProof
      );

    const reportId = 0;

    // Try to update status as non-admin (should fail)
    await expect(
      whistleBlowerContract.connect(signers.bob).updateReportStatus(reportId, 1)
    ).to.be.revertedWith("Only admin can perform this action");
  });

  it("should retrieve report metadata correctly", async function () {
    // Submit a report
    const clearContent = 123123123n;
    const encryptedContent = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add64(clearContent)
      .encrypt();

    const clearSeverity = 5;
    const encryptedSeverity = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add32(clearSeverity)
      .encrypt();

    const tx = await whistleBlowerContract
      .connect(signers.alice)
      .submitReport(
        encryptedContent.handles[0],
        encryptedContent.inputProof,
        encryptedSeverity.handles[0],
        encryptedSeverity.inputProof
      );

    await tx.wait();

    const reportId = 0;
    const metadata = await whistleBlowerContract.getReportMetadata(reportId);

    expect(metadata.reporter).to.eq(signers.alice.address);
    expect(metadata.status).to.eq(0); // Pending
    expect(metadata.timestamp).to.be.greaterThan(0);
  });

  it("should grant decryption permission by admin", async function () {
    // Submit a report
    const clearContent = 456456456n;
    const encryptedContent = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add64(clearContent)
      .encrypt();

    const clearSeverity = 3;
    const encryptedSeverity = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add32(clearSeverity)
      .encrypt();

    await whistleBlowerContract
      .connect(signers.alice)
      .submitReport(
        encryptedContent.handles[0],
        encryptedContent.inputProof,
        encryptedSeverity.handles[0],
        encryptedSeverity.inputProof
      );

    const reportId = 0;

    // Grant permission to Bob
    const tx = await whistleBlowerContract
      .connect(signers.deployer)
      .grantDecryptionPermission(reportId, signers.bob.address);

    const receipt = await tx.wait();
    expect(receipt).to.not.be.null;
  });

  it("should handle multiple reports correctly", async function () {
    // Submit first report
    const clearContent1 = 111111111n;
    const encryptedContent1 = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add64(clearContent1)
      .encrypt();

    const clearSeverity1 = 1;
    const encryptedSeverity1 = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.alice.address)
      .add32(clearSeverity1)
      .encrypt();

    await whistleBlowerContract
      .connect(signers.alice)
      .submitReport(
        encryptedContent1.handles[0],
        encryptedContent1.inputProof,
        encryptedSeverity1.handles[0],
        encryptedSeverity1.inputProof
      );

    // Submit second report
    const clearContent2 = 222222222n;
    const encryptedContent2 = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.bob.address)
      .add64(clearContent2)
      .encrypt();

    const clearSeverity2 = 5;
    const encryptedSeverity2 = await fhevm
      .createEncryptedInput(whistleBlowerContractAddress, signers.bob.address)
      .add32(clearSeverity2)
      .encrypt();

    await whistleBlowerContract
      .connect(signers.bob)
      .submitReport(
        encryptedContent2.handles[0],
        encryptedContent2.inputProof,
        encryptedSeverity2.handles[0],
        encryptedSeverity2.inputProof
      );

    const totalReports = await whistleBlowerContract.getTotalReports();
    expect(totalReports).to.eq(2);

    // Verify first report
    const metadata1 = await whistleBlowerContract.getReportMetadata(0);
    expect(metadata1.reporter).to.eq(signers.alice.address);

    // Verify second report
    const metadata2 = await whistleBlowerContract.getReportMetadata(1);
    expect(metadata2.reporter).to.eq(signers.bob.address);
  });
});
