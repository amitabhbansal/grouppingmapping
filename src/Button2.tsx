import {
  StageUsage,
  ToolbarItem,
  ToolbarOrientation,
  ToolbarUsage,
  UiItemsProvider,
} from "@itwin/appui-react";
import abc from "./power-bi.svg";
import key from "./icons8-key.svg";
import { exec } from "child_process";
import { useState } from "react";
import { AnyArrayProperty } from "@itwin/ecschema-metadata";
export interface MappingData {
  id: string;
  mappingName: string;
}

export class MyButton implements UiItemsProvider {
  public readonly id = "MyButton";
  public iModelId: string | undefined;
  public accessToken: string | null;

  constructor(
    private iModelIdr: string | undefined,
    private accessTokenr: string,
    private getMappings: (arr: MappingData[]) => void
  ) {
    this.iModelId = iModelIdr;
    this.accessToken = accessTokenr;
  }

  public provideToolbarItems(
    stageId: string,
    stageUsage: string,
    toolbarUsage: ToolbarUsage,
    toolbarOrientation: ToolbarOrientation
  ): ReadonlyArray<ToolbarItem> {
    console.log("running button 2");
    const tools: ToolbarItem[] = [];
    //1st button
    if (
      stageUsage === StageUsage.General &&
      toolbarUsage === ToolbarUsage.ContentManipulation &&
      toolbarOrientation === ToolbarOrientation.Horizontal
    ) {
      // console.log("access token is" + this.accessToken);
      // console.log("iModel is" + this.iModelId);
      const helloWidget: ToolbarItem = {
        id: stageId,
        icon: abc,
        label: "Power Bi",
        itemPriority: 0,
        execute: async () => {
          console.log("custom button clicked!");
          if (this.accessToken) {
            try {
              console.log("api fetching!");
              const getMappingResponse = await fetch(
                `https://api.bentley.com/grouping-and-mapping/datasources/imodel-mappings?iModelId=${this.iModelId}`,
                {
                  headers: {
                    Authorization: this.accessToken,
                    Accept: "application/vnd.bentley.itwin-platform.v1+json",
                  },
                }
              );
              const mappingID = await getMappingResponse.json();
              let mappingArray: MappingData[] = [];
              for (const item of mappingID.mappings) {
                if (item.id) {
                  const obj: MappingData = {
                    id: item.id,
                    mappingName: item.mappingName,
                  };
                  // console.log(obj);
                  mappingArray.push(obj);
                }
              }
              console.log("mapping ids are ", mappingArray);
              this.getMappings(mappingArray);
            } catch (error) {
              console.error("Error fetching mapping IDs:", error);
            }
          }
        },
      };
      tools.push(helloWidget);
    }
    //2nd button
    if (
      stageUsage === StageUsage.General &&
      toolbarUsage === ToolbarUsage.ViewNavigation &&
      toolbarOrientation === ToolbarOrientation.Horizontal
    ) {
      const helloWidget2: ToolbarItem = {
        id: stageId,
        icon: key,
        label: "API Key",
        itemPriority: 10,
        execute: () => {
          console.log("custom button clicked!");
          const url = "https://developer.bentley.com/apis/insights/api-keys/";
          const newWindow = window.open(url, "_blank", "noopener,noreferrer");
          if (newWindow) newWindow.opener = null;
        },
      };
      tools.push(helloWidget2);
    }
    //
    if (
      stageUsage === StageUsage.General &&
      toolbarUsage === ToolbarUsage.ViewNavigation &&
      toolbarOrientation === ToolbarOrientation.Vertical
    ) {
      const helloWidget2: ToolbarItem = {
        id: stageId,
        icon: key,
        label: "Open PowerBi",
        itemPriority: 9,
        execute: () => {
          // const executablePath =
          //   'start "" "C:\\Program Files\\Microsoft Power BI Desktop\\bin\\PBIDesktop.exe"';
          // exec(executablePath, (error, stdout, stderr) => {
          //   if (error) {
          //     console.error("Error running the executable:", error.message);
          //   } else {
          //     console.log("Executable output:", stdout);
          //   }
          // });
        },
      };
      tools.push(helloWidget2);
    }
    // C:\\Program Files\\Microsoft Power BI Desktop\\bin\\PBIDesktop.exe
    return tools;
  }
}
