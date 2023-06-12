import { MessageTraceStep } from "hardhat/internal/hardhat-network/stack-traces/message-trace";
import "hardhat/types/config";
import "hardhat/types/runtime";
import { ContractInput, EthernalConfig } from './types';
declare module "hardhat/types/runtime" {
    interface HardhatRuntimeEnvironment {
        ethernal: {
            startListening: () => Promise<void>;
            traceHandler: (trace: MessageTraceStep, isMessageTraceFromACall: boolean) => Promise<void>;
            push: (contract: ContractInput) => Promise<void>;
            resetWorkspace: (workspace: string) => Promise<void>;
        };
    }
}
declare module "hardhat/types/config" {
    interface HardhatUserConfig {
        ethernal?: EthernalConfig;
    }
    interface HardhatConfig {
        ethernal: EthernalConfig;
    }
}
//# sourceMappingURL=type-extensions.d.ts.map