// /* eslint-disable */
// import { SPFI, spfi } from '@pnp/sp';
// import "@pnp/sp/webs";
// import "@pnp/sp/lists";
// import "@pnp/sp/items";
// import "@pnp/sp/site-users/web";
// import "@pnp/sp/files/web";
// import "@pnp/sp/site-groups/web";
// import "@pnp/graph/search";
// import { Logger, LogLevel } from '@pnp/logging';
// import { Caching } from '@pnp/queryable';
// import ISharingResult from '../../webparts/sharing/components/SharingView/ISharingResult';
// import { GraphFI, graphfi } from '@pnp/graph';
// import { IFacepilePersona } from '@fluentui/react';
// import { convertToFacePilePersona, convertUserToFacePilePersona, processUsers, uniqForObject } from '../utils/Utils';
// import { useState } from 'react';
// import { ISearchResultExtended } from '../../webparts/sharing/components/SharingView/ISearchResultExtended';
// import { getGraph, getSP } from '../config/PnPjsConfig';
// import { WebPartContext } from '@microsoft/sp-webpart-base';
// import { BatchRequestContent, BatchRequestStep, BatchResponseContent } from '@microsoft/microsoft-graph-client';
// import { Drive, Permission } from '@microsoft/microsoft-graph-types';

// interface IPnPService {
//     getSharingLinks(listItems: Record<string, any>): Promise<ISharingResult[]>;
//     getSearchResults(): Promise<Record<string, any>>;
//     loadAssociatedGroups(siteUrl?: string): Promise<void>;
// }
// /** Represents all calls to SharePoint with help of Graph API
//  * @param {WebPartContext} webpartContext - is used to make Graph API calls
//  */

// export const usePnPService = (webpartContext: WebPartContext): IPnPService => {

//     const _sp: SPFI = getSP(webpartContext);
//     const _graph: GraphFI = getGraph(webpartContext);


//     const [standardGroups, setStandardGroups] = useState<string[]>([]);

//     const getCacheFI = <T extends "SP" | "Graph">(type: T): T extends "SP" ? SPFI : GraphFI => {
//         const cache = type === "SP" ? spfi(_sp) : graphfi(_graph);
//         return cache.using(Caching({ store: "session" })) as T extends "SP" ? SPFI : GraphFI;
//     }


//     const loadAssociatedGroups = async (siteUrl?: string): Promise<void> => {

//         try {
//             const spCache = getCacheFI("SP");
//             const { Title } = await spCache.web.select("Title")();
//             console.log(`Web title: ${Title}`);
//             const locStandardGroups: string[] = [];

//             // Gets the associated visitors group of a web
//             const visitorsGroup = await spCache.web.associatedVisitorGroup.select("Title")();
//             locStandardGroups.push(visitorsGroup.Title);

//             // Gets the associated members group of a web
//             const membersGroup = await spCache.web.associatedMemberGroup.select("Title")();
//             locStandardGroups.push(membersGroup.Title);

//             // Gets the associated owners group of a web
//             const ownersGroup = await spCache.web.associatedOwnerGroup.select("Title")();
//             locStandardGroups.push(ownersGroup.Title);
//             console.log("FazLog ~ loadAssociatedGroups ~ locStandardGroups:", locStandardGroups);
//             setStandardGroups(locStandardGroups);
//         }
//         catch (error) {
//             Logger.write(`loadAssociatedGroups in usePnPService | Error: ${error}`, LogLevel.Error);
//             throw error;
//         }
//     };

//     const fetchSearchResultsAll = async (page: number, searchResults?: any[]): Promise<any> => {
//         if (page === 0) {
//             searchResults = [];
//         }
//         const graphCache = getCacheFI("Graph");
//         const tenantId = webpartContext.pageContext.aadInfo.tenantId;
//         const everyoneExceptExternalsUserName = `spo-grid-all-users/${tenantId}`;
//         let query = `(IsDocument:TRUE OR IsContainer:TRUE) AND (NOT FileExtension:aspx) AND ((SharedWithUsersOWSUSER:*) OR (SharedWithUsersOWSUSER:${everyoneExceptExternalsUserName} OR SharedWithUsersOWSUser:Everyone))`;


