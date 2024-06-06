import {
  StagePanelLocation,
  StagePanelSection,
  StageUsage,
  UiItemsProvider,
  Widget,
} from "@itwin/appui-react";

export class MyFirstUiProvider implements UiItemsProvider {
  public readonly id = "MyFirstProviderId";

  public provideWidgets(
    _stageId: string,
    stageUsage: string,
    location: StagePanelLocation,
    section?: StagePanelSection
  ): ReadonlyArray<Widget> {
    // console.log("running out a");
    const widgets: Widget[] = [];
    if (
      stageUsage === StageUsage.General &&
      location === StagePanelLocation.Bottom &&
      section === StagePanelSection.Start
    ) {
      //   console.log("running in a");
      const helloWidget: Widget = {
        id: "HelloWidget",
        label: "Hello",
        content: <span>"Hello World"</span>,
      };
      widgets.push(helloWidget);
    }
    return widgets;
  }
}
