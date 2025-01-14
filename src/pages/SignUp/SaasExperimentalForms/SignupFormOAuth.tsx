/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from "react";
import cx from "classnames";
import google from "static/icons/google.svg";
import github from "static/icons/github.svg";
import css from "../SignUp.module.css";
import LargeOAuthButton from "./LargeOAuthButton";
import { OAuthLink } from "components/AuthFooter/AuthFooter";
import {
  OAuthProviders,
  OAuthProviderType,
  OAUTH_PROVIDERS_BY_NAME_MAP
} from "interfaces/OAuthProviders";
import SecureStorage from "utils/SecureStorage";
import {
  getGaClientID,
  addTrackingParams,
  getOAuthFinalUrl,
  getSavedRefererURL,
  enabledOauthProviders,
  getMutinyVisitorToken
} from "utils/SignUpUtils";
import telemetry from "telemetry/Telemetry";
import { CATEGORY, EVENT } from "utils/TelemetryUtils";

const SignupFormOAuth = ({
  changeFormType
}: {
  changeFormType: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  className?: string;
}): React.ReactElement => {
  const accountId = SecureStorage.getItem("acctId") as string;

  const gotoAuth = (provider: OAuthProviderType) => {
    telemetry.track({
      event: EVENT.OAUTH_CLICKED,
      properties: {
        category: CATEGORY.SIGNUP,
        oauthProvider: provider.name
      }
    });
    const finalOauthURL = addTrackingParams(
      getOAuthFinalUrl(provider.url, accountId, true),
      getSavedRefererURL(),
      getGaClientID(),
      getMutinyVisitorToken()
    );

    window.location.href = finalOauthURL;
  };
  return (
    <div className={css.oAuthForm}>
      <LargeOAuthButton
        icon={google}
        iconClassName={css.buttonImage}
        className={cx(css.oauthgoogle)}
        text="Continue with Google"
        onClick={() => gotoAuth(OAUTH_PROVIDERS_BY_NAME_MAP.GOOGLE)}
      />
      <LargeOAuthButton
        icon={github}
        iconClassName={cx(css.buttonImage)}
        className={cx(css.oauthgoogle)}
        text="Continue with Github"
        onClick={() => gotoAuth(OAUTH_PROVIDERS_BY_NAME_MAP.GITHUB)}
      />
      <div className={css.oAuthSection}>
        <div>
          <div
            className={cx(
              {
                "layout-horizontal spacing-auto": true,
                [css.fullButtons]: true
              },
              css.oAuthIcons,
              css.oAuthForm,
              css.sectionWidth
            )}
          >
            {OAuthProviders.filter((provider) =>
              // if a list is provided, filter on that, otherwise show all
              enabledOauthProviders
                ? enabledOauthProviders.includes(provider.type)
                : true
            ).map((oAuthProvider: OAuthProviderType) => (
              <OAuthLink
                key={oAuthProvider.name}
                isOauthSignup
                oAuthProvider={oAuthProvider}
                accountId={accountId}
              />
            ))}
          </div>
          <h2 className={cx(css.lineMessage, css.sectionWidth)}>
            <span className={css.message}>OR</span>
          </h2>
        </div>
      </div>
      <LargeOAuthButton
        onClick={changeFormType}
        iconClassName={cx(css.buttonImage, css.iconInverse)}
        text="Sign up with Email"
        className={css.signupWithEmailButton}
      />
    </div>
  );
};
export default SignupFormOAuth;