//         let siteUrl = webpartContext.pageContext.web.absoluteUrl;
//         let isTeams: boolean, isPrivateChannel = false;
//         let groupId = "";
//         if (webpartContext.sdks.microsoftTeams) {
//             isTeams = true;
//         }
//         if (isTeams) {
//             isPrivateChannel = (webpartContext.sdks.microsoftTeams.context.channelType === "Private");
//             groupId = webpartContext.sdks.microsoftTeams.context.groupId;
//             siteUrl = webpartContext.sdks.microsoftTeams.context.teamSiteUrl;
//             if (!isPrivateChannel)
//                 query = `(IsDocument:TRUE OR IsContainer:TRUE) AND (NOT FileExtension:aspx) AND ((SharedWithUsersOWSUSER:*) OR (SharedWithUsersOWSUSER:${everyoneExceptExternalsUserName} OR SharedWithUsersOWSUser:Everyone)) AND (GroupId:${groupId} OR RelatedGroupId:${groupId})`;
//         }

//         Logger.write(`Issuing search query: ${query}`, LogLevel.Verbose);
//         const results = await graphCache.query({
//             entityTypes: ["driveItem", "listItem"],
//             query: {
//                 queryString: `${query}`
//             },
//             fields: ["path", "id", "driveId", "driveItemId", "listId", "listItemId", "fileName", "fileExtension", "webUrl", "lastModifiedDateTime", "lastModified", "SharedWithUsersOWSUSER", "SPSiteUrl"],
//             from: page,
//             size: 500
//         });

//         searchResults.push(results);

//         if (results[0].hitsContainers[0].moreResultsAvailable) {
//             searchResults = await fetchSearchResultsAll(page + 500, searchResults)
//         }


//         return searchResults;
//     }

//     const getSearchResults = async (): Promise<Record<string, any>> => {
//         const listItems: Record<string, any> = {};
//         let searchResults: any[] = [];
//         searchResults = await fetchSearchResultsAll(0, searchResults);

//         searchResults.forEach(results => {
//             results.forEach(result => {
//                 result.hitsContainers.forEach(hits => {
//                     hits?.hits?.forEach(hit => {
//                         const SharedWithUsersOWSUser = (hit.resource.listItem.fields.sharedWithUsersOWSUSER !== undefined) ? hit.resource.listItem.fields.sharedWithUsersOWSUSER : null;

//                         // if we don't get a driveId back (e.g. documentlibrary), then skip the returned item
//                         if (hit.resource.listItem.fields.driveId === undefined)
//                             return;

//                         const result: ISearchResultExtended = {
//                             DriveItemId: hit.resource.id,
//                             FileName: hit.resource.listItem.fields.fileName,
//                             FileExtension: hit.resource.listItem.fields.fileExtension,
//                             ListId: hit.resource.listItem.fields.listId,
//                             FileId: hit.resource.listItem.id,
//                             DriveId: hit.resource.listItem.fields.driveId,
//                             ListItemId: hit.resource.listItem.fields.listItemId,
//                             Path: hit.resource.webUrl,
//                             LastModifiedTime: hit.resource.lastModifiedDateTime,
//                             SharedWithUsersOWSUSER: SharedWithUsersOWSUser,
//                             SiteUrl: hit.resource.listItem.fields.spSiteUrl
//                         }
//                         listItems[result.FileId] = result;
//                         Logger.writeJSON(result, LogLevel.Verbose);
//                     });
//                 });
//             });
//         });

//         return listItems;
//     }

