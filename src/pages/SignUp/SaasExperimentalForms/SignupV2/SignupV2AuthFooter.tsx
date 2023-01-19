/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import Text from "components/Text/Text";
import { URLS } from "interfaces/OAuthProviders";
import React from "react";
import { Link } from "react-router-dom";
import RouteDefinitions from "RouteDefinitions";
import css from "./SignupV2.module.css";
export default function SignupV2AuthFooter(): JSX.Element {
  return (
    <>
      <div className={css.disclaimer}>
        By signing up, you agree to our&nbsp;
        <a
          className={css.externalLink}
          href={URLS.PRIVACY_AGREEMENT}
          rel="noreferrer"
          target="_blank"
        >
          Privacy Policy&nbsp;
        </a>
        and our&nbsp;
        <a
          className={css.externalLink}
          href={URLS.SUBSCRIPTION_TERMS}
          rel="noreferrer"
          target="_blank"
        >
          Terms of Use
        </a>
      </div>
      <div className={css.signinlink}>
        <span className={css.accountdisclaimer}>Already have an account?</span>

        <Link className={css.signinanchor} to={RouteDefinitions.toSignIn()}>
          <Text>Sign in</Text>
        </Link>
      </div>
    </>
  );
}
