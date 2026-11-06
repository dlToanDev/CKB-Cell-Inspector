/**
 * CKB Cell Inspector - Core Type Definitions
 * Represents CKB Blockchain primitives, RPC payloads, and normalized inspector state.
 */

export type Hash256 = string;
export type HexNumber = string;
export type ScriptHashType = "data" | "type" | "data1" | "data2";

export interface Script {
  code_hash: Hash256;
  hash_type: ScriptHashType;
  args: string;
}

export interface OutPoint {
  tx_hash: Hash256;
  index: HexNumber;
}

export interface CellInput {
  previous_output: OutPoint;
  since: HexNumber;
}

export interface CellOutput {
  capacity: HexNumber;
  lock: Script;
  type: Script | null;
}

export interface CellDep {
  dep_type: "code" | "dep_group";
  out_point: OutPoint;
}

export interface RawTransaction {
  cell_deps: CellDep[];
  hash: Hash256;
  header_deps: Hash256[];
  inputs: CellInput[];
  outputs: CellOutput[];
  outputs_data: string[];
  version: HexNumber;
  witnesses: string[];
}

export type TxExecutionStatus =
  | "committed"
  | "pending"
  | "proposed"
  | "rejected"
  | "unknown";

export interface RawTxStatus {
  block_hash?: Hash256 | null;
  block_number?: HexNumber | null;
  reason?: string | null;
  status: TxExecutionStatus;
  tx_index?: HexNumber | null;
}

export interface RawGetTransactionResponse {
  cycles?: HexNumber | null;
  fee?: HexNumber | null;
  min_replace_fee?: HexNumber | null;
  time_added_to_pool?: HexNumber | null;
  transaction: RawTransaction;
  tx_status: RawTxStatus;
}

/**
 * Normalized Parsed Data structures for UI & Visualization
 */

export interface ParsedCellData {
  hex: string;
  byteLength: number;
  asciiText: string | null;
  isPrintable: boolean;
  typeGuess?: "empty" | "sudt_xudt_amount" | "spore_data" | "custom_binary";
  parsedAmount?: string;
}

export interface ResolvedInputCell {
  index: number;
  outPoint: {
    txHash: Hash256;
    index: number;
    rawIndexHex: string;
  };
  since: string;
  sinceDescription?: string;
  isCellbase: boolean;
  status: "resolved" | "cellbase" | "unavailable" | "resolving" | "error";
  errorMessage?: string;
  // Resolved previous output data
  cell?: {
    capacityShannons: bigint;
    capacityCkb: string;
    lock: Script;
    type: Script | null;
    data: ParsedCellData;
    occupiedCapacityShannons?: bigint;
  };
}

export interface ResolvedOutputCell {
  index: number;
  capacityShannons: bigint;
  capacityCkb: string;
  lock: Script;
  type: Script | null;
  data: ParsedCellData;
  occupiedCapacityShannons?: bigint;
}

export interface NormalizedTransaction {
  hash: Hash256;
  version: number;
  status: TxExecutionStatus;
  statusReason?: string | null;
  blockHash?: Hash256 | null;
  blockNumber?: number | null;
  txIndex?: number | null;
  cycles?: number | null;
  isCellbase: boolean;
  inputs: ResolvedInputCell[];
  outputs: ResolvedOutputCell[];
  cellDeps: CellDep[];
  headerDeps: Hash256[];
  witnessesCount: number;
  // Capacity and fee calculations
  totalInputCapacityShannons?: bigint | null;
  totalInputCapacityCkb?: string | null;
  totalOutputCapacityShannons: bigint;
  totalOutputCapacityCkb: string;
  feeShannons?: bigint | null;
  feeCkb?: string | null;
  // Metadata
  resolvedInputsCount: number;
  hasUnavailableInputs: boolean;
}

export interface KnownScriptInfo {
  name: string;
  category: "lock" | "type" | "dual";
  description: string;
  typicalArgs: string;
  docUrl: string;
  isOfficialSystem: boolean;
}

export interface NetworkConfig {
  id: "testnet" | "mainnet" | "custom";
  name: string;
  rpcUrl: string;
  explorerUrl: string;
}
