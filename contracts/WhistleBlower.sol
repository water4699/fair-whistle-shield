// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title WhistleBlower - Anonymous Encrypted Report System
/// @author Fair Whistle Shield
/// @notice A secure whistleblower system using FHE for encrypted report submission and management
/// @dev Implements encrypted data submission, status tracking, and controlled decryption
contract WhistleBlower is SepoliaConfig {
    /// @notice Report status enumeration
    enum ReportStatus {
        Pending,     // Report submitted, awaiting review
        UnderReview, // Report is being investigated
        Resolved,    // Report has been resolved
        Rejected     // Report was rejected
    }

    /// @notice Structure to store encrypted report data
    struct Report {
        address reporter;           // Address of the reporter (can be anonymous)
        euint64 encryptedContent;   // Encrypted report content (represented as uint64)
        euint32 encryptedSeverity;  // Encrypted severity level (1-5)
        ReportStatus status;        // Current status of the report
        uint256 timestamp;          // Submission timestamp
        bool exists;                // Flag to check if report exists
    }

    /// @notice Mapping from report ID to Report struct
    mapping(uint256 => Report) public reports;

    /// @notice Counter for report IDs
    uint256 public reportCount;

    /// @notice Address of the contract administrator
    address public admin;

    /// @notice Events
    event ReportSubmitted(uint256 indexed reportId, address indexed reporter, uint256 timestamp);
    event ReportStatusUpdated(uint256 indexed reportId, ReportStatus newStatus);
    event ReportDecrypted(uint256 indexed reportId, address indexed requester);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    /// @notice Modifier to restrict access to admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    /// @notice Constructor to set the admin
    constructor() {
        admin = msg.sender;
    }

    /// @notice Submit a new encrypted report
    /// @param inputContent External encrypted content (euint64)
    /// @param contentProof Proof for encrypted content
    /// @param inputSeverity External encrypted severity level (euint32)
    /// @param severityProof Proof for encrypted severity
    /// @return reportId The ID of the newly created report
    function submitReport(
        externalEuint64 inputContent,
        bytes calldata contentProof,
        externalEuint32 inputSeverity,
        bytes calldata severityProof
    ) external returns (uint256 reportId) {
        // Convert external encrypted inputs to internal encrypted types
        euint64 encryptedContent = FHE.fromExternal(inputContent, contentProof);
        euint32 encryptedSeverity = FHE.fromExternal(inputSeverity, severityProof);

        // Increment report counter
        reportId = reportCount++;

        // Create new report
        reports[reportId] = Report({
            reporter: msg.sender,
            encryptedContent: encryptedContent,
            encryptedSeverity: encryptedSeverity,
            status: ReportStatus.Pending,
            timestamp: block.timestamp,
            exists: true
        });

        // Grant permissions for the contract and reporter to access encrypted data
        FHE.allowThis(encryptedContent);
        FHE.allow(encryptedContent, msg.sender);
        FHE.allow(encryptedContent, admin);

        FHE.allowThis(encryptedSeverity);
        FHE.allow(encryptedSeverity, msg.sender);
        FHE.allow(encryptedSeverity, admin);

        emit ReportSubmitted(reportId, msg.sender, block.timestamp);
    }

    /// @notice Update the status of a report (admin only)
    /// @param reportId The ID of the report to update
    /// @param newStatus The new status to set
    function updateReportStatus(uint256 reportId, ReportStatus newStatus) external onlyAdmin {
        require(reports[reportId].exists, "Report does not exist");
        reports[reportId].status = newStatus;
        emit ReportStatusUpdated(reportId, newStatus);
    }

    /// @notice Get encrypted content of a report
    /// @param reportId The ID of the report
    /// @return The encrypted content
    function getReportContent(uint256 reportId) external view returns (euint64) {
        require(reports[reportId].exists, "Report does not exist");
        return reports[reportId].encryptedContent;
    }

    /// @notice Get encrypted severity of a report
    /// @param reportId The ID of the report
    /// @return The encrypted severity
    function getReportSeverity(uint256 reportId) external view returns (euint32) {
        require(reports[reportId].exists, "Report does not exist");
        return reports[reportId].encryptedSeverity;
    }

    /// @notice Get report metadata (non-encrypted data)
    /// @param reportId The ID of the report
    /// @return reporter The address of the reporter
    /// @return status The current status
    /// @return timestamp The submission timestamp
    function getReportMetadata(uint256 reportId)
        external
        view
        returns (
            address reporter,
            ReportStatus status,
            uint256 timestamp
        )
    {
        require(reports[reportId].exists, "Report does not exist");
        Report storage report = reports[reportId];
        return (report.reporter, report.status, report.timestamp);
    }

    /// @notice Grant decryption permission to a specific address
    /// @param reportId The ID of the report
    /// @param user The address to grant permission to
    function grantDecryptionPermission(uint256 reportId, address user) external onlyAdmin {
        require(reports[reportId].exists, "Report does not exist");
        require(user != address(0), "Invalid user address");
        FHE.allow(reports[reportId].encryptedContent, user);
        FHE.allow(reports[reportId].encryptedSeverity, user);
        emit ReportDecrypted(reportId, user);
    }

    /// @notice Get total number of reports
    /// @return The total count of reports
    function getTotalReports() external view returns (uint256) {
        return reportCount;
    }

    /// @notice Transfer admin rights to a new address
    /// @param newAdmin The address of the new admin
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        address previousAdmin = admin;
        admin = newAdmin;
        emit AdminTransferred(previousAdmin, newAdmin);
    }
}
