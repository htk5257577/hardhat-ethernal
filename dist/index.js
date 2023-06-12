"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-ethers");
const task_names_1 = require("hardhat/builtin-tasks/task-names");
const config_1 = require("hardhat/config");
const plugins_1 = require("hardhat/plugins");
const Ethernal_1 = require("./Ethernal");
require("./type-extensions");
(0, config_1.subtask)(task_names_1.TASK_NODE_SERVER_READY).setAction(async (args, hre, runSuper) => {
    const ethernalConfig = hre.config.ethernal;
    if (ethernalConfig && !ethernalConfig.disabled) {
        if (!ethernalConfig.disableSync) {
            hre.ethernal.startListening();
        }
        else {
            console.log('[Ethernal] Not syncing');
        }
    }
    await runSuper(args);
});
(0, config_1.experimentalAddHardhatNetworkMessageTraceHook)(async (hre, trace, isMessageTraceFromACall) => {
    if (!hre.config.ethernal.disabled && !isMessageTraceFromACall) {
        hre.ethernal.traceHandler(trace, isMessageTraceFromACall);
    }
});
(0, config_1.extendConfig)((config, userConfig) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    config.ethernal = {
        disableSync: !!((_a = userConfig.ethernal) === null || _a === void 0 ? void 0 : _a.disableSync),
        disableTrace: !!((_b = userConfig.ethernal) === null || _b === void 0 ? void 0 : _b.disableTrace),
        workspace: ((_c = userConfig.ethernal) === null || _c === void 0 ? void 0 : _c.workspace) || process.env.ETHERNAL_WORKSPACE,
        uploadAst: !!((_d = userConfig.ethernal) === null || _d === void 0 ? void 0 : _d.uploadAst),
        disabled: !!((_e = userConfig.ethernal) === null || _e === void 0 ? void 0 : _e.disabled),
        resetOnStart: (_f = userConfig.ethernal) === null || _f === void 0 ? void 0 : _f.resetOnStart,
        email: ((_g = userConfig.ethernal) === null || _g === void 0 ? void 0 : _g.email) || process.env.ETHERNAL_EMAIL,
        password: ((_h = userConfig.ethernal) === null || _h === void 0 ? void 0 : _h.password) || process.env.ETHERNAL_PASSWORD,
        serverSync: !!((_j = userConfig.ethernal) === null || _j === void 0 ? void 0 : _j.serverSync),
        apiToken: ((_k = userConfig.ethernal) === null || _k === void 0 ? void 0 : _k.apiToken) || process.env.ETHERNAL_API_TOKEN,
        skipFirstBlock: !!((_l = userConfig.ethernal) === null || _l === void 0 ? void 0 : _l.skipFirstBlock),
        verbose: !!((_m = userConfig.ethernal) === null || _m === void 0 ? void 0 : _m.verbose)
    };
    return config;
});
(0, config_1.extendEnvironment)((hre) => {
    if (hre.config.ethernal.disabled) {
        console.log('[Ethernal] Ethernal is disabled.');
    }
    hre.ethernal = (0, plugins_1.lazyObject)(() => new Ethernal_1.Ethernal(hre));
});
//# sourceMappingURL=index.js.map