import * as vscode from 'vscode';
import { Logger } from 'winston';
import { setMissingConfigurationStatusBarItem } from './userInterface';
import * as semver from 'semver';
import { CheckovInstallation } from './checkovInstaller';
import { getTokenType } from './utils';

const minCheckovVersion = '2.0.0';

export const assureTokenSet = (logger: Logger, openConfigurationCommand: string, checkovInstallation: CheckovInstallation | null): string | undefined => {
    // Read configuration
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('checkov');
    const token = configuration.get<string>('token');
    if (!token) {
        logger.error('Bridgecrew API token was not found. Please add it to the configuration.');
        vscode.window.showErrorMessage('Bridgecrew API token was not found. Please add it to the configuration in order to scan your code.', 'Open configuration')
            .then(choice => choice === 'Open configuration' && vscode.commands.executeCommand(openConfigurationCommand));
        setMissingConfigurationStatusBarItem(checkovInstallation?.version);
    } else if (getTokenType(token) === 'prisma' && !getPrismaUrl()) {
        logger.error('Prisma token was identified but no Prisma URL was found');
        vscode.window.showErrorMessage('Prisma token was identified but no Prisma URL was found. In order to authenticate with your app you must provide Prisma URL', 'Open configuration')
            .then(choice => choice === 'Open configuration' && vscode.commands.executeCommand(openConfigurationCommand));
        setMissingConfigurationStatusBarItem(checkovInstallation?.version);
    }

    return token;
};

export const getPathToCert = (): string | undefined => {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('checkov');
    const pathToCert = configuration.get<string>('certificate');
    return pathToCert;
};

export const getUseBcIds = (): boolean | undefined => {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('checkov');
    const useBcIds = configuration.get<boolean>('useBridgecrewIDs', false);
    return useBcIds;
};

export const getCheckovVersion = (): string => {

    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('checkov');
    const checkovVersion = configuration.get<string>('checkovVersion', 'latest').trim().toLowerCase();

    if (checkovVersion === '' || checkovVersion === 'latest') {
        return 'latest';
    } else {
        if (!semver.valid(checkovVersion)) {
            throw Error(`Invalid checkov version: ${checkovVersion}`);
        }
        
        const clean = semver.clean(checkovVersion);
        if (!clean) {
            throw Error(`Invalid checkov version: ${checkovVersion}`);
        }

        if (!semver.satisfies(checkovVersion, `>=${minCheckovVersion}`)) {
            throw Error(`Invalid checkov version: ${checkovVersion} (must be >=${minCheckovVersion})`);
        }

        return clean;
    }
};

export const shouldDisableErrorMessage = (): boolean => {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('checkov');
    const disableErrorMessageFlag = configuration.get<boolean>('disableErrorMessage', false);
    return disableErrorMessageFlag;
};

export const getPrismaUrl = (): string | undefined => {
    const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('checkov');
    const prismaUrl = configuration.get<string>('prismaURL');
    return prismaUrl;
};
