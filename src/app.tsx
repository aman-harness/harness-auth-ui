/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from "react";
import { Route, HashRouter, Redirect, Switch } from "react-router-dom";
import { RestfulProvider } from "restful-react";
import toast, { Toaster } from "react-hot-toast";
import routes from "./RouteDefinitions";
import SignIn from "./pages/SignIn/SignIn";
import LocalLogin from "./pages/LocalLogin/LocalLogin";
import SSOSignIn from "./pages/SSOSignIn/SSOSignIn";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import TwoFactorAuth from "./pages/TwoFactorAuth/TwoFactorAuth";
import AcceptInvite from "./pages/AcceptInvite/AcceptInvite";
import VerifyEmailPage from "./pages/VerifyEmail/VerifyEmailPage";
import CompleteInvitePage from "./pages/CompleteInvite/CompleteInvitePage";
import AppErrorBoundary from "AppErrorBoundary/AppErrorBoundary";
import {
  isCommunityPlan,
  isNewSignupEnabled,
  isOnPrem,
  isSaas
} from "utils/DeploymentTypeUtil";
import SignUpCommunity from "./pages/SignUp/SignUpCommunity";
import SignUpOnPrem from "./pages/SignUp/SignUpOnPrem";
import { FFContextProvider } from "@harnessio/ff-react-client-sdk";
import SignUpExperimental from "pages/SignUp/SaasExperimentalForms/SignUpExperimental";
import EmailVerifyPageWithIntent from "pages/SignUp/SaasExperimentalForms/EmailVerification/EmailVerifyPage";
import SignupV2 from "pages/SignUp/SaasExperimentalForms/SignupV2/SignupV2";
import {
  getUniqueIdForFF,
  isCampaignValid,
  EXPERIMENTS
} from "utils/SignUpUtils";
import { useQueryParams } from "hooks/useQueryParams";
import useSignupABTest, { FLAG_VARIANTS } from "hooks/useSignupABTest";

const TOO_MANY_REQUESTS_MESSAGE =
  "Too many requests received, please try again later";
const initializeApp = () => {
  // initialize bugsnagClient
  if (
    window.bugsnagToken &&
    typeof Bugsnag !== "undefined" &&
    Bugsnag.start &&
    isSaas()
  ) {
    window.bugsnagClient = Bugsnag.start({
      apiKey: window.bugsnagToken,
      appVersion: __BUGSNAG_RELEASE_VERSION__,
      releaseStage: `ng-auth-ui-${window.location.hostname.split(".")[0]}`
    });
  }
};

const AppWithCommunityRoutes: React.FC = () => {
  return (
    <>
      <Route path={routes.toSignIn()} component={SignIn} />
      <Route path={routes.toForgotPassword()} component={ForgotPassword} />
      <Route path={routes.toResetPassword()} component={ResetPassword} />
      <Route path={routes.toAcceptInvite()} component={AcceptInvite} />
      <Route path={routes.toSignUp()} component={SignUpCommunity} />
      <Route path="/" exact>
        <Redirect to={routes.toSignIn()} />
      </Route>
    </>
  );
};

const AppWithOnPremRoutes: React.FC = () => {
  return (
    <>
      <Route path={routes.toSignIn()} component={SignIn} />
      <Route path={routes.toLocalLogin()} component={LocalLogin} />
      <Route path={routes.toSignUp()} component={SignUpOnPrem} />
      <Route path={routes.toForgotPassword()} component={ForgotPassword} />
      <Route path={routes.toResetPassword()} component={ResetPassword} />
      <Route path={routes.toSSOSignIn()} component={SSOSignIn} />
      <Route path={routes.toTwoFactorAuth()} component={TwoFactorAuth} />
      <Route path={routes.toAcceptInvite()} component={AcceptInvite} />
      <Route path="/" exact>
        <Redirect to={routes.toSignIn()} />
      </Route>
      <Route path={routes.toEmailVerification()} component={VerifyEmailPage} />
      <Route path={routes.toCompleteInvite()} component={CompleteInvitePage} />
    </>
  );
};

const AppWithSaasRoutes: React.FC = () => {
  const { utm_source, module } = useQueryParams<{
    utm_source?: string;
    module?: string;
  }>();
  const runTest = !module && isCampaignValid(utm_source);
  const flagVariant = useSignupABTest({ runTest });

  return (
    <>
      <Route path={routes.toSignIn()} component={SignIn} />
      <Route path={routes.toLocalLogin()} component={LocalLogin} />
      <Route
        path={routes.toSignUp()}
        component={
          flagVariant === FLAG_VARIANTS.VARIANT_A
            ? SignUpExperimental
            : SignupV2
        }
      />
      <Route path={routes.toForgotPassword()} component={ForgotPassword} />
      <Route path={routes.toResetPassword()} component={ResetPassword} />
      <Route path={routes.toSSOSignIn()} component={SSOSignIn} />
      <Route path={routes.toTwoFactorAuth()} component={TwoFactorAuth} />
      <Route path={routes.toAcceptInvite()} component={AcceptInvite} />
      <Route path="/" exact>
        <Redirect to={routes.toSignIn()} />
      </Route>
      <Route
        path={routes.toEmailVerification()}
        component={
          isNewSignupEnabled() ? EmailVerifyPageWithIntent : VerifyEmailPage
        }
      />
      <Route path={routes.toCompleteInvite()} component={CompleteInvitePage} />
    </>
  );
};

const globalResponseHandler = (response: Response): void => {
  if (!response.ok) {
    switch (response.status) {
      case 429:
        response
          .clone()
          .json()
          .then((res) => {
            toast.error(res.message || TOO_MANY_REQUESTS_MESSAGE);
          });
    }
  }
};

export function App(): React.ReactElement {
  initializeApp();

  const renderRoutes = () => {
    if (isCommunityPlan()) {
      return <AppWithCommunityRoutes />;
    }

    if (isOnPrem()) {
      return <AppWithOnPremRoutes />;
    }

    return <AppWithSaasRoutes />;
  };

  return (
    <FFContextProvider
      apiKey={window.featureFlagsToken}
      target={{
        identifier: getUniqueIdForFF(),
        attributes: {
          experiment: EXPERIMENTS.SIGNUP_PAGE
        }
      }}
    >
      <RestfulProvider base="/" onResponse={globalResponseHandler}>
        <AppErrorBoundary>
          <Toaster />
          <HashRouter>
            <Switch>{renderRoutes()}</Switch>
          </HashRouter>
        </AppErrorBoundary>
      </RestfulProvider>
    </FFContextProvider>
  );
}
