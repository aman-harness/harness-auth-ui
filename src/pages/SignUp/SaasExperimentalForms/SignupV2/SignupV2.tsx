/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from "react";
import cx from "classnames";
import {
  OAUTH_PROVIDERS_BY_NAME_MAP,
  OAuthProviderType
} from "interfaces/OAuthProviders";
import LargeOAuthButton from "../LargeOAuthButton";
import logo from "static/images/harness-logo.svg";

import google from "static/icons/google.svg";
import github from "static/icons/github.svg";
import ancestory from "static/images/ancestory.svg";
import redbull from "static/images/redbull.svg";
import buildcom from "static/images/buildcom.svg";
import ebay from "static/images/ebay.svg";

import SecureStorage from "utils/SecureStorage";
import {
  addTrackingParams,
  getOAuthFinalUrl,
  getSavedRefererURL,
  getGaClientID,
  BillingFrequency,
  Edition,
  getCookieByName,
  SignupAction,
  getMutinyVisitorToken
} from "utils/SignUpUtils";
import { EVENT, CATEGORY, PAGE } from "utils/TelemetryUtils";

import telemetry from "telemetry/Telemetry";
import css from "./SignupV2.module.css";
import signupcss from "../../SignUp.module.css";
import { useHistory } from "react-router-dom";
import RouteDefinitions from "RouteDefinitions";
import SignupFormWithCredentials from "../SignupFormWithCredentials";
import ReCAPTCHA from "react-google-recaptcha";
import { SignUpFormData, SIGNUPFORM_TYPES } from "../SignUpExperimental";
import { useQueryParams } from "hooks/useQueryParams";
import { VERIFY_EMAIL_STATUS } from "pages/VerifyEmail/VerifyEmailStatus";
import { useSignup, SignupDTO } from "services/ng";
import { handleError } from "utils/ErrorUtils";
import { debounceFn, updateReferer } from "../utils";
import SignupV2AuthFooter from "./SignupV2AuthFooter";

