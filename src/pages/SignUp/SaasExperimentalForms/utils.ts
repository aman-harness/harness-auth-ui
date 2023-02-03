/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import CDLogo from "static/images/cd-logo.svg";
import CILogo from "static/images/ci-logo.svg";
import CCMLogo from "static/images/ccm-logo.svg";
import FFLogo from "static/images/ff-logo.svg";
import ChaosLogo from "static/images/chaos-logo.svg";
import HarnessLogo from "static/images/logo.svg";

import PathCD from "static/images/path-cd.svg";
import PathCI from "static/images/path-ci.svg";
import PathCCM from "static/images/path-ccm.svg";
import PathFF from "static/images/path-ff.svg";
import PathChaos from "static/images/path-chaos.svg";
import PathHarness from "static/images/path-harness.svg";
import { getSavedRefererURL, REFERER_URL_KEY } from "utils/SignUpUtils";

interface ModuleDetailsMap {
  [key: string]: ModuleDetail;
}

interface ModuleDetail {
  logo: string;
  pathImg: string;
  title: string;
  tagLine: string;
  valueProp: string;
  callout: string;
  intro: string;
  cta: string;
  color: string;
}
const MODULE_TO_DETAILS_MAP: ModuleDetailsMap = {
  cd: {
    logo: CDLogo,
    pathImg: PathCD,
    title: "Continuous Delivery",
    tagLine: "Blazing Fast Deployment Pipelines in Minutes",
    valueProp:
      "Self-Service Continuous Delivery that enables engineers to deploy on-demand, without a single script",
    callout:
      "Trusted by 1000s of Developers, driving 17 Million deployments in last 12 months",
    intro:
      "Define Pipelines that enable you to improve your deployment times, manage all in one place",
    cta: "Let's Deploy",
    color: "#5FB34E"
  },
  chaos: {
    logo: ChaosLogo,
    pathImg: PathChaos,
    title: "Chaos Engineering",
    tagLine: "Confidently deliver software by proactively building resilience",
    valueProp:
      "Harness Chaos Engineering, powered by LitmusChaos, enables developers and SREs to achieve Continuous Resilience™, improve developer productivity, accelerate digital transformation and avoid disasters.",
    callout:
      "Trusted by developers, qa engineers, and site reliability engineers to build resilient software",
    intro:
      "Define chaos experiments that enable you to improve software resilience, managed all in one place.",
    cta: "Test with confidence!",
    color: "#FF006A"
  },
  ci: {
    logo: CILogo,
    pathImg: PathCI,
    title: "Continuous Integration",
    tagLine: "Harness CI is an enterprise ready, cloud native CI product.",
    valueProp:
      "An intelligent, container-native CI solution with isolated builds and standardized extensions. Build artifacts smarter and faster.",
    callout:
      "TRUSTED BY THE NEW YORK TIMES, ROBLOX, JOHN DEERE, EBAY AND MANY OTHERS TO RUN THEIR BUILDS AND TEST SUITES BLAZING FAST",
    intro:
      "Create a container-based build pipeline in minutes. Even testing is lightweight and fast with Test Intelligence!",
    cta: "Let's build",
    color: "#2BB1F2"
  },
  ce: {
    logo: CCMLogo,
    pathImg: PathCCM,
    title: "Cloud Cost Management",
    tagLine: "Gain complete cloud control and automated cost optimization ",
    valueProp:
      "Achieve cost transparency and reclaim wasted spend across clouds - with built-in anomaly detection and automation",
    callout:
      "Trusted by developers and finance teams from leading startups to enterprise",
    intro:
      "Manage cloud costs and automate savings from kubernetes pods to databases",
    cta: "Connect Cloud Account",
    color: "#01C9CC"
  },
  cf: {
    logo: FFLogo,
    pathImg: PathFF,
    title: "Feature Flags",
    tagLine: "Confidently deploy features with both velocity and control.",
    valueProp:
      "Ship more features and reduce deployment risk with the control and governance enterprises require - all without breaking things, even while in production.",
    callout: "Trusted by Developers and Product teams from zero to scale.",
    intro:
      "Automate feature releases, build with flags as code, and ship more features with less risk.",
    cta: "Start Managing Features",
    color: "#EE8625"
  },
  default: {
    logo: HarnessLogo,
    pathImg: PathHarness,
    title: "The Modern Software Delivery Platform",
    tagLine: "Loved by Developers, Trusted by Businesses",
    valueProp:
      "Harness is the industry's first Software Delivery Platform to use AI to simplify your DevOps processes - CI, CD, Feature Flags, Cloud Costs, and much more.",
    callout:
      "Trusted by Developers, DevOps, DevSecOps, Finance and others, across world's leading digital businesses.",
    intro:
      "Define Pipelines that enable you to improve your deployment times, manage all in one place",
    cta: "Let's Deploy",
    color: "#0278D5"
  }
};

const getModuleDetails = (moduleName = "default"): ModuleDetail => {
  const details = MODULE_TO_DETAILS_MAP[moduleName];
  if (details) {
    return details;
  }
  return MODULE_TO_DETAILS_MAP.default;
};

const getURL = (str: string): URL | undefined => {
  try {
    return new URL(str);
  } catch (e) {
    return undefined;
  }
};

const updateReferer = (): void => {
  const prevRefererURL = getSavedRefererURL();
  const currentReferrerURL = document.referrer
    ? getURL(document.referrer)
    : getURL(prevRefererURL as string);

  const currentSiteURL = getURL(window.location.href);
  if (
    document.referrer &&
    !currentReferrerURL?.host?.includes(currentSiteURL?.host as string)
  ) {
    localStorage.setItem(REFERER_URL_KEY, document.referrer);
  }
};

function debounceFn(func: any, delay = 300): () => void {
  let timerId: number;
  return function (this: any, ...args: any[]) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
export { getModuleDetails, updateReferer, debounceFn };