//     const getDriveItemsBySearchResult = async (listItems: Record<string, any>): Promise<Record<string, any>> => {
//         try {
//             console.log("FazLog ~ getDriveItemsBySearchResult ~ listItems:", listItems);
//             const driveItems: Record<string, any> = {};

//             const graphClient = await webpartContext.msGraphClientFactory
//                 .getClient('3');

//             // for (const fileId in listItems) {
//             //     if (Object.prototype.hasOwnProperty.call(listItems, fileId)) {
//             //         const file = listItems[fileId];
//             //         const res = await clientV3.api(`/drives/${file.DriveId}/items/${file.DriveItemId}/permissions`).get();
//             //         console.log("FazLog ~ getDriveItemsBySearchResult ~ res:", res);
//             //         // const r = await graphGet(GraphQueryable(graphQueryable));
//             //         driveItems[fileId] = res?.value;
//             //     }
//             // }
//             // return driveItems;

//             const batchReq: BatchRequestStep[] = [];
//             for (const fileId in listItems) {
//                 if (Object.prototype.hasOwnProperty.call(listItems, fileId)) {
//                     const file = listItems[fileId];
//                     batchReq.push({
//                         id: fileId,
//                         request: new Request(`https://graph.microsoft.com/drives/${file.DriveId}/items/${file.DriveItemId}/permissions`, {
//                             method: "GET"
//                         })
//                     });
//                 }
//             }

//             const batchRequestContent = new BatchRequestContent(batchReq);
//             const content = await batchRequestContent.getContent();

//             // POST the batch request content to the /$batch endpoint
//             const batchResponse = await graphClient.api('/$batch').post(content);

//             // Create a BatchResponseContent object to parse the response
//             const batchResponseContent = new BatchResponseContent(batchResponse);
//             const res = batchResponseContent.getResponses();

//             for (const fileId in listItems) {
//                 if (Object.prototype.hasOwnProperty.call(listItems, fileId)) {
//                     const driveResponse = batchResponseContent.getResponseById(fileId);
//                     if (driveResponse.ok) {
//                         const drivePermissionItem: Permission = (await driveResponse.json())?.value as Permission;
//                         driveItems[fileId] = drivePermissionItem;
//                     }
//                 }
//             }
//             return driveItems;
//         } catch (error) {
//             console.log("FazLog ~ getDriveItemsBySearchResult ~ error:", error);
//         }
//     }

//     const getSharingLinks = async (listItems: Record<string, any>): Promise<ISharingResult[]> => {

//         try {
//             const sharedResults: ISharingResult[] = [];
//             const driveItems = await getDriveItemsBySearchResult(listItems);

//             // now we have all the data we need, we can start building up the result
//             // eslint-disable-next-line guard-for-in
//             for (const fileId in driveItems) {
//                 const driveItem = driveItems[fileId];
//                 const file = listItems[fileId];

//                 let sharedWithUser: IFacepilePersona[] = [];
//                 let sharingUserType = "Member";

//                 // Getting all the details of the file and in which folder is lives
//                 let folderUrl = file.Path.replace(`/${file.FileName}`, '');
//                 let folderName = folderUrl.lastIndexOf("/") > 0 ? folderUrl.substring(folderUrl.lastIndexOf("/") + 1) : folderUrl;

//                 // for certain filetypes we get the dispform.aspx link back instead of the full path, so we need to fix that
//                 if (folderName.indexOf("DispForm.aspx") > -1) {
//                     folderUrl = folderUrl.substring(0, folderUrl.lastIndexOf("/Forms/DispForm.aspx"));
//                     folderName = folderUrl.lastIndexOf("/") > 0 ? folderUrl.substring(folderUrl.lastIndexOf("/") + 1) : folderUrl;
//                     file.FileExtension = file.FileName.substring(file.FileName.lastIndexOf(".") + 1);
//                 }

//                 file.FileUrl = file.Path;
//                 file.FolderUrl = folderUrl;
//                 file.FolderName = folderName;
//                 file.FileId = fileId;



