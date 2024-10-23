/* eslint-disable */
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IFacepilePersona } from "@fluentui/react";

//#region Hooks
export interface ISharingWebPartContext {
    webpartContext: WebPartContext;
    isTeams: boolean;
    pageLimit: number;
}

//#endregion


//#region Data object models
export interface ISharingResult {
    FileExtension: string;
    FileName: string;
    LastModified: Date;
    SharedWith: IFacepilePersona[];
    ListId: string;
    ListItemId: number;
    Url: string;
    FolderUrl: string;
    Channel?: string;
    FileId?: string;
    SharingUserType?: any;
    SiteUrl: string;
    SiteName: string;
}
//#endregion