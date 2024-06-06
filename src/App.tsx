/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

//import MyCustomButton from "./MyCustomButton";
import { MappingData } from "./Button2";
import "./App.scss";
import { GroupingMappingProvider } from "@itwin/grouping-mapping-widget";
//import { MappingsClient } from "@itwin/insights-client";
import type { ScreenViewport } from "@itwin/core-frontend";
import { FitViewTool, IModelApp, StandardViewId } from "@itwin/core-frontend";
import { FillCentered } from "@itwin/core-react";
import { ProgressLinear, toaster } from "@itwin/itwinui-react";
import {
  MeasurementActionToolbar,
  MeasureTools,
  MeasureToolsUiItemsProvider,
} from "@itwin/measure-tools-react";
import {
  AncestorsNavigationControls,
  CopyPropertyTextContextMenuItem,
  PropertyGridManager,
  PropertyGridUiItemsProvider,
  ShowHideNullValuesSettingsMenuItem,
} from "@itwin/property-grid-react";
import {
  TreeWidget,
  TreeWidgetUiItemsProvider,
} from "@itwin/tree-widget-react";
import {
  useAccessToken,
  Viewer,
  ViewerContentToolsProvider,
  ViewerNavigationToolsProvider,
  ViewerPerformance,
  ViewerStatusbarItemsProvider,
} from "@itwin/web-viewer-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReportsConfigProvider,
  ReportsConfigWidget,
} from "@itwin/reports-config-widget-react";

import { Auth } from "./Auth";
import { history } from "./history";
import { MyFirstUiProvider } from "./FirstProvider";
import { MyButton } from "./Button2";
import CustomToaster from "./CustomToaster";

