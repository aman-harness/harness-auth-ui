/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { URLS } from "interfaces/OAuthProviders";
import type { UserInfo } from "services/ng";
import telemetry from "telemetry/Telemetry";
import SecureStorage from "./SecureStorage";
import { getUTMInfoParams } from "./TrackingUtils";

export async function handleSignUpSuccess(resource?: UserInfo): Promise<void> {
  const baseUrl = window.location.pathname.replace("auth/", "");
  const refererURL = getSavedRefererURL();
  if (resource) {
    const intent = resource.intent;
    SecureStorage.setItem("token", resource.token);
    SecureStorage.setItem("uuid", resource.uuid);
    SecureStorage.setItem("acctId", resource.defaultAccountId);
    SecureStorage.setItem("email", resource.email);
    SecureStorage.setItem("lastTokenSetTime", new Date().getTime());

    // send identify user event to telemetry to update the identity
    if (resource.email) {
      telemetry.identify({
        userId: resource.email,
        properties: { ...(refererURL ? { refererURL } : {}) }
      });
    }
    // Disabling this to avoid overloading LS with Harness Support usergroup accounts
    // https://harness.atlassian.net/browse/PL-20761
    // if (resource.accounts) createDefaultExperienceMap(resource.accounts);
    if (intent) {
      switch (intent.toUpperCase()) {
        case "COMMUNITY":
          window.location.href = `${baseUrl}ng/#/account/${resource.defaultAccountId}/cd/home?experience=COMMUNITY`;
          break;
        default:
          window.location.href = `${baseUrl}ng/#/account/${resource.defaultAccountId}/${intent}/home?source=signup&module=${intent}`;
          break;
      }
    } else {
      window.location.href = `${baseUrl}ng/#/account/${resource.defaultAccountId}/purpose?source=signup`;
    }
  }
}

export enum SignupAction {
  REGULAR = "REGULAR",
  TRIAL = "TRIAL",
  SUBSCRIBE = "SUBSCRIBE"
}

export enum Edition {
  FREE = "FREE",
  TEAM = "TEAM",
  ENTERPRISE = "ENTERPRISE"
}

export enum BillingFrequency {
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY"
}

export function getLicenseParams(urlParams?: URLSearchParams): string {
  const signupAction = urlParams?.get("signupAction");
  const signupParam =
    signupAction && signupAction.toUpperCase() in SignupAction
      ? `&signupAction=${signupAction.toUpperCase()}`
      : "";

  const edition = urlParams?.get("edition");
  const editionParam =
    edition && edition.toUpperCase() in Edition
      ? `&edition=${edition.toUpperCase()}`
      : "";

  const billingFrequency = urlParams?.get("billingFrequency");
  const billingFrequencyParam =
    billingFrequency && billingFrequency.toUpperCase() in BillingFrequency
      ? `&billingFrequency=${billingFrequency.toUpperCase()}`
      : "";

  return `${signupParam}${editionParam}${billingFrequencyParam}`;
}

export function getSignupQueryParams(): string {
  const queryString = window.location.hash?.split("?")?.[1];
  const urlParams = new URLSearchParams(queryString);

  const module = urlParams?.get("module");
  const moduleParam = module ? `&module=${module}` : "";

  const licenseParams = getLicenseParams(urlParams);

  const utmInfoParams = getUTMInfoParams(urlParams);

  return `&action=signup&isNG=true${moduleParam}${licenseParams}${utmInfoParams}`;
}

const cookies = document.cookie.split(";").reduce((map, c) => {
  const pair = c.trim().split("=");
  map.set(pair[0], pair[1]);
  return map;
}, new Map());

export function getCookieByName(name: string): string | undefined {
  return cookies.get(name);
}
export const getOAuthFinalUrl = (
  url: string,
  accountId: string,
  isOauthSignup = false
): string =>
  `${URLS.OAUTH}api/users/${url}${
    isOauthSignup
      ? getSignupQueryParams()
      : accountId
      ? `&accountId=${accountId}`
      : ""
  }`;

export const REFERER_URL_KEY = "refererURL";
export const MUTINY_VISITOR_TOKEN_KEY = "visitorToken";
export const getSavedRefererURL = (): string =>
  localStorage.getItem(REFERER_URL_KEY) || "";
export const getGaClientID = (): string => {
  try {
    return (
      document?.cookie
        ?.split("; ")
        ?.find((key: string) => key.includes("_ga="))
        ?.split(".")
        ?.slice(2)
        ?.join(".") || ""
    );
  } catch (e) {
    return "";
  }
};

export const addTrackingParams = (
  url: string,
  refererURL = "",
  gaClientId = "",
  visitorToken = ""
): string => {
  let updatedURL = `${url}`;
  updatedURL =
    refererURL.length > 0 ? `${updatedURL}&referer=${refererURL}` : updatedURL;
  updatedURL =
    gaClientId.length > 0
      ? `${updatedURL}&gaClientId=${gaClientId}`
      : updatedURL;

  updatedURL =
    visitorToken.length > 0
      ? `${updatedURL}&visitorToken=${visitorToken}`
      : updatedURL;
  return updatedURL;
};

export const enabledOauthProviders = [
  "BITBUCKET",
  "GITLAB",
  "LINKEDIN",
  "AZURE"
];

export const getMutinyVisitorToken = (): string | undefined => {
  const token = localStorage.getItem("mutiny.user.token") || "";
  return token;
};

const FF_VISITOR_TOKEN = "ffVisitorToken";
export const getUniqueIdForFF = (): string => {
  const preSavedToken = localStorage.getItem(FF_VISITOR_TOKEN);
  if (preSavedToken) {
    return preSavedToken;
  }
  const ffVisitorToken =
    (Math.floor(Math.random() * 25) + 10).toString(36) +
    Date.now().toString(36) +
    (Math.floor(Math.random() * 25) + 10).toString(36);
  localStorage.setItem(FF_VISITOR_TOKEN, ffVisitorToken);
  return ffVisitorToken;
};

export const isCampaignValid = (campaign = ""): boolean => {
  return !window.skipcampaigns.includes(campaign.toLocaleLowerCase());
};

export enum EXPERIMENTS {
  SIGNUP_PAGE = "SIGNUP_PAGE"
}
