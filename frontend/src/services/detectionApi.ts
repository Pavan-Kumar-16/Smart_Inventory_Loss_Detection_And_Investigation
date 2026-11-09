import { request } from "./apiClient";
import type {
  ShrinkageDetectionResult,
  RepeatedAdjustmentResult,
  TransferInconsistencyResult,
  AnomalyValidationResult,
} from "../types";

export const detectionApi = {
  runShrinkageDetection: () =>
    request<ShrinkageDetectionResult>("/api/detection/run", {
      method: "POST",
    }),

  runRepeatedAdjustments: () =>
    request<RepeatedAdjustmentResult>("/api/detection/repeated-adjustments", {
      method: "POST",
    }),

  runTransferInconsistencies: () =>
    request<TransferInconsistencyResult>("/api/detection/transfer-inconsistencies", {
      method: "POST",
    }),

  validateAnomalies: () =>
    request<AnomalyValidationResult>("/api/detection/validate-anomalies", {
      method: "POST",
    }),
};

