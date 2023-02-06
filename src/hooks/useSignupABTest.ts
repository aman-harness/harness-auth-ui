/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useFeatureFlag } from "@harnessio/ff-react-client-sdk";
import { useEffect } from "react";
import { EVENT, FF_MAP } from "utils/TelemetryUtils";
import telemetry from "telemetry/Telemetry";
export enum FLAG_VARIANTS {
  VARIANT_A = "VARIANT_A",
  VARIANT_B = "VARIANT_B"
}
export default function useSignupABTest({
  runTest
}: {
  runTest?: boolean;
}): string {
  const flagVariant = useFeatureFlag(FF_MAP.TEST_AE_SIGNUP);
  useEffect(() => {
    runTest &&
      telemetry.track({
        event: EVENT.EXPOSURE,
        properties: {
          flag_key: FF_MAP.TEST_AE_SIGNUP,
          variant: flagVariant
        }
      });
  }, []);
  return runTest ? flagVariant : FLAG_VARIANTS.VARIANT_A;
}
