import { BlockWithTransactions, TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider';
import { TraceStep, Workspace } from './types';
export declare class Api {
    private apiRoot;
    private webappRoot;
    private firebaseUserId;
    private currentUser;
    private currentWorkspace;
    private auth;
    private apiToken;
    constructor(apiRoot: string, webappRoot: string);
    get isLoggedIn(): boolean;
    get hasWorkspace(): boolean;
    get currentWorkspaceName(): string | undefined;
    get isUsingApiToken(): boolean;
    getFirebaseAuthToken(): Promise<any>;
    setApiToken(apiToken: string): Promise<Workspace | undefined>;
    fetchUser(): Promise<Workspace | undefined>;
    login(email: string, password: string): Promise<Workspace | undefined>;
    setWorkspace(workspace: string | undefined): Promise<Workspace | undefined>;
    resetWorkspace(workspaceName: string): Promise<any>;
    syncBlock(block: BlockWithTransactions, serverSync?: boolean): Promise<any>;
    syncTransaction(block: BlockWithTransactions, transaction: TransactionResponse, transactionReceipt: TransactionReceipt): Promise<any>;
    syncTrace(transactionHash: string, trace: TraceStep[]): Promise<any>;
    syncContractData(name: string, address: string, abi: any[] | null, hashedBytecode: string | undefined): Promise<any>;
    syncContractAst(address: string, ast: any): Promise<any>;
}
//# sourceMappingURL=api.d.ts.map