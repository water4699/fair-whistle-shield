import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "WhistleBlower";

// <root>/packages/fhevm-hardhat-template
const rel = "..";

// <root>/packages/site/components
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/packages/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

// Read ABI from artifacts
const artifactsDir = path.join(dir, "artifacts", "contracts");
const contractArtifactPath = path.join(artifactsDir, `${CONTRACT_NAME}.sol`, `${CONTRACT_NAME}.json`);

if (!fs.existsSync(contractArtifactPath)) {
  console.error(
    `${line}Unable to locate contract artifact at ${contractArtifactPath}.\n\nPlease run 'npx hardhat compile' first.${line}`
  );
  process.exit(1);
}

const artifactJson = JSON.parse(fs.readFileSync(contractArtifactPath, "utf-8"));
const abi = artifactJson.abi;

// Default addresses (will be updated after deployment)
const localhostAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const sepoliaAddress = "0x0000000000000000000000000000000000000000";

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME} = ${JSON.stringify({ abi }, null, 2)} as const;
\n`;

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${sepoliaAddress}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${localhostAddress}", chainId: 31337, chainName: "hardhat" },
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);