const App: React.FC = () => {
  const [iModelId, setIModelId] = useState(process.env.IMJS_IMODEL_ID);
  const [iTwinId, setITwinId] = useState(process.env.IMJS_ITWIN_ID);
  const [changesetId, setChangesetId] = useState(
    process.env.IMJS_AUTH_CLIENT_CHANGESET_ID
  );
  const [mappingData, setMappingData] = useState<MappingData[]>([]);
  const [mappingId, setMappingId] = useState("");
  // const [reportId, setReportId] = useState("");
  // const [jobId, setJobId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const reportNameRef = useRef<HTMLInputElement | null>(null);
  const apiDateRef = useRef<HTMLInputElement | null>(null);
  let date: string | undefined = "";

  const accessToken = useAccessToken();

  const authClient = Auth.getClient();

  const login = useCallback(async () => {
    try {
      await authClient.signInSilent();
    } catch {
      await authClient.signIn();
    }
  }, [authClient]);

  useEffect(() => {
    void login();
  }, [login]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("iTwinId")) {
      setITwinId(urlParams.get("iTwinId") as string);
    }
    if (urlParams.has("iModelId")) {
      setIModelId(urlParams.get("iModelId") as string);
    }
    if (urlParams.has("changesetId")) {
      setChangesetId(urlParams.get("changesetId") as string);
    }
  }, []);

  useEffect(() => {
    let url = `viewer?iTwinId=${iTwinId}`;

    if (iModelId) {
      url = `${url}&iModelId=${iModelId}`;
    }

    if (changesetId) {
      url = `${url}&changesetId=${changesetId}`;
    }
    history.push(url);
  }, [iTwinId, iModelId, changesetId]);

  /** NOTE: This function will execute the "Fit View" tool after the iModel is loaded into the Viewer.
   * This will provide an "optimal" view of the model. However, it will override any default views that are
   * stored in the iModel. Delete this function and the prop that it is passed to if you prefer
   * to honor default views when they are present instead (the Viewer will still apply a similar function to iModels that do not have a default view).
   */
  const viewConfiguration = useCallback((viewPort: ScreenViewport) => {
    // default execute the fitview tool and use the iso standard view after tile trees are loaded
    const tileTreesLoaded = () => {
      return new Promise((resolve, reject) => {
        const start = new Date();
        const intvl = setInterval(() => {
          if (viewPort.areAllTileTreesLoaded) {
            ViewerPerformance.addMark("TilesLoaded");
            ViewerPerformance.addMeasure(
              "TileTreesLoaded",
              "ViewerStarting",
              "TilesLoaded"
            );
            clearInterval(intvl);
            resolve(true);
          }
          const now = new Date();
          // after 20 seconds, stop waiting and fit the view
          if (now.getTime() - start.getTime() > 20000) {
            reject();
          }
        }, 100);
      });
    };

    tileTreesLoaded().finally(() => {
      void IModelApp.tools.run(FitViewTool.toolId, viewPort, true, false);
      viewPort.view.setStandardRotation(StandardViewId.Iso);
    });
  }, []);

  const viewCreatorOptions = useMemo(
    () => ({ viewportConfigurer: viewConfiguration }),
    [viewConfiguration]
  );

  const onIModelAppInit = useCallback(async () => {
    // iModel now initialized
    // const currentDate = new Date();
    // console.log("current date", currentDate.toISOString().slice(0, 10));
    // console.log("setting date");
    // currentDate.setDate(currentDate.getDate() + 1);
    // console.log("updated date", currentDate.toISOString().slice(0, 10));
    await ReportsConfigWidget.initialize(IModelApp.localization);
    await TreeWidget.initialize();
    await PropertyGridManager.initialize();
    await MeasureTools.startup();
    MeasurementActionToolbar.setDefaultActionProvider();
  }, []);

  const getMappings = (arr: MappingData[]) => {
    // console.log("temp logginggg", arr);
    //console.log("access token is ", accessToken);
    setMappingData(arr);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setMappingId("");
  };
  const handleCreateReport = async () => {
    //checking if mapping selected or not
    if (!mappingId) {
      toaster.negative("Select a mapping!");
      return;
    }
    //checking for report id
    if (!reportNameRef.current?.value) {
      toaster.negative("Give the name to your report!");
      return;
    }
    //checking if date selcted or not
    if (!apiDateRef.current?.value) {
      toaster.warning(
        "API will not be created as you didn't select the expiry date"
      );
    } else {
      const currentDate = new Date();
      //checking whether the date selected is valid or not
      if (apiDateRef.current?.value < currentDate.toISOString().slice(0, 10)) {
        toaster.negative("Select a valid date!");
        return;
      }
    }
    console.log("date is ", apiDateRef.current?.value); //printing 1
    date = apiDateRef.current?.value;
    console.log("selected mapping id ", mappingId);
    setIsModalOpen(false);
    console.log("Creating Report...");

    try {
      const response = await fetch(
        "https://api.bentley.com/insights/reporting/reports/",
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.bentley.itwin-platform.v1+json",
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
          body: JSON.stringify({
            displayName: reportNameRef.current.value,
            description: "Report containing iModel Mappings",
            projectId: iTwinId,
          }),
        }
      );
      const reportID = await response.json();
      console.log("report id is ", reportID.report.id);
      //setReportId(reportID.report.id);

      if (response.ok) {
        toaster.positive("Report created successfully...");
        console.log("Report created successfully...");
        try {
          console.log("Report attaching to mapping...");
          const response2 = await fetch(
            `https://api.bentley.com/insights/reporting/reports/${reportID.report.id}/datasources/imodelMappings`,
            {
              method: "POST",
              headers: {
                Accept: "application/vnd.bentley.itwin-platform.v1+json",
                "Content-Type": "application/json",
                Authorization: accessToken,
              },
              body: JSON.stringify({
                mappingId: mappingId,
                imodelId: iModelId,
              }),
            }
          );

          if (response2.ok) {
            console.log("Report attached to mapping successfully...");
            toaster.positive("Report attached to mapping successfully...");
            try {
              console.log("Running Extraction....");
              const response3 = await fetch(
                ` https://api.bentley.com/insights/reporting/datasources/imodels/${iModelId}/extraction/run`,
                {
                  method: "POST",
                  headers: {
                    Accept: "application/vnd.bentley.itwin-platform.v1+json",
                    "Content-Type": "application/json",
                    Authorization: accessToken,
                  },
                }
              );
              if (response3.ok) {
                console.log("Extraction successfull...");
                toaster.positive("Extraction successfull...");
                const jobID = await response3.json();
                console.log("job id is ", jobID.run.id);
                //setJobId(jobID.run.id);
                // toaster.informational(
                //   `Your URL is ready -  https://api.bentley.com/insights/reporting/odata/${reportID.report.id}`,
                //   {
                //     type: "persisting",
                //     hasCloseButton: true,
                //   }
                // );

                toaster.informational(
                  <CustomToaster
                    title={`Your URL is ready`}
                    message={`https://api.bentley.com/insights/reporting/odata/${reportID.report.id}`}
                  />,
                  {
                    type: "persisting",
                    hasCloseButton: true,
                  }
                );

                setMappingId("");
                //creting api key
                console.log("date is ", apiDateRef.current?.value); //printing 2

                try {
                  if (date) {
                    const currentDate = new Date();
                    //if the date is current date
                    if (date === currentDate.toISOString().slice(0, 10)) {
                      currentDate.setDate(currentDate.getDate() + 1);
                      date = currentDate.toISOString().slice(0, 10);
                    }
                    console.log("report id is in api key", reportID.report.id);
                    const response4 = await fetch(
                      "https://api.bentley.com/insights/reporting/keys",
                      {
                        method: "POST",
                        headers: {
                          Accept:
                            "application/vnd.bentley.itwin-platform.v2+json",
                          "Content-Type": "application/json",
                          Authorization: accessToken,
                        },
                        body: JSON.stringify({
                          displayName: "new key 6",
                          reportId: reportID.report.id,
                          expiresAt: date,
                        }),
                      }
                    );
                    if (response4.ok) {
                      const apiKey = await response4.json();
                      console.log(apiKey.key.apiKey);
                      toaster.positive("api key made!");
                      toaster.informational(
                        <CustomToaster
                          title={`Your API key is ready`}
                          message={`${apiKey.key.apiKey}`}
                        />,
                        {
                          type: "persisting",
                          hasCloseButton: true,
                        }
                      );
                      // toaster.informational(
                      //   `Your API key is ready - ${apiKey.apiKey.key}`,
                      //   {
                      //     type: "persisting",
                      //     hasCloseButton: true,
                      //   }
                      // );
                    } else {
                      toaster.negative("Error creating api key");
                    }
                  } else {
                    console.log("did not get date!");
                  }
                } catch (error) {
                  console.log("problem creating api key ", error);
                }
              } else {
                console.log("error in running extraction");
              }
            } catch (error) {
              console.error("Error in extraction..", error);
            }
          } else {
            console.error("Failed to attach mapping to report");
          }
        } catch (error) {
          console.error("Error creating report:", error);
        }
      } else {
        console.error("Failed to create report");
      }
    } catch (error) {
      console.error("Error creating report:", error);
    }
  };
  return (
    <div className="viewer-container">
      {!accessToken && (
        <FillCentered>
          <div className="signin-content">
            <ProgressLinear indeterminate={true} labels={["Signing in..."]} />
          </div>
        </FillCentered>
      )}
      {/* <MyCustomButton /> */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Select Mapping ID</h2>
            <ul>
              {mappingData.map((data) => (
                <li key={data.id}>
                  <button
                    onClick={() => {
                      // console.log(data.id);
                      toaster.positive(`selected mapping id ${data.id}`);
                      setMappingId(data.id);
                    }}
                  >
                    {data.id} - {data.mappingName}
                  </button>
                </li>
              ))}
            </ul>
            <input
              placeholder="Enter report's name"
              type="text"
              ref={reportNameRef}
            />
            <h3 className="datelabel">Select an expiry date for API key</h3>
            <input type="date" id="myDate" name="myDate" ref={apiDateRef} />

            <button onClick={closeModal}>Close</button>
            <button className="repbutton" onClick={handleCreateReport}>
              Create Report
            </button>
          </div>
        </div>
      )}
      <Viewer
        iTwinId={iTwinId ?? ""}
        iModelId={iModelId ?? ""}
        changeSetId={changesetId}
        authClient={authClient}
        viewCreatorOptions={viewCreatorOptions}
        enablePerformanceMonitors={true} // see description in the README (https://www.npmjs.com/package/@itwin/web-viewer-react)
        onIModelAppInit={onIModelAppInit}
        uiProviders={[
          new MyFirstUiProvider(),
          new MyButton(iModelId, accessToken, getMappings),
          new ViewerNavigationToolsProvider(),
          new ViewerContentToolsProvider({
            vertical: {
              measureGroup: false,
            },
          }),
          new ViewerStatusbarItemsProvider(),
          new TreeWidgetUiItemsProvider(),
          new PropertyGridUiItemsProvider({
            propertyGridProps: {
              autoExpandChildCategories: true,
              ancestorsNavigationControls: (props) => (
                <AncestorsNavigationControls {...props} />
              ),
              contextMenuItems: [
                (props) => <CopyPropertyTextContextMenuItem {...props} />,
              ],
              settingsMenuItems: [
                (props) => (
                  <ShowHideNullValuesSettingsMenuItem
                    {...props}
                    persist={true}
                  />
                ),
              ],
            },
          }),
          new MeasureToolsUiItemsProvider(),
          new GroupingMappingProvider(),
          new ReportsConfigProvider(),
        ]}
      />
    </div>
  );
};

export default App;

//....................................................................................................

// useEffect(() => {
//   const getMapping = async () => {
//     if (accessToken) {
//       console.log("Access token available, fetching data...");
//       try {
//         // Make API call to fetch iTwin ID
//         const getMappingResponse = await fetch(
//           `https://api.bentley.com/grouping-and-mapping/datasources/imodel-mappings?iModelId=${iModelId}`,
//           {
//             headers: {
//               Authorization: accessToken,
//               Accept: "application/vnd.bentley.itwin-platform.v1+json",
//             },
//           }
//         );
//         const mappingID = await getMappingResponse.json();
//         const temp = mappingID.mappings[0].id;

//         setMappingId(temp);
//         console.log("Mapping data:", temp);
//         console.log("itwin id ", iTwinId);
//         console.log("imodel id ", iModelId);
//         console.log("access token ", accessToken);
//         // console.log(mappingId);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     } else {
//       console.log("Access token not available yet");
//     }
//   };

//   // Call fetchData when accessToken changes
//   getMapping();
// }, [accessToken, iModelId, mappingId]);

//....................................................................................................
