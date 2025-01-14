/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";

import SignUp from "./SaasExperimentalForms/SignUpExperimental";
import { TestWrapper, queryByNameAttribute } from "utils/TestUtils";
import { CATEGORY, PAGE, EVENT } from "utils/TelemetryUtils";

const pageMock = jest.fn();
const trackMock = jest.fn();

jest.mock("@harnessio/ff-react-client-sdk", () => ({
  useFeatureFlag: jest.fn(() => true)
}));
jest.mock("telemetry/Telemetry", () => ({
  page: jest.fn().mockImplementation((values) => pageMock(values)),
  track: jest.fn().mockImplementation((values) => trackMock(values)),
  initialized: true
}));
interface WindowNew extends globalThis.Window {
  skipCampaigns: string[];
}
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.window = Object.create(window) as WindowNew;
  // @ts-ignore
  globalThis.window.skipcampaigns = [] as string[];
});
describe("SignUp", () => {
  test("render", () => {
    const { container } = render(
      <TestWrapper path={"/signup"}>
        <SignUp />
      </TestWrapper>
    );
    expect(container).toMatchSnapshot();
  });

  test("telemetry", async () => {
    const { container, getByRole } = render(
      <TestWrapper path={"/signup"} queryParams={{ module: "ci" }}>
        <SignUp />
      </TestWrapper>
    );
    await waitFor(() =>
      expect(pageMock).toBeCalledWith({
        name: PAGE.SIGNUP_PAGE,
        properties: {
          intent: "ci",
          utm_campaign: "",
          utm_content: "",
          utm_medium: "",
          utm_source: "",
          utm_term: ""
        }
      })
    );
    const signupFormCredsButton = container.querySelector(
      ".signupWithEmailButton"
    );
    act(() => {
      fireEvent.click(signupFormCredsButton as Element, {});
    });
    fireEvent.input(queryByNameAttribute("email", container)!, {
      target: { value: "random@hotmail.com" },
      bubbles: true
    });
    fireEvent.focusOut(queryByNameAttribute("email", container)!);
    await waitFor(() =>
      expect(trackMock).toBeCalledWith({
        event: EVENT.EMAIL_INPUT,
        properties: {
          category: CATEGORY.SIGNUP,
          email: "random@hotmail.com",
          utm_campaign: "",
          utm_content: "",
          utm_medium: "",
          utm_source: "",
          utm_term: ""
        }
      })
    );
    fireEvent.input(queryByNameAttribute("password", container)!, {
      target: { value: "12345678" },
      bubbles: true
    });
    fireEvent.click(getByRole("button", { name: "Sign up" }));

    await waitFor(() =>
      expect(trackMock).toBeCalledWith({
        event: EVENT.SIGNUP_SUBMIT,
        properties: {
          category: CATEGORY.SIGNUP,
          userId: "random@hotmail.com",
          intent: "ci",
          utm_campaign: "",
          utm_content: "",
          utm_medium: "",
          utm_source: "",
          utm_term: ""
        }
      })
    );
    expect(container).toMatchSnapshot();
  });
});
