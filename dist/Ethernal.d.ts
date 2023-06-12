import { MessageTraceStep } from "hardhat/internal/hardhat-network/stack-traces/message-trace";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ContractInput } from './types';
export declare class Ethernal {
    env: HardhatRuntimeEnvironment;
    private targetContract;
    private db;
    private syncNextBlock;
    private api;
    private traces;
    private verbose;
    constructor(hre: HardhatRuntimeEnvironment);
    startListening(): Promise<void>;
    push(targetContract: ContractInput): Promise<void>;
    traceHandler(trace: MessageTraceStep, isMessageTraceFromACall: boolean): Promise<void>;
    resetWorkspace(workspace: string): Promise<void>;
    private onData;
    private onError;
    private setLocalEnvironment;
    private onPending;
    private syncBlock;
    private stringifyBns;
    private syncTransaction;
    private setWorkspace;
    private login;
    private getFormattedArtifact;
    private sanitize;
}
//# sourceMappingURL=Ethernal.d.ts.map