export default function SignupV2(): JSX.Element {
  const [formType, setFormType] = useState<SIGNUPFORM_TYPES>(
    SIGNUPFORM_TYPES.OAUTH_FORM
  );
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const history = useHistory();
  const [signupData, setSignupData] = useState({ email: "", password: "" });
  const { mutate: signup, loading } = useSignup({});
  const captchaRef = useRef<ReCAPTCHA>(null);
  const {
    module,
    signupAction,
    edition,
    billingFrequency,
    utm_source,
    utm_content,
    utm_medium,
    utm_term,
    utm_campaign
  } = useQueryParams<{
    module?: string;
    signupAction?: string;
    edition?: string;
    billingFrequency?: string;
    utm_source?: string;
    utm_content?: string;
    utm_medium?: string;
    utm_term?: string;
    utm_campaign?: string;
  }>();

  const utmCampaign = utm_campaign || getCookieByName("utm_campaign") || "";
  const utmSource = utm_source || getCookieByName("utm_source") || "";
  const utmContent = utm_content || getCookieByName("utm_content") || "";
  const utmMedium = utm_medium || getCookieByName("utm_medium") || "";
  const utmTerm = utm_term || getCookieByName("utm_term") || "";

  const [captchaExecuting, setCaptchaExecuting] = useState(false);
  useEffect(() => {
    const { email, password } = signupData;

    if (email && password && captchaToken) {
      setCaptchaExecuting(false);
      handleSignup(signupData, captchaToken);
    }
  }, [captchaToken]);

  const handleSignup = async (
    data: SignUpFormData,
    captchaToken: string
  ): Promise<void> => {
    const encodedEmail = encodeURIComponent(data.email);

    try {
      const signupRequestData: SignupDTO = {
        ...data,
        intent: module,
        utmInfo: {
          utmSource,
          utmContent,
          utmMedium,
          utmTerm,
          utmCampaign
        }
      };

      if (signupAction && signupAction.toUpperCase() in SignupAction) {
        signupRequestData.signupAction = signupAction.toUpperCase() as SignupAction;
      }

      if (edition && edition.toUpperCase() in Edition) {
        signupRequestData.edition = edition.toUpperCase() as Edition;
      }

      if (
        billingFrequency &&
        billingFrequency.toUpperCase() in BillingFrequency
      ) {
        signupRequestData.billingFrequency = billingFrequency.toUpperCase() as BillingFrequency;
      }

      await signup(signupRequestData, {
        queryParams: { captchaToken: captchaToken }
      });

      history.push({
        pathname: RouteDefinitions.toEmailVerification(),
        search: `?status=${VERIFY_EMAIL_STATUS.EMAIL_SENT}&email=${encodedEmail}&module=${module}`
      });
    } catch (error) {
      captchaRef.current?.reset();

      if (
        error?.data?.responseMessages?.length &&
        error?.data?.responseMessages[0]?.code === "USER_ALREADY_REGISTERED"
      ) {
        history.push({
          pathname: RouteDefinitions.toEmailVerification(),
          search: `?status=${VERIFY_EMAIL_STATUS.SIGNED_UP}&email=${encodedEmail}&module=${module}`
        });
      } else {
        handleError(error);
      }
    }
  };

  const manuallyExcecuteRecaptcha = (): boolean => {
    if (captchaRef.current?.execute) {
      captchaRef.current.execute();
      setCaptchaExecuting(true);
      return true;
    }

    handleError("Captcha failed to execute");
    return false;
  };

  const onSubmit = debounceFn((data: SignUpFormData) => {
    if (manuallyExcecuteRecaptcha()) {
      data.email = data.email.toLowerCase();
      setSignupData(data);
      telemetry.track({
        event: EVENT.SIGNUP_SUBMIT,
        properties: {
          intent: module || "",
          category: CATEGORY.SIGNUP,
          userId: data.email,
          utm_source: utmSource,
          utm_content: utmContent,
          utm_medium: utmMedium,
          utm_term: utmTerm,
          utm_campaign: utmCampaign
        }
      });
    }
  });

  useEffect(() => {
    updateReferer();
    const refererURL = getSavedRefererURL();
    telemetry.page({
      name: PAGE.SIGNUP_PAGE,
      properties: {
        intent: module || "",
        utm_source: utm_source || "",
        utm_medium: utm_medium || "",
        utm_campaign: utm_campaign || "",
        utm_term: utm_term || "",
        utm_content: utm_content || "",
        ...(refererURL ? { refererURL } : {})
      }
    });
  }, []);

  function handleRecaptchaError() {
    // Block the user until they refresh
    setCaptchaExecuting(true);
    handleError("Captcha has failed, please refresh the page.");
  }
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
    <div className={css.signupmain}>
      <div className={css.header}>
        <img src={logo} width={120} className={css.logo} />
      </div>
      <div className={css.content}>
        <div
          className={cx(css.signupOAuthCard, {
            [css.signupformcard]: formType === SIGNUPFORM_TYPES.CREDENTIAL_FORM
          })}
        >
          <div className={css.title}>Get Started for free!</div>
          <div className={css.oAuthForm}>
            {formType === SIGNUPFORM_TYPES.OAUTH_FORM ? (
              <>
                <LargeOAuthButton
                  icon={google}
                  iconClassName={signupcss.buttonImage}
                  className={cx(signupcss.oauthgoogle)}
                  text="Continue with Google"
                  onClick={() => gotoAuth(OAUTH_PROVIDERS_BY_NAME_MAP.GOOGLE)}
                />
                <LargeOAuthButton
                  icon={github}
                  iconClassName={cx(signupcss.buttonImage)}
                  className={cx(signupcss.oauthgoogle, css.secondarybutton)}
                  text="Continue with Github"
                  onClick={() => gotoAuth(OAUTH_PROVIDERS_BY_NAME_MAP.GITHUB)}
                />

                <div>
                  <h2 className={cx(css.lineMessage, css.sectionWidth)}>
                    <span className={css.message}>or</span>
                  </h2>
                </div>

                <LargeOAuthButton
                  onClick={() => setFormType(SIGNUPFORM_TYPES.CREDENTIAL_FORM)}
                  iconClassName={cx(
                    signupcss.buttonImage,
                    signupcss.iconInverse
                  )}
                  text="Sign up with Email"
                  className={cx(signupcss.oauthgoogle, css.secondarybutton)}
                />
              </>
            ) : (
              <SignupFormWithCredentials
                onSubmit={onSubmit}
                loading={loading}
                captchaExecuting={captchaExecuting}
                captchaRef={captchaRef}
                setCaptchaToken={setCaptchaToken}
                handleRecaptchaError={handleRecaptchaError}
                oAuthBtnsclassName={css.oAuthBtnsclassName}
              />
            )}
            <SignupV2AuthFooter />
          </div>
        </div>
        <div className={css.detailsection}>
          <div className={css.title} id="harnesscta">
            The Modern Software Delivery Platform
          </div>
          <ul className={css.features}>
            <li id="cta1">CI, CD, Feature Flags, Cloud Costs, etc.</li>
            <li id="cta2">AI/ML-Driven Workflows</li>
            <li id="cta3"> Developer-First Experience</li>
          </ul>
          <div className={css.devcta} id="tagline">
            LOVED BY DEVELOPERS, TRUSTED BY BUSINESSES
          </div>
          <div className={css.logolist} id="logolist">
            <img src={ebay} width={60} />
            <img src={redbull} width={60} />
            <img src={ancestory} className={css.ancestrylogo} width={80} />
            <img src={buildcom} width={60} />
          </div>
        </div>
      </div>
    </div>
  );
}