//                 // if a file has inherited permissions, the propery is returned as "inheritedFrom": {}
//                 // if a file has unique permissions, the propery is not returned at all
//                 driveItem.forEach(permission => {
//                     if (permission.link) {
//                         switch (permission.link.scope) {
//                             case "anonymous":
//                                 break;
//                             case "organization": {
//                                 const _user: IFacepilePersona = {};
//                                 _user.personaName = permission.link.scope + " " + permission.link.type;
//                                 _user.data = "Organization";
//                                 if (sharedWithUser.indexOf(_user) === -1) {
//                                     sharedWithUser.push(_user);
//                                 }
//                                 break;
//                             }
//                             case "users": {
//                                 const _users = convertToFacePilePersona(permission.grantedToIdentitiesV2);
//                                 sharedWithUser.push(..._users);
//                                 break;
//                             }
//                             default:
//                                 break;
//                         }
//                     }
//                     else // checking the normal permissions as well, other than the sharing links
//                     {
//                         // if the permission is not the same as the default associated spo groups, we need to add it to the sharedWithUser array
//                         if (standardGroups.indexOf(permission.grantedTo.user.displayName) === -1) {
//                             const _users = convertUserToFacePilePersona(permission.grantedToV2);
//                             sharedWithUser.push(_users);
//                         }
//                         else // otherwise, we're gonna add these groups and mark it as inherited permissions
//                         {
//                             const _user: IFacepilePersona = {};
//                             _user.personaName = permission.grantedTo.user.displayName;
//                             _user.data = "Inherited";
//                             if (sharedWithUser.indexOf(_user) === -1) {
//                                 sharedWithUser.push(_user);
//                             }
//                         }
//                     }
//                 });

//                 if (file.SharedWithUsersOWSUSER !== null) {
//                     const _users = processUsers(file.SharedWithUsersOWSUSER);
//                     sharedWithUser.push(..._users);
//                 }

//                 // if there are any duplicates, this will remove them (e.g. multiple organization links)
//                 sharedWithUser = uniqForObject(sharedWithUser);
//                 if (sharedWithUser.length === 0)
//                     continue;


//                 let isGuest = false;
//                 let isLink = false;
//                 let isInherited = false;

//                 for (const user of sharedWithUser) {
//                     switch (user.data) {
//                         case "Guest": isGuest = true; break;
//                         case "Organization": isLink = true; break;
//                         case "Inherited": isInherited = true; break;
//                     }
//                 }

//                 // if we found a guest user, we need to set the sharingUserType to Guest
//                 if (isGuest) {
//                     sharingUserType = "Guest";
//                 }
//                 else if (isLink) {
//                     sharingUserType = "Link";
//                 }
//                 else if (isInherited) {
//                     sharingUserType = "Inherited";
//                 }

//                 // building up the result to be returned
//                 const sharedResult: ISharingResult =
//                 {
//                     FileExtension: file?.FileExtension ? file.FileExtension : "folder",
//                     FileName: file.FileName,
//                     Channel: file.FolderName,
//                     LastModified: file.LastModifiedTime,
//                     SharedWith: sharedWithUser,
//                     ListId: file.ListId,
//                     ListItemId: file.ListItemId,
//                     Url: file.FileUrl,
//                     FolderUrl: file.FolderUrl,
//                     SharingUserType: sharingUserType,
//                     FileId: file.FileId,
//                     SiteUrl: file.SiteUrl
//                 };
//                 sharedResults.push(sharedResult);
//                 Logger.writeJSON(sharedResult, LogLevel.Verbose);
//             }
//             return sharedResults;
//         }
//         catch (error) {
//             Logger.write(`getPageReviewItems in useSPService | Error: ${error}`, LogLevel.Error);
//             throw error;
//         }
//     };

//     // Return functions
//     return {
//         getSharingLinks,
//         getSearchResults,
//         loadAssociatedGroups
//     };
// };